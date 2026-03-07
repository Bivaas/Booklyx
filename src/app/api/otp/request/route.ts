import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { generateOTP, hashEmail, hashString } from "@/lib/crypto";
import { checkOTPRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendOTPEmail } from "@/lib/notifications";

const requestOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/otp/request
 * 
 * Request an OTP for email verification
 * 
 * RATE LIMITING (Redis-backed):
 * - 4 OTPs per email (user) per 24 hours
 * - 6 OTPs per IP address per 24 hours (across all users)
 * - Returns 429 if rate limited with a message indicating which limit was hit
 */
export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);

    const body = await request.json();
    const { email } = requestOTPSchema.parse(body);
    const emailHash = hashEmail(email);

    // RATE LIMITING: 4 OTPs per user per 24h, 6 OTPs per IP per 24h
    // Uses Redis for distributed enforcement
    const rateLimitResult = await checkOTPRateLimit(email, clientIP);
    if (!rateLimitResult.allowed) {
      const message =
        rateLimitResult.limitType === "ip"
          ? "Too many OTP requests from your network. Please try again later."
          : "You have requested too many verification codes. Please try again later.";
      return NextResponse.json(
        { 
          error: message,
          code: "RATE_LIMITED"
        },
        { status: 429 }
      );
    }

    await connectDb();

    // Check for existing unverified OTP
    const existingOTP = await OTP.findOne({
      emailHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      // Resend existing OTP if it was created less than 1 minute ago
      const timeSinceCreation = Date.now() - existingOTP.createdAt.getTime();
      if (timeSinceCreation < 60000) {
        return NextResponse.json(
          { 
            error: "OTP already sent. Please wait before requesting a new one.",
            code: "OTP_ALREADY_SENT"
          },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this hashed email
    await OTP.deleteMany({ emailHash });

    // Create new OTP record
    await OTP.create({
      emailHash,
      hashedOTP,
      attempts: 0,
      verified: false,
      expiresAt,
      createdAt: new Date(),
    });

    // Send OTP via email (async, don't await to respond faster)
    sendOTPEmail(email, otp).catch(() => {
      console.error("Failed to send OTP email");
    });

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
        expiresIn: 300, // seconds
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("OTP request error");
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
