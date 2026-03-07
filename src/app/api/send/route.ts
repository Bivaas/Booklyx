import { NextResponse } from "next/server";

// This endpoint has been removed for security reasons.
// All email sending is handled server-side via lib/notifications.ts.
// No public email-sending endpoint should exist.

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint has been removed." },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "This endpoint has been removed." },
    { status: 410 }
  );
}