import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";
import { trackDeviceLogin } from "@/lib/device-tracker";
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

const { googleId, googleSecret, authSecret } = getAuthConfig();

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
    async authorize(credentials, req) {
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

      // TODO: session invalidation on password change must be enforced in the jwt
      // callback by comparing token.iat against user.passwordChangedAt. The check
      // previously here compared passwordChangedAt against Date.now() and could
      // never fire.

      // Track device login
      // Extract IP and user-agent from headers
      // NextAuth authorize callback may receive headers as Headers instance or plain object
      const headers = req.headers as any;
      const getHeader = (name: string): string | undefined => {
        if (typeof headers?.get === "function") return headers.get(name) ?? undefined;
        return headers?.[name] as string | undefined;
      };
      const clientIP = getHeader("x-forwarded-for")?.split(",")[0] || 
                       getHeader("x-real-ip") || 
                       "unknown";
      const userAgent = getHeader("user-agent") || "unknown";
      await trackDeviceLogin(user._id.toString(), clientIP, userAgent);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: null,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
  })
);

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  // adapter: MongoDBAdapter(mongoClientPromise), // Commented out - using JWT strategy with custom credentials
  providers: providers.length > 0 ? providers : [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.roleRefreshedAt = Date.now();
      }

      // Refresh role from DB every 2 minutes so admin approval takes effect without re-login
      const ROLE_REFRESH_INTERVAL = 2 * 60 * 1000;
      const lastRefresh = (token.roleRefreshedAt as number) || 0;
      if (Date.now() - lastRefresh > ROLE_REFRESH_INTERVAL && token.email) {
        try {
          await connectDb();
          const dbUser = await User.findOne({ email: token.email })
            .select("role")
            .lean<{ role?: string } | null>();
          if (dbUser) {
            token.role = dbUser.role;
          }
          token.roleRefreshedAt = Date.now();
        } catch {
          // If DB lookup fails, keep existing role — will retry next interval
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        // Note: businessId will be fetched on-demand in API routes to avoid connection issues
      }
      return session;
    },
  },
};

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions as any);
}
