import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { businessRegistrationSchema } from "@/lib/schemas/business";
import { checkBusinessRegistrationRateLimit, getClientIP } from "@/lib/rate-limit";

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
        status: business.status,
        approvedAt: business.approvedAt,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Business fetch error:", error);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// POST /api/business - Register a new business (requires approval)
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIP = getClientIP(request);
    
    // Rate limiting: 3 registrations per hour per IP
    if (!checkBusinessRegistrationRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = businessRegistrationSchema.parse(body);

    await connectDb();

    // Check if user already has a business
    const existingBusiness = await Business.findOne({
      email: session.user.email,
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: "You already have a registered business" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const slugExists = await Business.findOne({
      slug: data.slug,
    });

    if (slugExists) {
      return NextResponse.json(
        { error: "This slug is already taken. Please choose another." },
        { status: 400 }
      );
    }

    // Create business with PENDING status
    const business = new Business({
      name: data.name,
      slug: data.slug,
      email: session.user.email,
      ownerId: session.user.id || session.user.email,
      description: data.description,
      phone: data.phone,
      address: data.address,
      website: data.website,
      timezone: data.timezone,
      color: data.color,
      status: BusinessStatus.PENDING,
      isActive: true,
    });

    await business.save();

    // Store business ID on user for reference (do NOT escalate to OWNER yet)
    // User becomes OWNER only after admin approval
    // @ts-ignore
    await import("@/lib/models/user").then(({ User }) => 
      User.findOneAndUpdate(
        { email: session.user.email },
        { 
          $set: { 
            businessId: business._id 
          } 
        }
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: "Business registered successfully. Pending admin approval.",
        business: {
          id: business._id,
          name: business.name,
          slug: business.slug,
          status: business.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Business registration error:", error);
    }

    return NextResponse.json(
      { error: error?.message || "Failed to register business" },
      { status: 500 }
    );
  }
}
