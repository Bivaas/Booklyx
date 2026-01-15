import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { User } from "@/lib/models/user";
import { generateOTP, hashEmail, hashString } from "@/lib/crypto";
import { checkOTPRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendOTPEmail } from "@/lib/notifications";
import env from "@/lib/env";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json().catch(() => ({}));
    const { email, password } = signupSchema.parse(body);
    const emailHash = hashEmail(email);

    // Rate limit check
    const rateLimitKey = `signup|${email}|${clientIP}`;
    if (!checkOTPRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          error: "Too many signup attempts. Please try again in 15 minutes.",
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    const isTestMode = process.env.NODE_ENV === "development" || process.env.ENABLE_TEST_MODE === "true";

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      if (!isTestMode) {
        return NextResponse.json(
          { error: "Email service not configured" },
          { status: 500 }
        );
      }
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
            error: "OTP already sent. Please wait a minute before requesting a new one.",
            code: "OTP_RECENTLY_SENT",
          },
          { status: 429 }
        );
      }
    }

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

    // Send OTP email or use test mode
    if (isTestMode) {
      // In test mode, use fixed OTP: 123456 or log to console
      const testOTP = "123456";
      const testHashedOTP = hashString(testOTP);
      await OTP.findOneAndUpdate(
        { emailHash },
        { hashedOTP: testHashedOTP },
        { new: true }
      );
      console.log(`[TEST MODE] OTP for ${email}: ${testOTP}`);
    } else {
      sendOTPEmail(email, otp).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("OTP email failed");
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: isTestMode 
          ? "Test mode: Use OTP 123456 to verify"
          : "OTP sent to your email",
        expiresIn: 300, // seconds
        code: "OTP_SENT",
        testMode: isTestMode,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message || "Invalid request",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Signup error");
    }

    return NextResponse.json(
      { error: "Failed to process signup request", code: "ERROR" },
      { status: 500 }
    );
  }
}
