import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business } from "@/lib/models/business";

// GET /api/business - Get current user's business
export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    // Find business by owner's email
    const business = await Business.findOne({
      email: session.user.email,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
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
