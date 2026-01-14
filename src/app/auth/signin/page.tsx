"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_25%)]" aria-hidden />
      <Card className="relative w-full max-w-lg border border-slate-800/60 bg-slate-900/70 backdrop-blur-md shadow-2xl shadow-slate-900/40">
        <div className="p-8 pb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Booklyx Access</p>
            <h1 className="text-3xl font-semibold text-white mt-2">Sign in</h1>
            <p className="text-sm text-slate-400 mt-1">Manage bookings, staff, and schedules</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-semibold shadow-lg shadow-indigo-500/30">
            Bx
          </div>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-50/5 border border-red-500/30 rounded-lg flex items-start space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
            <div className="text-red-100">
              <p className="font-semibold">Sign in failed</p>
              <p className="mt-1 text-red-200/80">
                {error === "OAuthSignin"
                  ? "Could not reach Google. Check credentials and network."
                  : error === "OAuthCallback"
                  ? "Callback failed. Verify redirect URL in Google console."
                  : error === "OAuthCreateAccount"
                  ? "Account could not be created."
                  : "An error occurred during sign in."}
              </p>
            </div>
          </div>
        )}

        <div className="px-8 pb-8 space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-auto py-3 bg-white text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 hover:bg-white/90 flex items-center justify-center shadow-sm"
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

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            <p className="font-semibold text-slate-100">Having trouble?</p>
            <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside">
              <li>Confirm AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set on Vercel.</li>
              <li>Set AUTH_URL/NEXTAUTH_URL to your production URL.</li>
              <li>Google console: add the same URL to authorized redirect URIs.</li>
            </ul>
          </div>

          <div className="text-center text-sm text-slate-400">
            <span className="text-slate-300">Need an account?</span>{" "}
            <button
              onClick={() => router.push("/auth/register")}
              className="text-cyan-300 hover:text-cyan-200 font-semibold"
            >
              Create one
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
