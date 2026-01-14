import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Service } from "@/lib/models/service";
import { Business, BusinessStatus } from "@/lib/models/business";
import { serviceSchema } from "@/lib/schemas/business";
import { checkApiRateLimit, getClientIP } from "@/lib/rate-limit";

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
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Services fetch error:", error);
    }
    
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

    const clientIP = getClientIP(request);
    if (!checkApiRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Parse with extended schema that includes businessId
    const extendedSchema = serviceSchema.extend({
      businessId: z.string().min(1),
    });
    const data = extendedSchema.parse(body);

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

    // Only approved businesses can add services
    if (business.status !== BusinessStatus.APPROVED) {
      return NextResponse.json(
        { error: "Business must be approved before adding services" },
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
      color: data.color,
      isActive: true,
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
