import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { parseRole } from "@/lib/auth/roles";
import { ensureDesignatedAdminAccess } from "@/lib/auth/provision-admin";
import { isDesignatedAdminEmail } from "@/lib/auth/admin-email";
import { verifyPassword } from "@/lib/auth/password";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { avatarSessionUrl, clampAvatarFocus, clampAvatarScale, normalizeAvatarFraming } from "@/lib/user/avatar";
import { getComplianceStatus } from "@/services/user/compliance";
import { prisma } from "@/lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

async function loadAvatarVersion(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, updatedAt: true },
  });
  return user?.image ? user.updatedAt.getTime() : 0;
}

async function loadAvatarFraming(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { avatarScale: true, avatarFocusX: true, avatarFocusY: true },
  });
  return normalizeAvatarFraming({
    scale: settings?.avatarScale,
    focusX: settings?.avatarFocusX,
    focusY: settings?.avatarFocusY,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const email = parsed.data.email.trim().toLowerCase();
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          const valid = await verifyPassword(parsed.data.password, user.passwordHash);
          if (!valid) return null;

          if (!user.emailVerified) return null;
          if (process.env.NODE_ENV === "production" && user.phone && !user.phoneVerified) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: parseRole(user.role) ?? "USER",
          };
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth] credentials authorize failed:", error);
          }
          return null;
        }
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.userSettings.create({ data: { userId: user.id } });

      if (isDesignatedAdminEmail(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN", emailVerified: new Date() },
        });
        await ensureDesignatedAdminAccess(user.id, user.email);
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user.id && user.email) {
        await ensureDesignatedAdminAccess(user.id, user.email);
      }

      if (account?.provider === "google" && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = parseRole(dbUser?.role) ?? parseRole(user.role) ?? "USER";
        } catch {
          token.role = parseRole(user.role) ?? "USER";
        }
        token.name = user.name ?? token.name;
        if (user.image && !user.image.startsWith("data:")) {
          token.picture = user.image;
        }
        try {
          token.avatarVersion = await loadAvatarVersion(user.id);
          const framing = await loadAvatarFraming(user.id);
          token.avatarScale = framing.scale;
          token.avatarFocusX = framing.focusX;
          token.avatarFocusY = framing.focusY;
          const compliance = await getComplianceStatus(user.id);
          token.compliant = compliance.compliant;
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth] jwt user bootstrap failed:", error);
          }
          token.avatarVersion = 0;
          token.avatarScale = 100;
          token.avatarFocusX = 0;
          token.avatarFocusY = 0;
          token.compliant = false;
        }
        token.dbSynced = true;
      }

      if (!token.dbSynced && token.sub) {
        try {
          const resolvedId = await resolveDbUserId({
            id: token.sub,
            email: typeof token.email === "string" ? token.email : null,
          });
          if (resolvedId) {
            token.sub = resolvedId;
            token.avatarVersion = await loadAvatarVersion(resolvedId);
            const framing = await loadAvatarFraming(resolvedId);
            token.avatarScale = framing.scale;
            token.avatarFocusX = framing.focusX;
            token.avatarFocusY = framing.focusY;
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth] jwt db sync failed:", error);
          }
        }
        token.dbSynced = true;
      }

      if (token.sub && typeof token.avatarVersion !== "number") {
        try {
          token.avatarVersion = await loadAvatarVersion(token.sub);
          const framing = await loadAvatarFraming(token.sub);
          token.avatarScale = framing.scale;
          token.avatarFocusX = framing.focusX;
          token.avatarFocusY = framing.focusY;
        } catch {
          token.avatarVersion = 0;
          token.avatarScale = 100;
          token.avatarFocusX = 0;
          token.avatarFocusY = 0;
        }
      }

      if (trigger === "update" && session) {
        const update = session as {
          name?: string | null;
          avatarVersion?: number;
          avatarScale?: number;
          avatarFocusX?: number;
          avatarFocusY?: number;
          image?: string | null;
          role?: string;
        };
        if (update.name !== undefined) token.name = update.name ?? undefined;
        if (update.avatarVersion !== undefined) {
          token.avatarVersion = update.avatarVersion;
        } else if (update.image !== undefined) {
          token.avatarVersion = update.image ? Date.now() : 0;
        }
        if (update.avatarScale !== undefined) {
          token.avatarScale = clampAvatarScale(update.avatarScale);
        }
        if (update.avatarFocusX !== undefined) {
          token.avatarFocusX = clampAvatarFocus(update.avatarFocusX);
        }
        if (update.avatarFocusY !== undefined) {
          token.avatarFocusY = clampAvatarFocus(update.avatarFocusY);
        }
        if (update.role !== undefined) {
          token.role = parseRole(update.role) ?? token.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = parseRole(token.role);
        session.user.compliant = Boolean(token.compliant);
        session.user.name = token.name ?? session.user.name;

        const avatarVersion = typeof token.avatarVersion === "number" ? token.avatarVersion : 0;
        if (avatarVersion > 0) {
          session.user.image = avatarSessionUrl(avatarVersion);
        } else if (
          typeof token.picture === "string" &&
          token.picture.length > 0 &&
          !token.picture.startsWith("data:")
        ) {
          session.user.image = token.picture;
        } else {
          session.user.image = null;
        }

        session.user.avatarScale =
          typeof token.avatarScale === "number" ? clampAvatarScale(token.avatarScale) : 100;
        session.user.avatarFocusX =
          typeof token.avatarFocusX === "number" ? clampAvatarFocus(token.avatarFocusX) : 0;
        session.user.avatarFocusY =
          typeof token.avatarFocusY === "number" ? clampAvatarFocus(token.avatarFocusY) : 0;
      }
      return session;
    },
  },
});
