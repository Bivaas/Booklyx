import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business } from "@/lib/models/business";
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

// PATCH /api/business/[id] - Update business settings
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
    const data = businessUpdateSchema.parse(body);

    await connectDb();

    // Find the business and verify ownership
    const business = await Business.findOne({
      _id: id,
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
        _id: { $ne: id },
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

// GET /api/business/[id] - Get business details for owner
export async function GET(
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

    // Find the business and verify ownership
    const business = await Business.findOne({
      _id: id,
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or unauthorized" },
        { status: 403 }
      );
    }

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
    console.error("Business fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}
