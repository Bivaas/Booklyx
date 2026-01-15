import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Business, BusinessStatus } from "@/lib/models/business";
import { User, Role } from "@/lib/models/user";

const adminEditBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

/**
 * Check if user is admin
 */
async function checkAdminRole(email: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
  if (adminEmails.includes(email)) {
    return true;
  }

  try {
    await connectDb();
    const user = await User.findOne({ email });
    return user?.role === Role.ADMIN;
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/businesses
 * Get all businesses (Admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminRole(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDb();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const businesses = await Business.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("+email");

    const total = await Business.countDocuments(query);

    return NextResponse.json({
      businesses: businesses.map(b => ({
        id: b._id,
        name: b.name,
        email: b.email,
        phone: b.phone,
        address: b.address,
        slug: b.slug,
        status: b.status,
        createdAt: b.createdAt,
        approvedAt: b.approvedAt,
      })),
      total,
      skip,
      limit,
    });
  } catch (error) {
    console.error("Failed to fetch businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/businesses/:id
 * Edit business details (Admin only)
 * Can edit: name, email, phone, address
 */
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminRole(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    const updateData = adminEditBusinessSchema.parse(body);

    await connectDb();

    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Update allowed fields
    business.name = updateData.name;
    business.email = updateData.email;
    business.phone = updateData.phone;
    business.address = updateData.address;

    await business.save();

    return NextResponse.json({
      success: true,
      business: {
        id: business._id,
        name: business.name,
        email: business.email,
        phone: business.phone,
        address: business.address,
        status: business.status,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Failed to update business:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update business" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/businesses/:id
 * Delete a business (Admin only)
 * WARNING: This will affect all associated bookings
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await checkAdminRole(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    await connectDb();

    const business = await Business.findByIdAndDelete(id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Business deleted successfully",
      businessId: id,
    });
  } catch (error) {
    console.error("Failed to delete business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
