import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { User, Role } from "@/lib/models/user";
import { hashEmail, hashString } from "@/lib/crypto";
import env from "@/lib/env";

const verifySchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, otp } = verifySchema.parse(body);
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
      const updatedOtp = await OTP.findOneAndUpdate(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      const currentAttempts = updatedOtp?.attempts ?? otpRecord.attempts + 1;

      // RISK SCORING: Increment risk on failed OTP attempt
      await User.findOneAndUpdate(
        { email },
        { $inc: { riskScore: 5 } }, // +5 points for failed attempt
        { upsert: false }
      );

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

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role: admin for specific email, customer for others
    const adminEmails = env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
    const userRole = adminEmails.includes(email) ? Role.ADMIN : Role.CUSTOMER;

    // Create or update user
    const now = new Date();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        password: hashedPassword,
        emailVerified: true,
        verifiedAt: now,
        role: userRole,
        accountCreatedAt: now, // ACCOUNT WARM-UP: Track creation time
        riskScore: 0, // RISK SCORING: Start at 0
        emailSendingDisabled: false,
        failedOTPAttempts: 0,
      });
    } else {
      user.password = hashedPassword;
      user.emailVerified = true;
      user.verifiedAt = now;
      user.role = userRole;
      user.accountCreatedAt = now; // ACCOUNT WARM-UP: Update creation time
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
