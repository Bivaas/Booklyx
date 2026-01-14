import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import mongoClientPromise from "@/lib/mongo-client";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import bcrypt from "bcryptjs";

// Lazy-load env vars at request time, not module load time
// This ensures runtime = "nodejs" is enforced before env access
function getAuthConfig() {
  const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_SECRET;
  const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  const authUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  // Note: Google provider is optional; email signup works without it
  return { googleId, googleSecret, authSecret, authUrl };
}

const { googleId, googleSecret, authSecret, authUrl } = getAuthConfig();

const providers: any[] = [];

// Google provider (optional, may not work due to env var issues)
if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      allowDangerousEmailAccountLinking: false,
    })
  );
}

// Credentials provider for email OTP sign in
providers.push(
  Credentials({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "user@example.com" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      await connectDb();
      const user = await User.findOne({ email: credentials.email, emailVerified: true });
      
      if (!user) {
        throw new Error("No account found. Please sign up first.");
      }

      if (!user.password) {
        throw new Error("Invalid login method. Please use the correct sign-in option.");
      }

      const passwordMatch = await bcrypt.compare(credentials.password, user.password);
      
      if (!passwordMatch) {
        throw new Error("Invalid password");
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: null,
      };
    },
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
