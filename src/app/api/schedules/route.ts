import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Schedule } from "@/lib/models/schedule";
import { Staff } from "@/lib/models/staff";
import { Business } from "@/lib/models/business";
import { z } from "zod";

const scheduleSchema = z.object({
  businessId: z.string(),
  staffId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6, "Day of week must be 0-6"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  isRecurring: z.boolean().optional(),
});

// GET /api/schedules - List all schedules for authenticated user's business
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    await connectDb();

    // Find user's business
    const business = await Business.findOne({ email: session.user.email });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Build query
    const query: any = { businessId: business._id };
    if (staffId) {
      query.staffId = staffId;
    }

    // Get all schedules for this business
    const schedules = await Schedule.find(query)
      .populate("staffId", "name email")
      .sort({ dayOfWeek: 1, startTime: 1 });

    return NextResponse.json({
      schedules: schedules.map((schedule) => ({
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
      })),
    });
  } catch (error) {
    console.error("Schedules fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = scheduleSchema.parse(body);

    await connectDb();

    // Verify business exists and user owns it
    const business = await Business.findOne({
      _id: data.businessId,
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 403 }
      );
    }

    // Verify staff member exists and belongs to this business
    const staff = await Staff.findOne({
      _id: data.staffId,
      businessId: data.businessId,
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Validate time range
    if (data.startTime >= data.endTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Check for overlapping schedules
    const overlapping = await Schedule.findOne({
      staffId: data.staffId,
      dayOfWeek: data.dayOfWeek,
      $or: [
        { startTime: { $lt: data.endTime, $gte: data.startTime } },
        { endTime: { $gt: data.startTime, $lte: data.endTime } },
        { startTime: { $lte: data.startTime }, endTime: { $gte: data.endTime } },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Schedule overlaps with existing schedule" },
        { status: 409 }
      );
    }

    // Create schedule
    const schedule = new Schedule({
      businessId: data.businessId,
      staffId: data.staffId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      isRecurring: data.isRecurring ?? true,
    });

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
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Schedule creation error:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
