import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "Deployio Next.js Example",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    runtime: "Next.js 14 (App Router)",
    version: "1.0.0",
  });
}
