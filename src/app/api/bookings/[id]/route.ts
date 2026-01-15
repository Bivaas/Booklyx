import { NextResponse, NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Business, BusinessStatus } from "@/lib/models/business";
import { Service } from "@/lib/models/service";
import { sendBookingCancellation } from "@/lib/notifications";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    // Basic auth check
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDb();

    const booking = await Booking.findById(id)
      .populate("serviceId", "name duration")
      .populate("staffId", "name")
      .populate("businessId", "ownerId email"); // Needed for auth check

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Access Control:
    // 1. User is the customer
    // 2. User is the business owner
    // 3. User is Admin
    // Check safely for businessId populated fields
    const businessEmail = booking.businessId?.email || null;
    
    const isCustomer = booking.customerEmail === session.user.email;
    const isOwner = businessEmail === session.user.email;
    const isAdmin = session.user.role === "admin";

    if (!isCustomer && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Fetch booking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }
    const { status } = result.data;

    await connectDb();

    const booking = await Booking.findById(id).populate("businessId");

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const business = await Business.findById(booking.businessId._id || booking.businessId);
    
    const isOwner = business.email === session.user.email;
    const isAdmin = session.user.role === "admin";
    const isCustomer = booking.customerEmail === session.user.email;

    if (isCustomer && !isOwner && !isAdmin) {
       // Customer trying to update
       if (status !== "cancelled") {
         return NextResponse.json({ error: "You can only cancel your bookings" }, { status: 403 });
       }
       // Prevent cancelling completed bookings
       if (booking.status === "completed" || booking.status === "cancelled") {
         return NextResponse.json({ error: "Cannot cancel this booking" }, { status: 400 });
       }
    } else if (!isOwner && !isAdmin) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Send email notification on cancellation
    if (status === "cancelled" && oldStatus !== "cancelled") {
      const service = await Service.findById(booking.serviceId);
      await sendBookingCancellation(
        booking.customerEmail,
        booking.customerName,
        business?.name || "Business",
        service?.name || "Service",
        booking.startTime
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
