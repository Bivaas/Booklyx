import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Service } from "@/lib/models/service";
import { Business } from "@/lib/models/business";
import { z } from "zod";

const serviceSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  duration: z.number().int().min(15, "Duration must be at least 15 minutes"),
  price: z.number().int().min(0, "Price must be non-negative"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  isActive: z.boolean().optional(),
});

// GET /api/services - List all services for authenticated user's business
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Find user's business
    const business = await Business.findOne({ email: session.user.email });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get all services for this business
    const services = await Service.find({ businessId: business._id }).sort({ createdAt: -1 });

    return NextResponse.json({
      services: services.map((service) => ({
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
      })),
    });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = serviceSchema.parse(body);

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

    // Create service
    const service = new Service({
      businessId: data.businessId,
      name: data.name,
      description: data.description || "",
      duration: data.duration,
      price: data.price,
      color: data.color || "#60a5fa",
      isActive: data.isActive ?? true,
    });

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
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Service creation error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
