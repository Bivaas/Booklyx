import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Service } from "@/lib/models/service";
import { Staff } from "@/lib/models/staff";
import { Business } from "@/lib/models/business";
import { bookingRequestSchema } from "@/lib/schemas/booking";
import { sendBookingConfirmation } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = bookingRequestSchema.parse(body);

    await connectDb();

    // Verify business exists
    const business = await Business.findById(data.businessId);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
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

    // Check for conflicts
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

    // Send confirmation email
    await sendBookingConfirmation(
      data.customerEmail,
      data.customerName,
      business.name,
      service.name,
      startTime,
      booking._id.toString()
    );

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
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    await connectDb();

    const bookings = await Booking.find({ businessId })
      .populate("serviceId", "name duration")
      .populate("staffId", "name")
      .sort({ startTime: -1 })
      .limit(50);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
