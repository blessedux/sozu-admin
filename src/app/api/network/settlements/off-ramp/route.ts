import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import {
  getOrganizationNamesByIds,
  isWithdrawalRequestsTableAvailable,
  listPendingWithdrawalsForAdmin,
  listProcessingWithdrawalsForAdmin,
} from "@/lib/db/withdrawal-requests";

/** GET /api/network/settlements/off-ramp — merchant USDC → bank CLP queue. */
export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tableReady = await isWithdrawalRequestsTableAvailable();
  if (!tableReady) {
    return NextResponse.json({
      tableReady: false,
      withdrawals: [],
      awaitingRelease: [],
      pendingCount: 0,
      setupMessage:
        "Run supabase/migrations/20250613000000_withdrawal_requests_ramp.sql in your shared Supabase project.",
    });
  }

  const [pending, processing] = await Promise.all([
    listPendingWithdrawalsForAdmin(200),
    listProcessingWithdrawalsForAdmin(200),
  ]);

  const orgIds = [...new Set([...pending, ...processing].map((r) => r.org_id))];
  const orgNames = await getOrganizationNamesByIds(orgIds);

  const mapRow = (w: (typeof pending)[0]) => ({
    id: w.id,
    orgId: w.org_id,
    orgName: orgNames.get(w.org_id) ?? w.org_id,
    amountUsd: w.amount_usd,
    sourceStellarAddress: w.source_stellar_address,
    bankAccountHolder: w.bank_account_holder,
    bankCountry: w.bank_country,
    bankAccountNumber: w.bank_account_number,
    bankRoutingCode: w.bank_routing_code,
    bankCurrency: w.bank_currency,
    status: w.status,
    fiatSentAt: w.fiat_sent_at,
    releaseTxHash: w.release_tx_hash,
    createdAt: w.created_at,
  });

  return NextResponse.json({
    tableReady: true,
    withdrawals: pending.map(mapRow),
    awaitingRelease: processing.map(mapRow),
    pendingCount: pending.length,
    awaitingReleaseCount: processing.length,
  });
}
