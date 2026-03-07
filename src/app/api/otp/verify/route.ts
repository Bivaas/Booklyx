/**
 * @deprecated This route is not used by any active flow.
 * Active OTP routes:
 *   - /api/auth/signup (registration OTP request)
 *   - /api/auth/signup/verify (registration OTP verify)
 *   - /api/auth/request-otp (general OTP request)
 *   - /api/auth/verify-otp (general OTP verify)
 * The VerifiedUser model used here is also dead code.
 * This route can be safely removed in a future cleanup.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { VerifiedUser } from "@/lib/models/verified-user";
import { hashEmail, hashString } from "@/lib/crypto";
import { getClientIP } from "@/lib/rate-limit";

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

/**
 * POST /api/otp/verify
 * Verify an OTP and create a verified user session
 */
export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    const { email, otp } = verifyOTPSchema.parse(body);
    const emailHash = hashEmail(email);

    await connectDb();

    // Find OTP record
    const otpRecord = await OTP.findOne({
      emailHash,
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Check max attempts (3)
    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    const hashedOTP = hashString(otp);
    if (hashedOTP !== otpRecord.hashedOTP) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      return NextResponse.json(
        { 
          error: "Invalid OTP", 
          attemptsLeft: 3 - otpRecord.attempts 
        },
        { status: 400 }
      );
    }

    // OTP is valid - mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Create or update verified user (for booking limits)
    await VerifiedUser.findOneAndUpdate(
      { hashedEmail: emailHash },
      { 
        hashedEmail: emailHash,
        verifiedAt: new Date(),
      },
      { upsert: true }
    );

    // Generate a temporary verification token (valid for booking)
    // This token proves the user verified their email
    const verificationToken = hashString(`${email}:${Date.now()}`);

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        verificationToken,
        email, // Return email for booking form
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

    console.error("OTP verification error");
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
