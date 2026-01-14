import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import mongoClientPromise from "@/lib/mongo-client";
import env from "@/lib/env";

const providers: any[] = [];

// Only add Google provider if credentials are available
const googleId = env.AUTH_GOOGLE_ID || process.env.GOOGLE_ID;
const googleSecret = env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_SECRET;

if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      // SECURITY: Disabled dangerous email account linking
      // Users cannot link Google OAuth to OTP-verified accounts
      // This prevents social engineering attacks
      allowDangerousEmailAccountLinking: false,
    })
  );
}

// Provide a default provider stub for development if no providers configured
if (providers.length === 0) {
  const message = "No authentication providers configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.";
  if (process.env.NODE_ENV === "development") {
    console.warn(message);
  } else {
    throw new Error(message);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(mongoClientPromise),
  providers: providers.length > 0 ? providers : [],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
});
