"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AlertCircle } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await signIn("credentials", {
      email,
      password,
      callbackUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_25%)]" aria-hidden />
      <Card className="relative w-full max-w-lg border border-border bg-card/70 backdrop-blur-md shadow-2xl">
        <div className="p-8 pb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Booklyx Access</p>
            <h1 className="text-3xl font-semibold text-foreground mt-2">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage bookings, staff, and schedules</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
            Bx
          </div>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-5 bg-destructive/10 border-2 border-destructive/40 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-destructive text-base">Sign in failed</p>
              <p className="mt-2 text-destructive/90 text-sm leading-relaxed">
                {error === "OAuthSignin"
                  ? "Could not reach Google. Check credentials and network."
                  : error === "OAuthCallback"
                  ? "Callback failed. Verify redirect URL in Google console."
                  : error === "OAuthCreateAccount"
                  ? "Account could not be created."
                  : error === "CredentialsSignin"
                  ? "Invalid email or password. Please check your credentials and try again."
                  : "An error occurred during sign in. Please try again."}
              </p>
            </div>
          </div>
        )}

        <div className="px-8 pb-8 space-y-4">
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-auto py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
            className="w-full h-auto py-3 bg-background text-foreground font-semibold border border-border hover:bg-accent flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <span className="text-foreground">Need an account?</span>{" "}
            <button
              type="button"
              onClick={() => router.push("/auth/register")}
              className="text-primary hover:text-primary/80 font-semibold"
            >
              Create account with email
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
