import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import { markWithdrawalFailed } from "@/lib/db/withdrawal-requests";

/** POST /api/network/settlements/off-ramp/reject — ops rejects a merchant withdrawal request. */
export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const updated = await markWithdrawalFailed(requestId);
  if (!updated) {
    return NextResponse.json({ error: "Withdrawal not found or already processed" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
  });
}
