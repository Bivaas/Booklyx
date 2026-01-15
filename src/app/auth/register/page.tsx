"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [testMode, setTestMode] = useState(false);
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
        setError(data.error || "Failed to send OTP");
        setLoading(false);
        return;
      }

      if (data.testMode) {
        setTestMode(true);
        setSuccess(data.message || "Test mode: Use OTP 123456");
      } else {
        setSuccess("OTP sent to your email");
      }
      setStep("verify");
      setLoading(false);
    } catch (err) {
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
        setError(data.error || "Invalid OTP");
        setLoading(false);
        return;
      }

      setSuccess("Account created! Redirecting to sign in...");
      setTimeout(() => router.push("/auth/signin"), 1500);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_25%)]" aria-hidden />
      <Card className="relative w-full max-w-lg border border-border bg-card/70 backdrop-blur-md shadow-2xl">
        <div className="p-8 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Booklyx Access</p>
          <h1 className="text-3xl font-semibold text-foreground mt-2">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "signup"
              ? "Enter your email to get started"
              : "Enter the OTP from your email"}
          </p>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-4 bg-destructive/10 border border-destructive/40 rounded-lg flex items-start space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-8 mb-4 p-4 bg-green-500/10 border border-green-500/40 rounded-lg flex items-start space-x-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-700 dark:text-green-300">{success}</p>
              {testMode && (
                <p className="text-green-600 dark:text-green-400 mt-1 text-xs">⚠️ Test Mode Active - Use OTP: 123456</p>
              )}
            </div>
          </div>
        )}

        <div className="px-8 pb-8">
          {step === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Honeypot field - hidden from users, only bots fill it */}
              <input
                type="text"
                name="honeypot"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-auto py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/auth/signin")}
                  className="text-primary hover:text-primary/80 font-semibold"
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-foreground">
                  Verification Code
                </Label>
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
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-auto py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("signup");
                  setOtp("");
                  setSuccess("");
                  setError("");
                }}
                disabled={loading}
                className="w-full"
              >
                Back
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
