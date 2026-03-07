import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Service } from "@/lib/models/service";
import { Staff } from "@/lib/models/staff";
import { Business, BusinessStatus } from "@/lib/models/business";
import { User } from "@/lib/models/user";
import { bookingRequestSchema } from "@/lib/schemas/booking";
import { sendBookingConfirmation, sendBookingNotificationToOwner } from "@/lib/notifications";
import { hashEmail } from "@/lib/crypto";
import { checkBookingRateLimit, getClientIP } from "@/lib/rate-limit";
import { checkIPBookingLimit } from "@/lib/ip-heuristics";
import { validateUserForBooking } from "@/lib/booking-verification";
import { checkAccountWarmup, getWarmupErrorMessage } from "@/lib/account-warm-up";
import { auth } from "@/lib/auth";

// Add CORS and security headers for API response
const apiHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXTAUTH_URL || "https://booklyx.vercel.app",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
};

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: apiHeaders });
}

export async function POST(request: Request) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting: 10 bookings per minute per IP
    const bookingAllowed = await checkBookingRateLimit(clientIP);
    if (!bookingAllowed) {
      return NextResponse.json(
        { error: "Too many booking requests. Please try again later." },
        { status: 429 }
      );
    }

    // IP-based secondary limit check (burst protection)
    if (!checkIPBookingLimit(clientIP)) {
      return NextResponse.json(
        { error: "Booking limit exceeded for your IP address" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = bookingRequestSchema.parse(body);

    await connectDb();

    // Comprehensive user verification check
    // - emailVerified field
    // - business approved
    // - daily limits
    const validation = await validateUserForBooking(
      data.customerEmail,
      data.businessId
    );
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 403 }
      );
    }

    // ACCOUNT WARM-UP CHECK: Verify account is at least 15 minutes old
    const user = await User.findOne({ email: data.customerEmail });
    if (user) {
      const warmupCheck = checkAccountWarmup(user.accountCreatedAt, user.emailVerified);
      if (!warmupCheck.allowed) {
        return NextResponse.json(
          { error: getWarmupErrorMessage(warmupCheck.minutesRemaining) },
          { status: 403 }
        );
      }
    }

    // Verify business exists and is APPROVED
    const business = await Business.findById(data.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.status !== BusinessStatus.APPROVED) {
      return NextResponse.json(
        { error: "This business is not accepting bookings at the moment" },
        { status: 403 }
      );
    }

    // Verify service exists
    const service = await Service.findById(data.serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Calculate end time based on service duration
    const startTime = new Date(data.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // Check for conflicts (prevent race conditions)
    const existingBooking = await Booking.findOne({
      businessId: data.businessId,
      staffId: data.staffId || null,
      status: { $ne: BookingStatus.CANCELLED },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
      ],
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Time slot is not available" },
        { status: 409 }
      );
    }

    // Create booking
    const booking = new Booking({
      businessId: data.businessId,
      serviceId: data.serviceId,
      staffId: data.staffId || null,
      customerId: data.customerEmail,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      startTime,
      endTime,
      status: BookingStatus.PENDING,
      notes: data.notes,
    });

    await booking.save();

    // Send notification to business owner (CRITICAL: Fail booking if this fails)
    try {
      await sendBookingNotificationToOwner(
        business.email,
        data.customerName,
        data.customerEmail,
        data.customerPhone || "",
        service.name,
        startTime
      );
    } catch (emailError) {
      // Rollback booking
      await Booking.deleteOne({ _id: booking._id });
      console.error("Owner notification failed, booking rolled back:", emailError);
      return NextResponse.json(
        { error: "Booking failed due to notification service error. Please try again." },
        { status: 500 }
      );
    }

    // Send confirmation email to customer (async, non-critical)
    sendBookingConfirmation(
      data.customerEmail,
      data.customerName,
      business.name,
      service.name,
      startTime,
      booking._id.toString()
    ).catch((error) => {
      // Non-critical error; booking still created
      if (process.env.NODE_ENV === "development") {
        console.error("Booking confirmation email failed - non-critical");
      }
    });

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Don't log full error details in production (security)
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Booking creation error context only");
    }
    
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401, headers: apiHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");
    
    // Build query filter
    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    await connectDb();

    // If businessId is provided, check if user is OWNER of that business or ADMIN
    if (businessId) {
       const userRole = session.user.role;
       const userId = session.user.id;

       // Admin can view any business's bookings
       if (userRole !== "admin") {
         // Verify the user owns this business
         const business = await Business.findById(businessId);
         if (!business || business.ownerId !== userId) {
           return NextResponse.json(
             { error: "Forbidden - You do not have access to this business's bookings" },
             { status: 403, headers: apiHeaders }
           );
         }
       }

       query.businessId = businessId;
       
       const bookings = await Booking.find(query)
        .populate("serviceId", "name duration")
        .populate("staffId", "name")
        .sort({ startTime: -1 })
        .limit(50);
       return NextResponse.json({ bookings }, { headers: apiHeaders });
    }

    // Fallback: If no businessId, return USER's bookings (My Bookings)
    // Secure this to ensure users only see their own
    query.customerEmail = session.user.email;
    
    const bookings = await Booking.find(query)
      .populate("businessId", "name") // Populate business info for the user
      .populate("serviceId", "name duration")
      .sort({ startTime: -1 })
      .limit(50);

    return NextResponse.json({ bookings }, { headers: apiHeaders });

  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings", bookings: [] },
      { status: 500, headers: apiHeaders }
    );
  }
}
