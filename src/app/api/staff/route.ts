import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Staff } from "@/lib/models/staff";
import { Business } from "@/lib/models/business";
import { User } from "@/lib/models/user";
import { z } from "zod";

const staffSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Staff name is required"),
  email: z.string().email("Invalid email address"),
  services: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

// GET /api/staff - List all staff for authenticated user's business
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Find user's business by ownerId
    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get all staff for this business
    const staff = await Staff.find({ businessId: business._id })
      .populate("services", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      staff: staff.map((member) => ({
        _id: member._id.toString(),
        businessId: member.businessId.toString(),
        userId: member.userId.toString(),
        name: member.name,
        email: member.email,
        services: member.services.map((s: any) => ({
          _id: s._id.toString(),
          name: s.name,
        })),
        isAvailable: member.isAvailable,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Staff fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = staffSchema.parse(body);

    await connectDb();

    // Verify business exists and user owns it
    const business = await Business.findOne({
      _id: data.businessId,
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 403 }
      );
    }

    // Check if staff with this email already exists for this business
    const existingStaff = await Staff.findOne({
      businessId: data.businessId,
      email: data.email,
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff member with this email already exists" },
        { status: 409 }
      );
    }

    // Find or create user for this staff member
    let user = await User.findOne({ email: data.email });
    if (!user) {
      user = new User({
        email: data.email,
        name: data.name,
        role: "staff",
      });
      await user.save();
    }

    // Create staff member
    const staff = new Staff({
      businessId: data.businessId,
      userId: user._id,
      name: data.name,
      email: data.email,
      services: data.services || [],
      isAvailable: data.isAvailable ?? true,
    });

    await staff.save();

    return NextResponse.json({
      staff: {
        _id: staff._id.toString(),
        businessId: staff.businessId.toString(),
        userId: staff.userId.toString(),
        name: staff.name,
        email: staff.email,
        services: staff.services,
        isAvailable: staff.isAvailable,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Staff creation error:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
