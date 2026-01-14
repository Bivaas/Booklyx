import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import mongoClientPromise from "@/lib/mongo-client";

// Read directly from process.env to ensure Vercel vars are picked up
const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_SECRET;
const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
const authUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

// Verify required credentials at module load time
if (!googleId || !googleSecret) {
  throw new Error(
    "FATAL: AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set. " +
    `Got googleId=${googleId ? "set" : "MISSING"}, googleSecret=${googleSecret ? "set" : "MISSING"}`
  );
}

const providers: any[] = [];

// Always register Google provider
providers.push(
  Google({
    clientId: googleId,
    clientSecret: googleSecret,
    // SECURITY: Disabled dangerous email account linking
    allowDangerousEmailAccountLinking: false,
  })
);

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: MongoDBAdapter(mongoClientPromise),
  providers: providers.length > 0 ? providers : [],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = (user as any).id;
      }
      return session;
    },
  },
};

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions as any);
}
