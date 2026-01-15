"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");  const [testMode, setTestMode] = useState(false);
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
        body: JSON.stringify({ email, password }),
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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_25%)]" aria-hidden />
      <Card className="relative w-full max-w-lg border border-slate-800/60 bg-slate-900/70 backdrop-blur-md shadow-2xl shadow-slate-900/40">
        <div className="p-8 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Booklyx Access</p>
          <h1 className="text-3xl font-semibold text-white mt-2">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === "signup"
              ? "Enter your email to get started"
              : "Enter the OTP from your email"}
          </p>
        </div>

        {error && (
          <div className="mx-8 mb-4 p-4 bg-red-50/5 border border-red-500/30 rounded-lg flex items-start space-x-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {success && (
          <div className="mx-8 mb-4 p-4 bg-green-50/5 border border-green-500/30 rounded-lg flex items-start space-x-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
            <div className=\"flex-1\">
              <p className=\"text-green-100\">{success}</p>
              {testMode && (
                <p className=\"text-green-200/80 mt-1 text-xs\">⚠️ Test Mode Active - Use OTP: 123456</p>
              )}
            </div>
          </div>
        )}

        <div className="px-8 pb-8">
          {step === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
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
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
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
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-auto py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>

              <div className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/auth/signin")}
                  className="text-cyan-300 hover:text-cyan-200 font-semibold"
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-slate-300">
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
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest font-mono"
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
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
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
