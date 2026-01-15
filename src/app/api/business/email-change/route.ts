import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { User } from "@/lib/models/user";
import { sendBusinessEmailChangeNotification } from "@/lib/notifications";

const emailChangeSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  newEmail: z.string().email("Invalid email address"),
  otpCode: z.string().min(1, "OTP code is required"),
});

const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * POST /api/business/change-email
 * 
 * Change business email with 3-month cooldown
 * Requirements:
 * - User must be authenticated and own the business
 * - OTP verification required
 * - 3-month cooldown between email changes
 * - Enforced server-side
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessId, newEmail, otpCode } = emailChangeSchema.parse(body);

    await connectDb();

    // 1. Verify business ownership
    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get owner email from business
    const owner = await User.findById(business.ownerId);
    if (!owner || owner.email !== session.user.email) {
      return NextResponse.json(
        { error: "You do not have permission to manage this business" },
        { status: 403 }
      );
    }

    // 2. Check 3-month cooldown
    if (business.lastEmailChangeAt) {
      const timeSinceLastChange = Date.now() - new Date(business.lastEmailChangeAt).getTime();
      if (timeSinceLastChange < THREE_MONTHS_MS) {
        const daysRemaining = Math.ceil((THREE_MONTHS_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000));
        return NextResponse.json(
          {
            error: `Email change is restricted. You can change your email again in ${daysRemaining} days.`,
            code: "COOLDOWN_ACTIVE",
            daysRemaining,
          },
          { status: 429 }
        );
      }
    }

    // 3. Verify OTP (must be verified in previous request)
    // In a real app, you would check if the OTP was verified for this email
    // For now, we'll verify the OTP here
    const { OTP } = await import("@/lib/models/otp");
    const { hashEmail, hashString } = await import("@/lib/crypto");

    const emailHash = hashEmail(newEmail);
    const otpRecord = await OTP.findOne({
      emailHash,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "Email verification required. Please verify your new email with OTP.",
          code: "OTP_NOT_VERIFIED",
        },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingBusiness = await Business.findOne({ email: newEmail });
    if (existingBusiness && existingBusiness._id.toString() !== businessId) {
      return NextResponse.json(
        { error: "Email is already in use by another business" },
        { status: 409 }
      );
    }

    // 4. Update business email
    const oldEmail = business.email;
    business.email = newEmail;
    business.lastEmailChangeAt = new Date();
    await business.save();

    // Mark OTP as used
    otpRecord.verified = false;
    await otpRecord.save();

    // Send notification email (async)
    sendBusinessEmailChangeNotification(oldEmail, newEmail, business.name).catch(
      (error) => {
        console.error("Failed to send email change notification:", error);
      }
    );

    return NextResponse.json({
      success: true,
      message: "Business email changed successfully",
      business: {
        id: business._id,
        name: business.name,
        email: business.email,
        lastEmailChangeAt: business.lastEmailChangeAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Failed to change business email:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to change business email" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/business/email-change-info/:businessId
 * Get email change info and cooldown status (Owner only)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    await connectDb();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const owner = await User.findById(business.ownerId);
    if (!owner || owner.email !== session.user.email) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Calculate cooldown status
    let cooldownActive = false;
    let daysRemaining = 0;

    if (business.lastEmailChangeAt) {
      const timeSinceLastChange = Date.now() - new Date(business.lastEmailChangeAt).getTime();
      if (timeSinceLastChange < THREE_MONTHS_MS) {
        cooldownActive = true;
        daysRemaining = Math.ceil((THREE_MONTHS_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000));
      }
    }

    return NextResponse.json({
      businessId,
      currentEmail: business.email,
      lastEmailChangeAt: business.lastEmailChangeAt,
      cooldownActive,
      daysRemaining,
      maxChangesPerYear: 4, // 3-month cooldown = 4 changes max per year
    });
  } catch (error) {
    console.error("Failed to get email change info:", error);
    return NextResponse.json(
      { error: "Failed to get email change info" },
      { status: 500 }
    );
  }
}
