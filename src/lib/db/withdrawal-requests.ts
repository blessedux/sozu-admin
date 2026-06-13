import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export type WithdrawalStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export type WithdrawalRequest = {
  id: string;
  org_id: string;
  amount_usd: string;
  source_stellar_address: string;
  bank_account_holder: string;
  bank_country: string;
  bank_account_number: string;
  bank_routing_code: string | null;
  bank_currency: string | null;
  status: WithdrawalStatus;
  provider_withdrawal_id: string | null;
  provider_event_at: string | null;
  external_ref: string;
  estimated_arrival: string | null;
  fiat_sent_at: string | null;
  fiat_sent_by: string | null;
  merchant_confirmed_at: string | null;
  release_tx_hash: string | null;
  release_destination_address: string | null;
  created_at: string;
  updated_at: string;
};

export type OffRampQueueCounts = {
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
};

let withdrawalTableAvailable: boolean | null = null;

export async function isWithdrawalRequestsTableAvailable(): Promise<boolean> {
  if (withdrawalTableAvailable !== null) return withdrawalTableAvailable;

  try {
    const { error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .select("id", { count: "exact", head: true });

    withdrawalTableAvailable = !error;
  } catch {
    withdrawalTableAvailable = false;
  }

  return withdrawalTableAvailable;
}

export async function aggregateOffRampQueueCounts(): Promise<OffRampQueueCounts> {
  const counts: OffRampQueueCounts = { pending: 0, approved: 0, rejected: 0, completed: 0 };

  if (!(await isWithdrawalRequestsTableAvailable())) return counts;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .select("status");

    if (error || !data?.length) return counts;

    for (const row of data) {
      const status = row.status as WithdrawalStatus;
      if (status === "pending") counts.pending += 1;
      else if (status === "processing") counts.approved += 1;
      else if (status === "completed") counts.completed += 1;
      else if (status === "failed" || status === "cancelled") counts.rejected += 1;
    }
  } catch (err) {
    console.error("[withdrawal-requests] aggregate counts:", err);
  }

  return counts;
}

/** Ops action queue — CLP not sent yet. */
export async function listPendingWithdrawalsForAdmin(
  limit = 100,
): Promise<WithdrawalRequest[]> {
  if (!(await isWithdrawalRequestsTableAvailable())) return [];

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[withdrawal-requests] admin list error:", error.message);
      return [];
    }
    return (data as WithdrawalRequest[]) ?? [];
  } catch (err) {
    console.error("[withdrawal-requests] admin list:", err);
    return [];
  }
}

/** Awaiting merchant passkey release after ops sent CLP. */
export async function listProcessingWithdrawalsForAdmin(
  limit = 100,
): Promise<WithdrawalRequest[]> {
  if (!(await isWithdrawalRequestsTableAvailable())) return [];

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .select("*")
      .eq("status", "processing")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return [];
    return (data as WithdrawalRequest[]) ?? [];
  } catch {
    return [];
  }
}

/** Ops confirmed CLP bank transfer — merchant must release USDC in SozuPay. */
export async function markWithdrawalFiatSent(
  id: string,
  adminEmail: string,
): Promise<WithdrawalRequest | null> {
  const now = new Date().toISOString();

  if (!(await isWithdrawalRequestsTableAvailable())) return null;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .update({
        status: "processing",
        updated_at: now,
        fiat_sent_at: now,
        fiat_sent_by: adminEmail,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (error) {
      console.error("[withdrawal-requests] fiat sent error:", error.message);
      return null;
    }
    return (data as WithdrawalRequest) ?? null;
  } catch (err) {
    console.error("[withdrawal-requests] fiat sent:", err);
    return null;
  }
}

export async function markWithdrawalFailed(id: string): Promise<WithdrawalRequest | null> {
  const now = new Date().toISOString();

  if (!(await isWithdrawalRequestsTableAvailable())) return null;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("withdrawal_requests")
      .update({
        status: "failed",
        updated_at: now,
        provider_event_at: now,
      })
      .eq("id", id)
      .in("status", ["pending", "processing"])
      .select()
      .maybeSingle();

    if (error) {
      console.error("[withdrawal-requests] fail error:", error.message);
      return null;
    }
    return (data as WithdrawalRequest) ?? null;
  } catch (err) {
    console.error("[withdrawal-requests] fail:", err);
    return null;
  }
}

export async function getOrganizationNamesByIds(
  orgIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!orgIds.length) return map;

  try {
    const { data } = await getSupabaseAdmin()
      .from("organizations")
      .select("id, name")
      .in("id", orgIds);

    for (const org of data ?? []) {
      map.set(org.id as string, (org.name as string) ?? org.id);
    }
  } catch {
    // optional
  }

  return map;
}

export async function getProfileTagsByIds(
  userIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!userIds.length) return map;

  try {
    const { data } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);

    for (const profile of data ?? []) {
      const tag = profile.username ?? profile.display_name ?? profile.id.slice(0, 8);
      map.set(profile.id as string, tag.startsWith("@") ? tag : `@${tag}`);
    }
  } catch {
    // optional
  }

  return map;
}
