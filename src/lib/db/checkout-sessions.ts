import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type CheckoutSessionStatus = "pending" | "completed" | "failed" | "expired";

export type CheckoutSessionRow = {
  id: string;
  org_id: string;
  amount_usd: string;
  reference: string | null;
  status: CheckoutSessionStatus;
  destination_stellar_address: string;
  provider_url: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type OnRampQueueCounts = {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
};

function mapCheckoutStatus(status: string): keyof OnRampQueueCounts | null {
  switch (status) {
    case "pending":
      return "pending";
    case "completed":
      return "completed";
    case "failed":
    case "expired":
      return "rejected";
    default:
      return null;
  }
}

export async function aggregateCheckoutOnRampCounts(): Promise<OnRampQueueCounts> {
  const counts: OnRampQueueCounts = { pending: 0, approved: 0, rejected: 0, completed: 0 };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("checkout_sessions")
      .select("status")
      .is("deleted_at", null);

    if (error || !data?.length) return counts;

    for (const row of data) {
      const bucket = mapCheckoutStatus(row.status as string);
      if (bucket) counts[bucket] += 1;
    }
  } catch (err) {
    console.error("[checkout-sessions] aggregate counts:", err);
  }

  return counts;
}

export async function listPendingCheckoutsForAdmin(limit = 100): Promise<CheckoutSessionRow[]> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("checkout_sessions")
      .select(
        "id, org_id, amount_usd, reference, status, destination_stellar_address, provider_url, payment_method, created_at, updated_at, deleted_at"
      )
      .eq("status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[checkout-sessions] admin list error:", error.message);
      return [];
    }
    return (data as CheckoutSessionRow[]) ?? [];
  } catch (err) {
    console.error("[checkout-sessions] admin list:", err);
    return [];
  }
}
