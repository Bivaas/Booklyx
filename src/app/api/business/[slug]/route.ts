import { NextResponse, NextRequest } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { Service } from "@/lib/models/service";
import { z } from "zod";

const businessUpdateSchema = z.object({
  name: z.string().min(1, "Business name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  description: z.string().optional(),
  logo: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();

    // Check if this is an authenticated request for business by ID
    if (session?.user?.email) {
      await connectDb();
      
      // Try to find by ID first (for owner dashboard)
      const businessById = await Business.findById(slug).catch(() => null);
      if (businessById && businessById.email === session.user.email) {
        return NextResponse.json({
          business: {
            _id: businessById._id.toString(),
            name: businessById.name,
            slug: businessById.slug,
            email: businessById.email,
            description: businessById.description,
            logo: businessById.logo,
            website: businessById.website,
            phone: businessById.phone,
            address: businessById.address,
            timezone: businessById.timezone,
            color: businessById.color,
            isActive: businessById.isActive,
            createdAt: businessById.createdAt,
            updatedAt: businessById.updatedAt,
          },
        });
      }
    }

    // Public lookup by slug
    if (!slug) {
      return NextResponse.json(
        { error: "Business slug is required" },
        { status: 400 }
      );
    }

    await connectDb();

    // Find business by slug - ONLY APPROVED businesses visible to public
    const business = await Business.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
      status: BusinessStatus.APPROVED,
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

// PATCH /api/business/[slug] - Update business settings (slug can be ID for authenticated users)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = businessUpdateSchema.parse(body);

    await connectDb();

    // Find the business by ID and verify ownership
    const business = await Business.findOne({
      _id: slug,
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 403 }
      );
    }

    // If slug is being updated, check for uniqueness
    if (data.slug && data.slug !== business.slug) {
      const existingBusiness = await Business.findOne({
        slug: data.slug.toLowerCase(),
        _id: { $ne: slug },
      });

      if (existingBusiness) {
        return NextResponse.json(
          { error: "Slug already in use" },
          { status: 409 }
        );
      }
      business.slug = data.slug.toLowerCase();
    }

    // Update fields
    if (data.name !== undefined) business.name = data.name;
    if (data.description !== undefined) business.description = data.description;
    if (data.logo !== undefined) business.logo = data.logo;
    if (data.website !== undefined) business.website = data.website;
    if (data.phone !== undefined) business.phone = data.phone;
    if (data.address !== undefined) business.address = data.address;
    if (data.timezone !== undefined) business.timezone = data.timezone;
    if (data.color !== undefined) business.color = data.color;

    await business.save();

    return NextResponse.json({
      business: {
        _id: business._id.toString(),
        name: business.name,
        slug: business.slug,
        email: business.email,
        description: business.description,
        logo: business.logo,
        website: business.website,
        phone: business.phone,
        address: business.address,
        timezone: business.timezone,
        color: business.color,
        isActive: business.isActive,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Business update error:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}
