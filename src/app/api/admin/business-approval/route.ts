import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { User, Role } from "@/lib/models/user";
import { sendBusinessApprovalEmail } from "@/lib/notifications";

const approvalSchema = z.object({
  businessId: z.string().min(1),
  action: z.enum(["approve", "suspend"]),
  reason: z.string().optional(),
});

/**
 * Unified admin role check: DB role first, env fallback
 */
async function checkAdminRole(email: string): Promise<boolean> {
  try {
    await connectDb();
    const user = await User.findOne({ email });
    if (user?.role === Role.ADMIN) return true;
  } catch {
    // fall through to env check
  }
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
  return adminEmails.includes(email);
}

/**
 * POST /api/admin/business-approval
 * Approve or suspend a business (Admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

      // Escalate business owner to OWNER role
      if (business.ownerId) {
        await User.findByIdAndUpdate(
          business.ownerId,
          { role: Role.OWNER },
          { new: true }
        );
      }
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
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Business approval error:", error);
    }

    return NextResponse.json(
      { error: "Failed to update business status" },
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
