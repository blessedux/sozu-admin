import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api-auth";
import { listPendingCheckoutsForAdmin } from "@/lib/db/checkout-sessions";
import { listPendingDepositsForAdmin } from "@/lib/db/deposit-intents";
import {
  getOrganizationNamesByIds,
  getProfileTagsByIds,
} from "@/lib/db/withdrawal-requests";

/** GET /api/network/settlements/on-ramp — consumer deposits + merchant checkout sessions. */
export async function GET() {
  try {
    await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deposits, checkouts] = await Promise.all([
    listPendingDepositsForAdmin(200),
    listPendingCheckoutsForAdmin(200),
  ]);

  const orgIds = [...new Set(checkouts.map((c) => c.org_id))];
  const userIds = [...new Set(deposits.map((d) => d.user_id))];
  const [orgNames, userTags] = await Promise.all([
    getOrganizationNamesByIds(orgIds),
    getProfileTagsByIds(userIds),
  ]);

  return NextResponse.json({
    consumerDeposits: deposits.map((d) => ({
      id: d.id,
      userId: d.user_id,
      userTag: userTags.get(d.user_id) ?? d.user_id.slice(0, 8),
      method: d.method,
      amountClp: d.amount_clp,
      quotedUsdc: Number(d.quoted_usdc_minor ?? 0) / 1_000_000,
      status: d.status,
      bankReference: d.bank_reference,
      destinationAddress: d.destination_stellar_address,
      txHash: d.stellar_tx_hash,
      createdAt: d.created_at,
    })),
    merchantCheckouts: checkouts.map((c) => ({
      id: c.id,
      orgId: c.org_id,
      orgName: orgNames.get(c.org_id) ?? c.org_id,
      amountUsd: c.amount_usd,
      reference: c.reference,
      status: c.status,
      paymentMethod: c.payment_method,
      providerUrl: c.provider_url,
      destinationAddress: c.destination_stellar_address,
      createdAt: c.created_at,
    })),
    pendingCount: deposits.length + checkouts.length,
  });
}
