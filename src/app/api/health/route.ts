import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "belluzzi-open-tools",
    version: process.env.npm_package_version ?? "0.1.0",
  });
}
