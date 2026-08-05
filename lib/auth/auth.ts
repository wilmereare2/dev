import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { parseRole } from "@/lib/auth/roles";
import { verifyPassword } from "@/lib/auth/password";
import { resolveDbUserId } from "@/lib/auth/resolve-db-user";
import { avatarSessionUrl } from "@/lib/user/avatar";
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
    },
  },
  callbacks: {
    async signIn({ user, account }) {
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
        token.role = parseRole(user.role) ?? "USER";
        token.name = user.name ?? token.name;
        if (user.image && !user.image.startsWith("data:")) {
          token.picture = user.image;
        }
        try {
          token.avatarVersion = await loadAvatarVersion(user.id);
          const compliance = await getComplianceStatus(user.id);
          token.compliant = compliance.compliant;
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("[auth] jwt user bootstrap failed:", error);
          }
          token.avatarVersion = 0;
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
        } catch {
          token.avatarVersion = 0;
        }
      }

      if (trigger === "update" && session) {
        const update = session as {
          name?: string | null;
          avatarVersion?: number;
          image?: string | null;
          role?: string;
        };
        if (update.name !== undefined) token.name = update.name ?? undefined;
        if (update.avatarVersion !== undefined) {
          token.avatarVersion = update.avatarVersion;
        } else if (update.image !== undefined) {
          token.avatarVersion = update.image ? Date.now() : 0;
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
      }
      return session;
    },
  },
});
