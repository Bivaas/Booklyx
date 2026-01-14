import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { Role } from "@/lib/models/user";
import { sendBusinessApprovalEmail } from "@/lib/notifications";

const approvalSchema = z.object({
  businessId: z.string().min(1),
  action: z.enum(["approve", "suspend"]),
  reason: z.string().optional(),
});

/**
 * POST /api/admin/business-approval
 * Approve or suspend a business (Admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check admin authorization
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Check if user has ADMIN role
    // For now, we'll check against a hardcoded admin email or implement proper role check
    // You should implement role checking based on your User model
    const isAdmin = await checkAdminRole(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { businessId, action, reason } = approvalSchema.parse(body);

    await connectDb();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (action === "approve") {
      business.status = BusinessStatus.APPROVED;
      business.approvedAt = new Date();
      business.approvedBy = session.user.id || session.user.email;
      business.suspendedAt = undefined;
      business.suspendedReason = undefined;
    } else if (action === "suspend") {
      business.status = BusinessStatus.SUSPENDED;
      business.suspendedAt = new Date();
      business.suspendedReason = reason;
    }

    await business.save();

    // Send notification email (async)
    sendBusinessApprovalEmail(
      business.email,
      business.name,
      action === "approve",
      reason
    ).catch((error) => {
      console.error("Failed to send approval email:", error);
    });

    return NextResponse.json({
      success: true,
      business: {
        id: business._id,
        name: business.name,
        status: business.status,
        approvedAt: business.approvedAt,
        suspendedAt: business.suspendedAt,
      },
    });
  } catch (error: any) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Business approval error:", error);
    }

    return NextResponse.json(
      { error: error?.message || "Failed to update business status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/business-approval
 * Get pending businesses for approval
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminRole(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    await connectDb();

    const businesses = await Business.find({ status })
      .sort({ createdAt: -1 })
      .limit(100)
      .select("-__v");

    return NextResponse.json({ businesses });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

/**
 * Check if user has admin role
 * TODO: Implement proper role checking from User model
 */
async function checkAdminRole(email: string): Promise<boolean> {
  // Option 1: Check against environment variable for admin emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  if (adminEmails.includes(email)) {
    return true;
  }

  // Option 2: Check User model for role (if you want to query DB)
  // Uncomment and implement if needed:
  /*
  const { User } = await import("@/lib/models/user");
  const user = await User.findOne({ email });
  return user?.role === Role.ADMIN;
  */

  return false;
}
