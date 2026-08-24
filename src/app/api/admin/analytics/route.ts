import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { User } from "@/lib/models/user";
import { Staff } from "@/lib/models/staff";
import { Service } from "@/lib/models/service";

/**
 * GET /api/admin/analytics
 * Get lightweight analytics using MongoDB aggregation (Admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Unified admin check: DB role first, env fallback
    const user = await User.findOne({ email: session.user.email });
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
    const isAdmin = user?.role === "admin" || adminEmails.includes(session.user.email);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all counts we need
    const [
      totalUsers,
      totalBookings,
      totalStaff,
      totalServices,
      totalBusinesses,
      approvedBusinesses,
      pendingBusinesses,
      suspendedBusinesses,
    ] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Staff.countDocuments(),
      Service.countDocuments(),
      Business.countDocuments(),
      Business.countDocuments({ status: "approved" }),
      Business.countDocuments({ status: "pending" }),
      Business.countDocuments({ status: "suspended" }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalBusinesses,
      approvedBusinesses,
      pendingBusinesses,
      suspendedBusinesses,
      totalBookings,
      totalStaff,
      totalServices,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Analytics error:", error);
    }

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
