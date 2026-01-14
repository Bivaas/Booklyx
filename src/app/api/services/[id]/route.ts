import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Service } from "@/lib/models/service";
import { Business } from "@/lib/models/business";
import { z } from "zod";

const serviceUpdateSchema = z.object({
  name: z.string().min(1, "Service name is required").optional(),
  description: z.string().optional(),
  duration: z.number().int().min(15, "Duration must be at least 15 minutes").optional(),
  price: z.number().int().min(0, "Price must be non-negative").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/services/[id] - Update a service
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = serviceUpdateSchema.parse(body);

    await connectDb();

    // Find the service
    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify user owns the business
    const business = await Business.findOne({
      _id: service.businessId,
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to modify this service" },
        { status: 403 }
      );
    }

    // Update service
    if (data.name !== undefined) service.name = data.name;
    if (data.description !== undefined) service.description = data.description;
    if (data.duration !== undefined) service.duration = data.duration;
    if (data.price !== undefined) service.price = data.price;
    if (data.color !== undefined) service.color = data.color;
    if (data.isActive !== undefined) service.isActive = data.isActive;

    await service.save();

    return NextResponse.json({
      service: {
        _id: service._id.toString(),
        businessId: service.businessId.toString(),
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        color: service.color,
        isActive: service.isActive,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Find the service
    const service = await Service.findById(id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Verify user owns the business
    const business = await Business.findOne({
      _id: service.businessId,
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Unauthorized to delete this service" },
        { status: 403 }
      );
    }

    // Soft delete by setting isActive to false
    service.isActive = false;
    await service.save();

    return NextResponse.json({
      message: "Service deleted successfully",
      service: {
        _id: service._id.toString(),
        isActive: service.isActive,
      },
    });
  } catch (error) {
    console.error("Service deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
