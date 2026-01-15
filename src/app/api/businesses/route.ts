import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Business, BusinessStatus } from "@/lib/models/business";

/**
 * GET /api/businesses
 * Public endpoint to list all APPROVED businesses
 * No authentication required - visitors can browse
 */
export async function GET(request: Request) {
  try {
    await connectDb();

    // Only return APPROVED and ACTIVE businesses
    const businesses = await Business.find({
      status: BusinessStatus.APPROVED,
      isActive: true,
    })
      .select("name slug description logo phone address color createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      businesses: businesses.map((business) => ({
        id: business._id.toString(),
        name: business.name,
        slug: business.slug,
        description: business.description,
        logo: business.logo,
        phone: business.phone,
        address: business.address,
        color: business.color,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses", businesses: [] },
      { status: 500 }
    );
  }
}
