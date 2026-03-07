import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Staff } from "@/lib/models/staff";
import { Business } from "@/lib/models/business";
import { z } from "zod";

const staffUpdateSchema = z.object({
  name: z.string().min(1, "Staff name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  services: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
});

// PATCH /api/staff/[id] - Update a staff member
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
    const data = staffUpdateSchema.parse(body);

    await connectDb();

    // Find the staff member
    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Verify user owns the business via ownerId
    const business = await Business.findOne({
      _id: staff.businessId,
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to modify this staff member" },
        { status: 403 }
      );
    }

    // Update staff member
    if (data.name !== undefined) staff.name = data.name;
    if (data.email !== undefined) staff.email = data.email;
    if (data.services !== undefined) staff.services = data.services as any;
    if (data.isAvailable !== undefined) staff.isAvailable = data.isAvailable;

    await staff.save();

    // Populate services for response
    await staff.populate("services", "name");

    return NextResponse.json({
      staff: {
        _id: staff._id.toString(),
        businessId: staff.businessId.toString(),
        userId: staff.userId.toString(),
        name: staff.name,
        email: staff.email,
        services: staff.services.map((s: any) => ({
          _id: s._id.toString(),
          name: s.name,
        })),
        isAvailable: staff.isAvailable,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Staff update error:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete a staff member
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

    // Find the staff member
    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Verify user owns the business via ownerId
    const business = await Business.findOne({
      _id: staff.businessId,
      ownerId: session.user.id,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to delete this staff member" },
        { status: 403 }
      );
    }

    // Soft delete by setting isAvailable to false
    staff.isAvailable = false;
    await staff.save();

    return NextResponse.json({
      message: "Staff member deleted successfully",
      staff: {
        _id: staff._id.toString(),
        isAvailable: staff.isAvailable,
      },
    });
  } catch (error) {
    console.error("Staff deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
