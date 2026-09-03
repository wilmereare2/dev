import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/types";
import { parseRole } from "@/lib/auth/roles";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type CustomerListItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  accountStatus: string;
  emailVerified: string | null;
  createdAt: string;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  openTickets: number;
  isCreator: boolean;
  creatorVerificationStatus: string | null;
  suspendedAt: string | null;
};

export type CustomerSearchResult = {
  customers: CustomerListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function searchCustomers(input: {
  q?: string;
  role?: string;
  accountStatus?: string;
  page?: number;
  pageSize?: number;
}): Promise<CustomerSearchResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  const where: {
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
    role?: string;
    accountStatus?: string;
  } = {};

  const query = input.q?.trim();
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  if (input.role && input.role !== "all") {
    where.role = input.role;
  }

  if (input.accountStatus && input.accountStatus !== "all") {
    where.accountStatus = input.accountStatus;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        emailVerified: true,
        createdAt: true,
        suspendedAt: true,
        bannedAt: true,
        subscriptions: {
          orderBy: { currentPeriodEnd: "desc" },
          take: 1,
          select: {
            status: true,
            plan: { select: { name: true } },
          },
        },
        creatorProfile: {
          select: {
            verificationStatus: true,
            suspendedAt: true,
          },
        },
        _count: {
          select: {
            tickets: { where: { status: "open" } },
          },
        },
      },
    }),
  ]);

  return {
    customers: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      subscriptionStatus: user.subscriptions[0]?.status ?? null,
      subscriptionPlan: user.subscriptions[0]?.plan.name ?? null,
      openTickets: user._count.tickets,
      isCreator: Boolean(user.creatorProfile),
      creatorVerificationStatus: user.creatorProfile?.verificationStatus ?? null,
      suspendedAt: user.creatorProfile?.suspendedAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomerDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      suspendedAt: true,
      bannedAt: true,
      banReason: true,
      lastSeenAt: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      settings: {
        select: {
          bio: true,
          locale: true,
          dateOfBirth: true,
          ageVerifiedAt: true,
          ageVerificationMethod: true,
          emailNotifications: true,
          marketingEmails: true,
        },
      },
      twoFactor: { select: { enabled: true } },
      termsAccepted: {
        orderBy: { acceptedAt: "desc" },
        take: 1,
        select: {
          termsVersion: true,
          privacyVersion: true,
          acceptedAt: true,
          ipAddress: true,
        },
      },
      subscriptions: {
        orderBy: { currentPeriodEnd: "desc" },
        include: { plan: true },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      creatorProfile: true,
      creatorSubscriptionsAsSubscriber: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          creator: { select: { id: true, name: true, email: true } },
        },
      },
      contentPurchases: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: {
          upload: { select: { id: true, title: true, status: true } },
        },
      },
      tipsSent: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          toCreator: { select: { id: true, name: true, email: true } },
        },
      },
      tipsReceived: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
        },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          bookmarks: true,
          watchHistory: true,
          creatorFollows: true,
          contentLikes: true,
          creatorUploads: true,
          blockedUsers: true,
          blockedBy: true,
        },
      },
    },
  });

  if (!user) return null;

  const reportsAgainst = await prisma.contentReport.findMany({
    where: { targetUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
      reporter: { select: { id: true, name: true, email: true } },
    },
  });

  return { ...user, reportsAgainst };
}

export async function updateCustomer(
  userId: string,
  input: { role?: Role; suspend?: boolean; suspensionReason?: string },
  actorRole: Role,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creatorProfile: true },
  });

  if (!user) return { ok: false as const, error: "Customer not found." };

  if (input.role !== undefined) {
    if (actorRole !== "ADMIN") {
      return { ok: false as const, error: "Only admins can change roles." };
    }

    const nextRole = parseRole(input.role);
    if (!nextRole) {
      return { ok: false as const, error: "Invalid role." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
    });
  }

  if (input.suspend !== undefined && user.creatorProfile) {
    if (input.suspend) {
      await prisma.creatorProfile.update({
        where: { userId },
        data: {
          suspendedAt: new Date(),
          suspensionReason: input.suspensionReason?.trim() || "Suspended by administrator",
        },
      });
    } else {
      await prisma.creatorProfile.update({
        where: { userId },
        data: {
          suspendedAt: null,
          suspensionReason: null,
        },
      });
    }
  }

  return { ok: true as const };
}
