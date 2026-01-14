import { NextResponse, NextRequest } from "next/server";
import env from "@/lib/env";

// Auth.js route handler
// This will be properly configured once AUTH_SECRET and providers are set

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0 } = await params;

  // Check if auth is properly configured
  if (!env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "AUTH_SECRET not configured" },
      { status: 500 }
    );
  }

  // Dynamic import to avoid initialization errors
  try {
    const { handlers } = await import("@/lib/auth");
    if (!handlers?.GET) {
      return NextResponse.json(
        { error: "Auth not configured with providers" },
        { status: 500 }
      );
    }
    return handlers.GET(request);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ auth0: string }> }
) {
  const { auth0 } = await params;

  if (!env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "AUTH_SECRET not configured" },
      { status: 500 }
    );
  }

  try {
    const { handlers } = await import("@/lib/auth");
    if (!handlers?.POST) {
      return NextResponse.json(
        { error: "Auth not configured with providers" },
        { status: 500 }
      );
    }
    return handlers.POST(request);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 }
    );
  }
}
