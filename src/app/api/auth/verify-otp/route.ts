import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { User } from "@/lib/models/user";
import { hashEmail, hashString } from "@/lib/crypto";
import { otpVerifySchema } from "@/lib/schemas/auth";
import { assessRiskForEmailSending } from "@/lib/risk-scoring";
// Note: No NextAuth interaction needed here

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, otp } = otpVerifySchema.parse(body);
    const emailHash = hashEmail(email);

    await connectDb();

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

    const hashedOTP = hashString(otp);
    if (hashedOTP !== otpRecord.hashedOTP) {
      const updatedOtp = await OTP.findOneAndUpdate(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      const currentAttempts = updatedOtp?.attempts ?? otpRecord.attempts + 1;

      // RISK SCORING: Increment risk score for failed OTP attempt
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await User.findByIdAndUpdate(
          existingUser._id,
          { $inc: { riskScore: 5 } }, // +5 points for failed attempt
          { new: true }
        );
      }

      const attemptsLeft = Math.max(0, 3 - currentAttempts);
      return NextResponse.json(
        {
          error: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`,
          code: "INVALID_OTP",
          attemptsLeft,
        },
        { status: 400 }
      );
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const now = new Date();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        emailVerified: true,
        verifiedAt: now,
        accountCreatedAt: now, // ACCOUNT WARM-UP: Set creation time
        riskScore: 0, // RISK SCORING: Initialize score
        emailSendingDisabled: false,
        failedOTPAttempts: 0,
      });
    } else {
      user.emailVerified = true;
      user.verifiedAt = now;
      if (!user.accountCreatedAt) {
        user.accountCreatedAt = now; // Set if not already set
      }
      await user.save();
    }

    // RISK SCORING: Check if user can be sent emails
    const riskAssessment = assessRiskForEmailSending(user.riskScore, user.emailSendingDisabled);
    if (!riskAssessment.isAllowed) {
      // Still verify but don't allow email-based operations
      // Return success but flag it
      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully",
          code: "EMAIL_VERIFIED",
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
          },
          _security: {
            restricted: true,
            reason: "Account requires security verification before email operations",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        code: "EMAIL_VERIFIED",
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
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
      console.error("OTP verification error");
    }

    return NextResponse.json(
      { error: "Failed to verify OTP", code: "ERROR" },
      { status: 500 }
    );
  }
}
