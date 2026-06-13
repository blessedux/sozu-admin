import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { OnRampQueueCounts } from "@/lib/db/checkout-sessions";

export type DepositIntentRow = {
  id: string;
  user_id: string;
  method: string;
  amount_clp: number;
  quoted_usdc_minor: number;
  status: string;
  destination_stellar_address: string;
  bank_reference: string | null;
  stellar_tx_hash: string | null;
  created_at: string;
  updated_at: string;
};

function mapDepositStatus(status: string): keyof OnRampQueueCounts | null {
  switch (status) {
    case "created":
    case "awaiting_payment":
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
    case "failed":
      return "rejected";
    case "completed":
    case "funded":
    case "confirmed":
      return "completed";
    default:
      return null;
  }
}

export async function aggregateDepositOnRampCounts(): Promise<OnRampQueueCounts> {
  const counts: OnRampQueueCounts = { pending: 0, approved: 0, rejected: 0, completed: 0 };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("deposit_intents")
      .select("status");

    if (error || !data?.length) return counts;

    for (const row of data) {
      const bucket = mapDepositStatus(row.status as string);
      if (bucket) counts[bucket] += 1;
    }
  } catch (err) {
    console.error("[deposit-intents] aggregate counts:", err);
  }

  return counts;
}

export async function listPendingDepositsForAdmin(limit = 100): Promise<DepositIntentRow[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("deposit_intents")
      .select(
        "id, user_id, method, amount_clp, quoted_usdc_minor, status, destination_stellar_address, bank_reference, stellar_tx_hash, created_at, updated_at"
      )
      .in("status", ["created", "awaiting_payment", "pending", "approved"])
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[deposit-intents] admin list error:", error.message);
      return [];
    }
    return (data as DepositIntentRow[]) ?? [];
  } catch (err) {
    console.error("[deposit-intents] admin list:", err);
    return [];
  }
}
