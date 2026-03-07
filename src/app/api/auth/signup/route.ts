import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { User } from "@/lib/models/user";
import { generateOTP, hashEmail, hashString } from "@/lib/crypto";
import { checkOTPRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendOTPEmail } from "@/lib/notifications";
import { validateEmailDomain } from "@/lib/email-security";
import { validateSignupLimits } from "@/lib/signup-rate-limit";
import env from "@/lib/env";
import crypto from "crypto";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  honeypot: z.string().optional(), // Honeypot field - should always be empty
});

/**
 * Generate device fingerprint from user agent and IP
 */
function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  return crypto
    .createHash("sha256")
    .update(`${userAgent}:${ipAddress}`)
    .digest("hex");
}

/**
 * Non-blocking delay to slow down bot attacks
 * 3-5 seconds after validation checks
 */
async function addArtificialDelay(): Promise<void> {
  const delayMs = 3000 + Math.random() * 2000; // 3-5 seconds
  await new Promise(resolve => setTimeout(resolve, delayMs));
}

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIP);

    const body = await request.json().catch(() => ({}));
    const { email, password, honeypot } = signupSchema.parse(body);
    const emailHash = hashEmail(email);

    // HONEYPOT CHECK: Reject if honeypot field is filled
    // Return generic success to confuse bots
    if (honeypot && honeypot.trim().length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: "OTP sent to your email",
          expiresIn: 300,
          code: "OTP_SENT",
        },
        { status: 200 }
      );
    }

    // DISPOSABLE EMAIL CHECK: Block before rate limiting
    const emailDomainError = validateEmailDomain(email);
    if (emailDomainError) {
      // Log attempt but return informative yet safe error
      return NextResponse.json(
        {
          error: "Unable to complete registration. Please use a valid, permanent email address.",
          code: "SIGNUP_FAILED",
        },
        { status: 400 }
      );
    }

    // SIGNUP RATE LIMITING (Pre-OTP): Max 1 per device, max 2 per IP per 24h
    if (!validateSignupLimits(deviceFingerprint, clientIP)) {
      return NextResponse.json(
        {
          error: "Too many signup attempts from this device or network. Please try again later.",
          code: "SIGNUP_FAILED",
        },
        { status: 400 }
      );
    }

    // STRICT OTP RATE LIMITING: 4 OTPs per user per 24h, 6 OTPs per IP per 24h
    const rateLimitResult = await checkOTPRateLimit(email, clientIP);
    if (!rateLimitResult.allowed) {
      const message =
        rateLimitResult.limitType === "ip"
          ? "Too many verification code requests from your network. Please try again later."
          : "You have requested too many verification codes for this account. Please try again later.";
      return NextResponse.json(
        {
          error: message,
          code: "SIGNUP_FAILED",
        },
        { status: 400 }
      );
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    await connectDb();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        {
          error: "Email already registered. Please sign in instead.",
          code: "EMAIL_EXISTS",
        },
        { status: 409 }
      );
    }

    // Check if OTP was recently sent
    const existingOTP = await OTP.findOne({
      emailHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      const timeSinceCreation = Date.now() - existingOTP.createdAt.getTime();
      if (timeSinceCreation < 60000) {
        return NextResponse.json(
          {
            error: "A verification code was recently sent to this email. Please wait before requesting a new one.",
            code: "SIGNUP_FAILED",
          },
          { status: 400 }
        );
      }
    }

    // ARTIFICIAL OTP DELAY: 3-5 seconds (non-blocking)
    // Applied AFTER all validation checks
    await addArtificialDelay();

    // Generate and send OTP
    const otp = generateOTP();
    const hashedOTP = hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ emailHash });
    await OTP.create({
      emailHash,
      hashedOTP,
      attempts: 0,
      verified: false,
      expiresAt,
      createdAt: new Date(),
    });

    // Send OTP email with error handling
    try {
      await sendOTPEmail(email, otp);
    } catch (emailError) {
      // EMAIL FAIL-SAFE: If email send fails, return maintenance message
      if (process.env.NODE_ENV === "development") {
        console.error("OTP email send failed:", emailError);
      }
      
      // Don't reveal the failure, return generic error
      return NextResponse.json(
        { 
          error: "Service temporarily unavailable. Please try again.",
          code: "SERVICE_UNAVAILABLE"
        },
        { status: 503 }
      );
    }

    // Development-only: Log OTP for testing (remove in production)
    if (process.env.NODE_ENV === "development" && !env.RESEND_API_KEY) {
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
        expiresIn: 300, // seconds
        code: "OTP_SENT",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    console.error("Signup error (development only)");
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
