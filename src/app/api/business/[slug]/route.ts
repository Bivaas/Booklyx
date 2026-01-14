import { NextResponse, NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { Business } from "@/lib/models/business";
import { Service } from "@/lib/models/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Business slug is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Find business by slug
    const business = await Business.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    }).select("-ownerId");

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get all active services for this business
    const services = await Service.find({
      businessId: business._id,
      isActive: true,
    }).select("name description duration price color");

    return NextResponse.json({
      business: {
        id: business._id.toString(),
        name: business.name,
        slug: business.slug,
        description: business.description,
        logo: business.logo,
        phone: business.phone,
        address: business.address,
        timezone: business.timezone,
        color: business.color,
      },
      services: services.map((service) => ({
        id: service._id.toString(),
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        color: service.color,
      })),
    });
  } catch (error) {
    console.error("Business lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch business details" },
      { status: 500 }
    );
  }
}
