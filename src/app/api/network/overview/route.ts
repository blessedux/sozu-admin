import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import { getHeroMetrics } from "@/lib/network/queries";

export async function GET() {
  try {
    await requireAdminSession();
    const metrics = await getHeroMetrics();
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
