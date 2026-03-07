import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { generateOTP, hashEmail, hashString } from "@/lib/crypto";
import { checkOTPRateLimit, getClientIP } from "@/lib/rate-limit";
import { otpRequestSchema } from "@/lib/schemas/auth";
import { sendOTPEmail } from "@/lib/notifications";
import env from "@/lib/env";
export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    
    const body = await request.json().catch(() => ({}));
    const { email } = otpRequestSchema.parse(body);
    const emailHash = hashEmail(email);

    // Rate limiting: 4 OTPs per user per 24h, 6 OTPs per IP per 24h
    const rateLimitResult = await checkOTPRateLimit(email, clientIP);
    if (!rateLimitResult.allowed) {
      const message =
        rateLimitResult.limitType === "ip"
          ? "Too many OTP requests from your network. Please try again later."
          : "You have requested too many verification codes. Please try again later.";
      return NextResponse.json(
        {
          error: message,
          code: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    await connectDb();

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

    const otp = generateOTP();
    const hashedOTP = hashString(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.deleteMany({ emailHash });

    const otpRecord = await OTP.create({
      emailHash,
      hashedOTP,
      attempts: 0,
      verified: false,
      expiresAt,
      createdAt: new Date(),
    });

    sendOTPEmail(email, otp).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("OTP email failed");
      }
    });

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
          error: error.issues[0]?.message || "Invalid request",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.error("OTP request error - non-sensitive context");
    }

    return NextResponse.json(
      { error: "Failed to process request", code: "ERROR" },
      { status: 500 }
    );
  }
}
