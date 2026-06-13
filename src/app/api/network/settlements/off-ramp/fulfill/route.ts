import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import { markWithdrawalFiatSent } from "@/lib/db/withdrawal-requests";

/**
 * POST /api/network/settlements/off-ramp/fulfill
 * Ops confirms CLP was deposited to the merchant bank account.
 * Merchant must then release USDC from SozuPay with passkey.
 */
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  if (!requestId) {
    return NextResponse.json({ error: "requestId is required" }, { status: 400 });
  }

  const updated = await markWithdrawalFiatSent(requestId, session.email);
  if (!updated) {
    return NextResponse.json(
      { error: "Withdrawal not found or CLP already marked sent" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    fiatSentAt: updated.fiat_sent_at,
  });
}
