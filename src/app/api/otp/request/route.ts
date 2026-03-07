/**
 * @deprecated This route is not used by any active flow.
 * Active OTP routes:
 *   - /api/auth/signup (registration OTP request)
 *   - /api/auth/signup/verify (registration OTP verify)
 *   - /api/auth/request-otp (general OTP request)
 *   - /api/auth/verify-otp (general OTP verify)
 * This route can be safely removed in a future cleanup.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { OTP } from "@/lib/models/otp";
import { generateOTP, hashEmail, hashString } from "@/lib/crypto";
import { checkOTPRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendOTPEmail } from "@/lib/notifications";
import crypto from "crypto";

const requestOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Generate device fingerprint from user agent and IP
 * Used for strict rate limiting (1 OTP per device per network per 24 hours)
 */
function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  return crypto
    .createHash("sha256")
    .update(`${userAgent}:${ipAddress}`)
    .digest("hex");
}

/**
 * POST /api/otp/request
 * 
 * Request an OTP for email verification
 * 
 * STRICT RATE LIMITING (Redis-backed):
 * - 1 OTP per email per device per network per 24 hours
 * - Composite key: IP + email + device fingerprint
 * - Generic error message (no hints to attackers)
 * - Returns 429 if rate limited
 */
export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIP);

    const body = await request.json();
    const { email } = requestOTPSchema.parse(body);
    const emailHash = hashEmail(email);

    // STRICT RATE LIMITING: 1 OTP per email per device per network per 24 hours
    // Uses Redis for distributed enforcement
    const allowed = await checkOTPRateLimit(email, clientIP, deviceFingerprint);
    if (!allowed) {
      // Generic error message - no hints to attackers
      return NextResponse.json(
        { 
          error: "Too many OTP requests. Please try again later.",
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
