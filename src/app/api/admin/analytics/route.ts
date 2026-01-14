import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { Booking, BookingStatus } from "@/lib/models/booking";

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

    // Check admin role (same as business-approval)
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const isAdmin = adminEmails.includes(session.user.email);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregation 1: Business counts by status
    const businessStats = await Business.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregation 2: Bookings today
    const bookingsToday = await Booking.countDocuments({
      startTime: { $gte: today, $lt: tomorrow },
    });

    // Aggregation 3: Bookings per business (top 10)
    const bookingsPerBusiness = await Booking.aggregate([
      {
        $match: {
          status: { $ne: BookingStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: "$businessId",
          count: { $sum: 1 },
          lastBooking: { $max: "$startTime" },
        },
      },
      {
        $lookup: {
          from: "businesses",
          localField: "_id",
          foreignField: "_id",
          as: "business",
        },
      },
      {
        $unwind: "$business",
      },
      {
        $project: {
          businessId: "$_id",
          businessName: "$business.name",
          businessStatus: "$business.status",
          bookingCount: "$count",
          lastBooking: 1,
        },
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Aggregation 4: Recent activity
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("businessId", "name")
      .populate("serviceId", "name")
      .select("customerName customerEmail startTime status createdAt");

    // Format business stats
    const businessStatsByStatus: Record<string, number> = {
      pending: 0,
      approved: 0,
      suspended: 0,
    };

    businessStats.forEach((stat) => {
      businessStatsByStatus[stat._id] = stat.count;
    });

    return NextResponse.json({
      businesses: {
        total: Object.values(businessStatsByStatus).reduce((a, b) => a + b, 0),
        pending: businessStatsByStatus.pending,
        approved: businessStatsByStatus.approved,
        suspended: businessStatsByStatus.suspended,
      },
      bookings: {
        today: bookingsToday,
        perBusiness: bookingsPerBusiness,
      },
      recentActivity: recentBookings,
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
