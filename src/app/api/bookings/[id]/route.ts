import { NextResponse, NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Business } from "@/lib/models/business";
import { Service } from "@/lib/models/service";
import { sendBookingCancellation } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDb();

    const booking = await Booking.findById(id)
      .populate("serviceId", "name duration")
      .populate("staffId", "name");

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
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
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["confirmed", "cancelled", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    await connectDb();

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("serviceId", "name")
      .populate("businessId", "name");

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Send email notification on cancellation
    if (status === "cancelled") {
      const business = await Business.findById(booking.businessId);
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
