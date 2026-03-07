import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/user";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email }).select(
      "name email role emailVerified createdAt"
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name || "",
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : null;

    if (!name || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { name },
      { new: true, runValidators: true }
    ).select("name email role emailVerified createdAt");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified || false,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
