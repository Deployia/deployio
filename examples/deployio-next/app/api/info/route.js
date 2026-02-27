import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Deployio Next.js Dashboard",
    version: "1.0.0",
    description: "Example Next.js application deployed via Deployio platform",
    stack: "Next.js 14 + React 18 + Tailwind CSS",
    features: [
      "App Router",
      "Server Components",
      "API Routes",
      "Standalone Output",
    ],
    deployedBy: "Deployio Platform",
  });
}
