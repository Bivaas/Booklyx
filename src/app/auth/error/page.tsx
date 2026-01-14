"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorCopy = (errorCode: string | null) => {
    switch (errorCode) {
      case "Invalid password":
      case "CredentialsSignin":
      case "AccessDenied":
        return {
          title: "Invalid credentials",
          message: "The email or password didn't match. Double-check and try again.",
          hint: "Tip: verify caps lock and that you're using the password set during signup.",
        };
      case "OAuthSignin":
        return {
          title: "Provider connection failed",
          message: "Couldn't reach the authentication provider. Please try again.",
          hint: "If this keeps happening, re-start the sign-in from the beginning.",
        };
      case "OAuthCallback":
        return {
          title: "Sign-in callback failed",
          message: "Something went wrong finishing the sign-in. Please try again.",
          hint: "If the issue persists, try a different provider or contact support.",
        };
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
        return {
          title: "Couldn't create your account",
          message: "We couldn't finish creating your account just now. Please try again.",
          hint: "If you already have an account, go back and sign in instead.",
        };
      case "Callback":
        return {
          title: "Authentication problem",
          message: "There was an issue completing authentication. Please try again.",
          hint: "A quick refresh often resolves transient errors.",
        };
      case "OAuthAccountNotLinked":
        return {
          title: "Email already linked",
          message: "This email is already connected to another sign-in method.",
          hint: "Use the original provider or contact support to merge accounts.",
        };
      case "SessionCallback":
        return {
          title: "Session could not start",
          message: "We couldn't start your session. Please try again.",
          hint: "If the issue persists, sign out everywhere and retry.",
        };
      default:
        return {
          title: "Authentication error",
          message: "An unexpected error occurred during authentication.",
          hint: "Please retry. If it keeps happening, let us know with a quick note.",
        };
    }
  };

  const { title, message, hint } = getErrorCopy(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8 bg-slate-900/70 border border-white/10 shadow-2xl shadow-rose-500/15 backdrop-blur">
        <div className="flex items-center gap-3 mb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 border border-rose-400/20">
            <AlertCircle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-rose-300">Sign-in issue</p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-50">
          <p className="text-base leading-relaxed">{message}</p>
          <p className="mt-2 text-sm text-rose-200/90">{hint}</p>
        </div>

        <div className="space-y-3">
          <Link href="/auth/signin" className="block w-full">
            <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
              Back to Sign In
            </Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="outline" className="w-full border-white/15 text-white hover:bg-white/10 hover:text-white">
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-200/80">
            If this keeps happening, please drop us a note so we can help.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
