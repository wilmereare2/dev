import { prisma } from "@/lib/db/prisma";
import type { GroupMessagePayload, MemberGroupPayload } from "@/lib/chat/constants";

const userSelect = { id: true, name: true, image: true, role: true } as const;
const MAX_GROUP_MEMBERS = 25;
const MAX_GROUP_NAME = 80;

export type GroupVisibility = "private" | "public";

function serializeUser(user: {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    image: user.image,
    role: user.role,
  };
}

function serializeGroupMessage(message: {
  id: string;
  body: string;
  createdAt: Date;
  sender: { id: string; name: string | null; image: string | null; role: string };
}): GroupMessagePayload {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    sender: serializeUser(message.sender),
  };
}

function parseVisibility(value: string): GroupVisibility | null {
  return value === "private" || value === "public" ? value : null;
}

async function isBlocked(userA: string, userB: string) {
  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userA, blockedId: userB },
        { blockerId: userB, blockedId: userA },
      ],
    },
    select: { id: true },
  });
  return Boolean(block);
}

export async function userInMemberGroup(groupId: string, userId: string) {
  const membership = await prisma.memberGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  return Boolean(membership);
}

async function getGroupOwnerId(groupId: string) {
  const owner = await prisma.memberGroupMember.findFirst({
    where: { groupId, role: "owner" },
    select: { userId: true },
  });
  return owner?.userId ?? null;
}

function mapGroup(
  group: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    archivedAt: Date | null;
    updatedAt: Date;
    createdById: string;
    _count: { members: number };
    messages: Array<{
      id: string;
      body: string;
      createdAt: Date;
      sender: { id: string; name: string | null; image: string | null; role: string };
    }>;
  },
): MemberGroupPayload {
  const last = group.messages[0];
  const visibility = parseVisibility(group.visibility) ?? "private";

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    visibility,
    archivedAt: group.archivedAt?.toISOString() ?? null,
    updatedAt: group.updatedAt.toISOString(),
    memberCount: group._count.members,
    createdById: group.createdById,
    lastMessage: last ? serializeGroupMessage(last) : null,
  };
}

const groupInclude = {
  _count: { select: { members: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: { select: userSelect } },
  },
};

export async function listMemberGroups(
  userId: string,
  options?: { includeArchived?: boolean },
): Promise<MemberGroupPayload[]> {
  const memberships = await prisma.memberGroupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const groupIds = memberships.map((entry) => entry.groupId);
  if (!groupIds.length) return [];

  const groups = await prisma.memberGroup.findMany({
    where: {
      id: { in: groupIds },
      ...(options?.includeArchived ? {} : { archivedAt: null }),
    },
    orderBy: { updatedAt: "desc" },
    include: groupInclude,
  });

  return groups.map(mapGroup);
}

export async function listDiscoverablePublicGroups(userId: string): Promise<MemberGroupPayload[]> {
  const groups = await prisma.memberGroup.findMany({
    where: {
      visibility: "public",
      archivedAt: null,
      members: { none: { userId } },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: groupInclude,
  });

  return groups.map(mapGroup);
}

export async function createMemberGroup(
  creatorId: string,
  input: {
    name: string;
    description?: string | null;
    memberIds: string[];
    visibility?: string;
  },
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (name.length < 2) {
    return { ok: false, error: "Group name must be at least 2 characters." };
  }
  if (name.length > MAX_GROUP_NAME) {
    return { ok: false, error: "Group name is too long." };
  }

  const visibility = parseVisibility(input.visibility ?? "private");
  if (!visibility) {
    return { ok: false, error: "Choose private or public access." };
  }

  const uniqueMemberIds = [...new Set(input.memberIds.filter((id) => id !== creatorId))];
  if (uniqueMemberIds.length + 1 > MAX_GROUP_MEMBERS) {
    return { ok: false, error: `Groups can have up to ${MAX_GROUP_MEMBERS} members.` };
  }

  for (const memberId of uniqueMemberIds) {
    if (await isBlocked(creatorId, memberId)) {
      return { ok: false, error: "One or more selected members cannot be added." };
    }
  }

  const existingUsers = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });
  if (existingUsers.length !== uniqueMemberIds.length) {
    return { ok: false, error: "One or more selected members were not found." };
  }

  const group = await prisma.memberGroup.create({
    data: {
      name,
      description: input.description?.trim() || null,
      visibility,
      createdById: creatorId,
      members: {
        create: [
          { userId: creatorId, role: "owner" },
          ...uniqueMemberIds.map((userId) => ({ userId, role: "member" })),
        ],
      },
    },
    include: groupInclude,
  });

  return { ok: true, group: mapGroup(group) };
}

export async function joinPublicGroup(
  groupId: string,
  userId: string,
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const group = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    select: { id: true, visibility: true, archivedAt: true, _count: { select: { members: true } } },
  });

  if (!group || group.archivedAt) {
    return { ok: false, error: "Group not found." };
  }
  if (group.visibility !== "public") {
    return { ok: false, error: "This group is private. Ask the owner for an invite." };
  }
  if (group._count.members >= MAX_GROUP_MEMBERS) {
    return { ok: false, error: "This group is full." };
  }
  if (await userInMemberGroup(groupId, userId)) {
    return { ok: false, error: "You are already in this group." };
  }

  await prisma.memberGroupMember.create({
    data: { groupId, userId, role: "member" },
  });

  const updated = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    include: groupInclude,
  });

  if (!updated) return { ok: false, error: "Group not found." };
  return { ok: true, group: mapGroup(updated) };
}

export async function setGroupArchived(
  groupId: string,
  userId: string,
  archived: boolean,
): Promise<{ ok: true; group: MemberGroupPayload } | { ok: false; error: string }> {
  const ownerId = await getGroupOwnerId(groupId);
  if (!ownerId || ownerId !== userId) {
    return { ok: false, error: "Only the group owner can archive or restore this group." };
  }

  const updated = await prisma.memberGroup.update({
    where: { id: groupId },
    data: { archivedAt: archived ? new Date() : null },
    include: groupInclude,
  });

  return { ok: true, group: mapGroup(updated) };
}

async function assertActiveGroupMember(groupId: string, userId: string) {
  const group = await prisma.memberGroup.findUnique({
    where: { id: groupId },
    select: { archivedAt: true, members: { where: { userId }, select: { id: true } } },
  });

  if (!group?.members.length) return { ok: false as const, error: "Group not found." };
  if (group.archivedAt) return { ok: false as const, error: "This group is archived." };
  return { ok: true as const };
}

export async function listGroupMessages(
  groupId: string,
  userId: string,
  limit = 50,
): Promise<{ ok: true; messages: GroupMessagePayload[] } | { ok: false; error: string }> {
  const access = await assertActiveGroupMember(groupId, userId);
  if (!access.ok) return access;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { sender: { select: userSelect } },
  });

  return { ok: true, messages: messages.reverse().map(serializeGroupMessage) };
}

export async function createGroupMessage(
  groupId: string,
  senderId: string,
  body: string,
): Promise<{ ok: true; message: GroupMessagePayload } | { ok: false; error: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty." };
  if (trimmed.length > 2000) return { ok: false, error: "Message is too long." };

  const access = await assertActiveGroupMember(groupId, senderId);
  if (!access.ok) return access;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.groupMessage.create({
      data: {
        groupId,
        senderId,
        body: trimmed,
      },
      include: { sender: { select: userSelect } },
    });

    await tx.memberGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    return created;
  });

  return { ok: true, message: serializeGroupMessage(message) };
}
