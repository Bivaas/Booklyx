"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AlertCircle, CheckCircle, Calendar, ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, honeypot: "" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
        setLoading(false);
        return;
      }

      setSuccess("Verification code sent to your email");
      setStep("verify");
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid verification code");
        setLoading(false);
        return;
      }

      setSuccess("Account created! Redirecting to sign in…");
      setTimeout(() => router.push("/auth/signin"), 1500);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--color-primary)/0.05),transparent_50%)] pointer-events-none" aria-hidden />

      <motion.div
        className="w-full max-w-md"
        initial={reduced ? {} : { opacity: 0, y: 16 }}
        animate={reduced ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">Booklyx</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "signup"
              ? "Enter your email and a password to get started"
              : "Check your email for the 6-digit code"}
          </p>
        </div>

        <Card className="border border-border/60 bg-card/80 backdrop-blur-sm shadow-lg">
          {error && (
            <div className="mx-6 mt-6 p-3.5 bg-destructive/8 border border-destructive/25 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-3.5 bg-green-500/8 border border-green-500/25 rounded-lg flex items-start gap-2.5">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <div className="p-6">
            {step === "signup" ? (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>

                {/* Honeypot */}
                <input type="text" name="honeypot" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                <Button type="submit" disabled={loading || !email || !password} className="w-full">
                  {loading ? "Sending…" : "Send verification code"}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => router.push("/auth/signin")} className="text-primary hover:text-primary/80 font-medium">
                    Sign in
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(cleaned);
                    }}
                    maxLength={6}
                    required
                    disabled={loading}
                    autoFocus
                    className="text-center text-2xl tracking-[0.3em] font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent to <span className="font-medium text-foreground">{email}</span>. Expires in 5 minutes.
                  </p>
                </div>

                <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
                  {loading ? "Verifying…" : "Verify & create account"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("signup");
                    setOtp("");
                    setSuccess("");
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              </form>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
