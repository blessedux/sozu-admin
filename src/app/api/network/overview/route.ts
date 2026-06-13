import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import { mockHeroMetrics } from "@/lib/network/mock-data";

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json(mockHeroMetrics);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
