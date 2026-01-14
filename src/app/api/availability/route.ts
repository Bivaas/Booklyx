import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Booking, BookingStatus } from "@/lib/models/booking";
import { Schedule } from "@/lib/models/schedule";
import { Service } from "@/lib/models/service";
import { availabilityRequestSchema } from "@/lib/schemas/availability";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = availabilityRequestSchema.parse(body);

    await connectDb();

    // Fetch service to get duration
    const service = await Service.findById(data.serviceId);
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const serviceDuration = service.duration; // in minutes

    // Fetch all bookings for the business and service within date range
    const bookings = await Booking.find({
      businessId: data.businessId,
      serviceId: data.serviceId,
      status: { $ne: BookingStatus.CANCELLED },
      startTime: { $gte: data.startDate, $lte: data.endDate },
    });

    // Fetch staff schedules if staffId specified
    let schedules: any[] = [];
    if (data.staffId) {
      schedules = await Schedule.find({
        staffId: data.staffId,
      });
    }

    // Generate available slots based on staff schedule
    const slots: Array<{ time: string; available: boolean }> = [];
    const requestDate = new Date(data.startDate);
    const dayOfWeek = requestDate.getDay();

    // Get schedule for this day of week
    const daySchedule = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

    if (daySchedule.length === 0) {
      // No schedule for this day - return empty slots
      return NextResponse.json({ slots: [] });
    }

    // Generate time slots for each schedule block
    for (const schedule of daySchedule) {
      const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
      const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

      const slotStart = new Date(requestDate);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const scheduleEnd = new Date(requestDate);
      scheduleEnd.setHours(endHour, endMinute, 0, 0);

      // Generate slots with 30-minute intervals
      let currentSlot = new Date(slotStart);

      while (currentSlot.getTime() + serviceDuration * 60000 <= scheduleEnd.getTime()) {
        const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);

        // Check if slot conflicts with any bookings
        const hasConflict = bookings.some(
          (b) => b.startTime < slotEnd && b.endTime > currentSlot
        );

        // Check if slot is in the past
        const isPast = currentSlot < new Date();

        // Format time as HH:mm
        const timeString = currentSlot.toTimeString().substring(0, 5);

        slots.push({
          time: timeString,
          available: !hasConflict && !isPast,
        });

        // Move to next slot (30-minute intervals)
        currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
      }
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
