import NextAuth from "next-auth";
import { Role } from "@/lib/models/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      emailVerified: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    emailVerified?: boolean;
    businessId?: any;
  }
}

