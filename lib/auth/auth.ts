import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { parseRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";

/**
 * Auth.js (NextAuth v5) foundation.
 * Phase 1 wires the adapter + credentials stub.
 * Full email/password + OAuth land in Phase 3.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
      authorize: async () => {
        // Phase 3: verify passwordHash via bcrypt/argon2
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = parseRole(user.role) ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = parseRole(token.role);
      }
      return session;
    },
  },
});
