import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: Role;
      compliant?: boolean;
      avatarScale?: number;
    } & DefaultSession["user"];
    avatarVersion?: number;
    role?: Role;
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    compliant?: boolean;
    name?: string | null;
    picture?: string | null;
    dbSynced?: boolean;
    avatarVersion?: number;
    avatarScale?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    compliant?: boolean;
    name?: string | null;
    picture?: string | null;
    dbSynced?: boolean;
    avatarVersion?: number;
    avatarScale?: number;
  }
}
