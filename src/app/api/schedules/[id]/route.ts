import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Schedule } from "@/lib/models/schedule";
import { Business } from "@/lib/models/business";
import { z } from "zod";

const scheduleUpdateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, "Day of week must be 0-6").optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)").optional(),
  isRecurring: z.boolean().optional(),
});

// PATCH /api/schedules/[id] - Update a schedule
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = scheduleUpdateSchema.parse(body);

    await connectDb();

    // Find the schedule
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Verify user owns the business via ownerId
    const business = await Business.findOne({
      _id: schedule.businessId,
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to modify this schedule" },
        { status: 403 }
      );
    }

    // Update fields
    if (data.dayOfWeek !== undefined) schedule.dayOfWeek = data.dayOfWeek;
    if (data.startTime !== undefined) schedule.startTime = data.startTime;
    if (data.endTime !== undefined) schedule.endTime = data.endTime;
    if (data.isRecurring !== undefined) schedule.isRecurring = data.isRecurring;

    // Validate time range
    if (schedule.startTime >= schedule.endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for overlapping schedules (excluding current schedule)
    const overlapping = await Schedule.findOne({
      _id: { $ne: id },
      staffId: schedule.staffId,
      dayOfWeek: schedule.dayOfWeek,
      $or: [
        { startTime: { $lt: schedule.endTime, $gte: schedule.startTime } },
        { endTime: { $gt: schedule.startTime, $lte: schedule.endTime } },
        { startTime: { $lte: schedule.startTime }, endTime: { $gte: schedule.endTime } },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Schedule overlaps with existing schedule" },
        { status: 409 }
      );
    }

    await schedule.save();
    await schedule.populate("staffId", "name email");

    return NextResponse.json({
      schedule: {
        _id: schedule._id.toString(),
        businessId: schedule.businessId.toString(),
        staffId: schedule.staffId._id.toString(),
        staffName: schedule.staffId.name,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isRecurring: schedule.isRecurring,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Schedule update error:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Find the schedule
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Verify user owns the business via ownerId
    const business = await Business.findOne({
      _id: schedule.businessId,
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to delete this schedule" },
        { status: 403 }
      );
    }

    // Hard delete schedules (they're recurring patterns, not historical records)
    await Schedule.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    console.error("Schedule deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
