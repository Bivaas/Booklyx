import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { User } from "@/lib/models/user";
import { hashEmail, hashString } from "@/lib/crypto";

const verifySchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, otp } = verifySchema.parse(body);
    const emailHash = hashEmail(email);

    await connectDb();

    // Find and validate OTP
    const otpRecord = await OTP.findOne({
      emailHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "Invalid or expired OTP. Please request a new one.",
          code: "OTP_INVALID_OR_EXPIRED",
        },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        {
          error: "Maximum verification attempts exceeded. Please request a new OTP.",
          code: "MAX_ATTEMPTS_EXCEEDED",
        },
        { status: 400 }
      );
    }

    // Verify OTP
    const hashedOTP = hashString(otp);
    if (hashedOTP !== otpRecord.hashedOTP) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const attemptsLeft = 3 - otpRecord.attempts;
      return NextResponse.json(
        {
          error: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`,
          code: "INVALID_OTP",
          attemptsLeft,
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Create or update user
    const now = new Date();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        emailVerified: true,
        verifiedAt: now,
      });
    } else {
      user.emailVerified = true;
      user.verifiedAt = now;
      await user.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account verified successfully",
        code: "ACCOUNT_VERIFIED",
        user: {
          id: user._id.toString(),
          email: user.email,
          emailVerified: user.emailVerified,
        },
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
      console.error("Signup verification error");
    }

    return NextResponse.json(
      { error: "Failed to verify account", code: "ERROR" },
      { status: 500 }
    );
  }
}
