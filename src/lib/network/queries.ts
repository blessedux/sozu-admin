import "server-only";

import { aggregateCheckoutOnRampCounts } from "@/lib/db/checkout-sessions";
import { aggregateDepositOnRampCounts } from "@/lib/db/deposit-intents";
import { aggregateOffRampQueueCounts } from "@/lib/db/withdrawal-requests";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getNetworkTvl } from "@/lib/stellar/tvl";
import type {
  AcquisitionSource,
  CreditMetrics,
  FunnelStep,
  HeroMetrics,
  InvestorSnapshot,
  MerchantDetail,
  MerchantSummary,
  NetworkMapData,
  NetworkTransaction,
  OrbDetail,
  OrbSummary,
  OverviewSnapshot,
  ReferralMetrics,
  SettlementQueues,
  UserDetail,
  UserSummary,
  VelocityPoint,
} from "@/lib/network/types";

const DAY_MS = 86_400_000;

function isoSince(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function isoSinceHours(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function sozuTag(username: string | null | undefined): string {
  if (!username) return "—";
  return username.startsWith("@") ? username : `@${username}`;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function growthPercent(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function mapDepositStatus(status: string): keyof SettlementQueues["onRamp"] | null {
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

function mapClaimStatus(status: string): NetworkTransaction["status"] {
  if (status === "success") return "success";
  if (status === "pending") return "pending";
  return "failed";
}

function emptySettlementQueues(): SettlementQueues {
  const empty = { pending: 0, approved: 0, rejected: 0, completed: 0 };
  return {
    onRamp: { ...empty },
    offRamp: { ...empty },
    liquidity: {
      clpAvailable: 0,
      usdcAvailable: 0,
      pendingLiabilities: 0,
      pendingReceivables: 0,
      projectedRunwayDays: 0,
    },
  };
}

async function loadProfilesById(ids: string[]) {
  if (ids.length === 0) return new Map<string, { username: string | null; display_name: string | null }>();

  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("profiles")
    .select("id, username, display_name")
    .in("id", ids);

  return new Map((data ?? []).map((p) => [p.id, p]));
}

export async function getHeroMetrics(): Promise<HeroMetrics> {
  const sb = getSupabaseAdmin();
  const todayIso = startOfToday();
  const weekIso = isoSince(7);
  const prevWeekIso = isoSince(14);
  const monthIso = isoSince(30);
  const h24Iso = isoSinceHours(24);
  const d7Iso = isoSince(7);
  const d30Iso = isoSince(30);

  const [
    walletsRes,
    walletsWeekRes,
    walletsPrevWeekRes,
    walletsTodayRes,
    orgsRes,
    orgsWeekRes,
    claimsRes,
    claimsTodayRes,
    checkoutsRes,
    checkoutsTodayRes,
    checkoutsWeekRes,
    checkoutsMonthRes,
    faucetsRes,
    activeH24Res,
    activeD7Res,
    activeD30Res,
  ] = await Promise.all([
    sb.from("stellar_wallets").select("id, user_id, created_at", { count: "exact" }),
    sb.from("stellar_wallets").select("id", { count: "exact", head: true }).gte("created_at", weekIso),
    sb
      .from("stellar_wallets")
      .select("id", { count: "exact", head: true })
      .gte("created_at", prevWeekIso)
      .lt("created_at", weekIso),
    sb.from("stellar_wallets").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
    sb.from("organizations").select("id", { count: "exact" }),
    sb.from("organizations").select("id", { count: "exact", head: true }).gte("created_at", weekIso),
    sb.from("faucet_claims").select("id, user_id, amount, status, claimed_at"),
    sb.from("faucet_claims").select("id", { count: "exact", head: true }).gte("claimed_at", todayIso),
    sb.from("checkout_sessions").select("id, amount_usd, status, created_at"),
    sb
      .from("checkout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", todayIso),
    sb
      .from("checkout_sessions")
      .select("amount_usd")
      .eq("status", "completed")
      .gte("created_at", weekIso),
    sb
      .from("checkout_sessions")
      .select("amount_usd")
      .eq("status", "completed")
      .gte("created_at", monthIso),
    sb.from("faucets").select("id, status"),
    sb.from("faucet_claims").select("user_id").gte("claimed_at", h24Iso),
    sb.from("faucet_claims").select("user_id").gte("claimed_at", d7Iso),
    sb.from("faucet_claims").select("user_id").gte("claimed_at", d30Iso),
  ]);

  const wallets = walletsRes.data ?? [];
  const totalWallets = walletsRes.count ?? wallets.length;
  const walletsThisWeek = walletsWeekRes.count ?? 0;
  const walletsPrevWeek = walletsPrevWeekRes.count ?? 0;
  const walletsToday = walletsTodayRes.count ?? 0;

  const claims = claimsRes.data ?? [];
  const successfulClaims = claims.filter((c) => c.status === "success");
  const claimVolume = successfulClaims.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
  const uniqueClaimWallets = new Set(successfulClaims.map((c) => c.user_id).filter(Boolean)).size;

  const checkouts = (checkoutsRes.data ?? []).filter((c) => c.status === "completed");
  const checkoutVolume = checkouts.reduce((sum, c) => sum + Number(c.amount_usd ?? 0), 0);
  const paymentCount = checkouts.length + successfulClaims.length;
  const allPaymentAmounts = [
    ...successfulClaims.map((c) => Number(c.amount ?? 0)),
    ...checkouts.map((c) => Number(c.amount_usd ?? 0)),
  ];
  const lifetimeVolume = claimVolume + checkoutVolume;

  const weekCheckoutVolume = (checkoutsWeekRes.data ?? []).reduce(
    (sum, c) => sum + Number(c.amount_usd ?? 0),
    0
  );
  const monthCheckoutVolume = (checkoutsMonthRes.data ?? []).reduce(
    (sum, c) => sum + Number(c.amount_usd ?? 0),
    0
  );

  const claimsTodayVolume = successfulClaims
    .filter((c) => c.claimed_at >= todayIso)
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
  const claimsWeekVolume = successfulClaims
    .filter((c) => c.claimed_at >= weekIso)
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);
  const claimsMonthVolume = successfulClaims
    .filter((c) => c.claimed_at >= monthIso)
    .reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  const activeH24 = new Set([
    ...(activeH24Res.data ?? []).map((r) => r.user_id),
    ...wallets.filter((w) => w.created_at >= h24Iso).map((w) => w.user_id),
  ]).size;
  const activeD7 = new Set([
    ...(activeD7Res.data ?? []).map((r) => r.user_id),
    ...wallets.filter((w) => w.created_at >= d7Iso).map((w) => w.user_id),
  ]).size;
  const activeD30 = new Set([
    ...(activeD30Res.data ?? []).map((r) => r.user_id),
    ...wallets.filter((w) => w.created_at >= d30Iso).map((w) => w.user_id),
  ]).size;

  const walletsOlderThan7d = wallets.filter((w) => w.created_at < d7Iso).length;
  const retained = wallets.filter(
    (w) =>
      w.created_at < d7Iso &&
      (activeD7Res.data ?? []).some((a) => a.user_id === w.user_id)
  ).length;

  const orgTotal = orgsRes.count ?? 0;
  const orgsWeek = orgsWeekRes.count ?? 0;
  const activeFaucets = (faucetsRes.data ?? []).filter((f) => f.status === "active").length;

  return {
    walletsCreated: {
      today: walletsToday,
      thisWeek: walletsThisWeek,
      total: totalWallets,
      growthPercent: growthPercent(walletsThisWeek, walletsPrevWeek),
    },
    activeWallets: {
      h24: activeH24,
      d7: activeD7,
      d30: activeD30,
      retentionPercent: pct(retained, walletsOlderThan7d),
    },
    activeMerchants: {
      total: orgTotal,
      newThisWeek: orgsWeek,
      transactionsPerMerchant: orgTotal > 0 ? Math.round((paymentCount / orgTotal) * 10) / 10 : 0,
    },
    transactionVolume: {
      today: Math.round((claimsTodayVolume + (checkoutsTodayRes.count ?? 0)) * 100) / 100,
      week: Math.round((claimsWeekVolume + weekCheckoutVolume) * 100) / 100,
      month: Math.round((claimsMonthVolume + monthCheckoutVolume) * 100) / 100,
      lifetime: Math.round(lifetimeVolume * 100) / 100,
    },
    payments: {
      count: paymentCount,
      averageTicket:
        paymentCount > 0
          ? Math.round((lifetimeVolume / paymentCount) * 100) / 100
          : 0,
      largestPayment:
        allPaymentAmounts.length > 0 ? Math.max(...allPaymentAmounts) : 0,
    },
    orbs: {
      active: activeFaucets,
      claimsToday: claimsTodayRes.count ?? 0,
      walletsCreated: uniqueClaimWallets,
      conversionPercent: pct(uniqueClaimWallets, Math.max(claims.length, 1)),
    },
  };
}

export async function getUsers(): Promise<UserSummary[]> {
  const sb = getSupabaseAdmin();

  const [{ data: profiles }, { data: claims }, { data: referrals }] = await Promise.all([
    sb.from("profiles").select("id, username, display_name, created_at").order("created_at", { ascending: false }),
    sb.from("faucet_claims").select("user_id, amount, status").eq("status", "success"),
    sb.from("referrals").select("referrer_id, referred_user_id, used"),
  ]);

  const txByUser = new Map<string, { count: number; volume: number }>();
  for (const claim of claims ?? []) {
    if (!claim.user_id) continue;
    const current = txByUser.get(claim.user_id) ?? { count: 0, volume: 0 };
    current.count += 1;
    current.volume += Number(claim.amount ?? 0);
    txByUser.set(claim.user_id, current);
  }

  const referredUsers = new Set(
    (referrals ?? []).filter((r) => r.used && r.referred_user_id).map((r) => r.referred_user_id as string)
  );
  const orbUsers = new Set((claims ?? []).map((c) => c.user_id).filter(Boolean));

  return (profiles ?? []).map((profile) => {
    const stats = txByUser.get(profile.id) ?? { count: 0, volume: 0 };
    let referralSource = "Direct";
    if (referredUsers.has(profile.id)) referralSource = "Referral";
    else if (orbUsers.has(profile.id)) referralSource = "Orb";

    return {
      id: profile.id,
      sozuTag: sozuTag(profile.username ?? profile.display_name),
      createdAt: formatDate(profile.created_at),
      transactions: stats.count,
      volume: Math.round(stats.volume * 100) / 100,
      referralSource,
    };
  });
}

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const sb = getSupabaseAdmin();

  const [{ data: profile }, { data: claims }, { data: referralsOut }, { data: referralIn }, { data: wallet }] =
    await Promise.all([
      sb.from("profiles").select("id, username, display_name, created_at").eq("id", id).maybeSingle(),
      sb
        .from("faucet_claims")
        .select("id, amount, status, claimed_at, faucet_id")
        .eq("user_id", id)
        .order("claimed_at", { ascending: false }),
      sb.from("referrals").select("id, created_at").eq("referrer_id", id),
      sb.from("referrals").select("id, referrer_id, created_at").eq("referred_user_id", id).eq("used", true).maybeSingle(),
      sb.from("stellar_wallets").select("created_at").eq("user_id", id).order("created_at").limit(1).maybeSingle(),
    ]);

  if (!profile) return null;

  const successfulClaims = (claims ?? []).filter((c) => c.status === "success");
  const volume = successfulClaims.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  let referralSource = "Direct";
  if (referralIn) referralSource = "Referral";
  else if (successfulClaims.length > 0) referralSource = "Orb";

  let orbSource = "—";
  if (successfulClaims[0]?.faucet_id) {
    const { data: faucet } = await sb
      .from("faucets")
      .select("name")
      .eq("id", successfulClaims[0].faucet_id)
      .maybeSingle();
    orbSource = faucet?.name ?? "Orb";
  }

  const activity: UserDetail["activity"] = [];

  if (wallet?.created_at) {
    activity.push({
      id: `wallet-${id}`,
      action: "Wallet created",
      timestamp: wallet.created_at,
    });
  }

  for (const claim of successfulClaims.slice(0, 10)) {
    activity.push({
      id: claim.id,
      action: "Orb claim",
      timestamp: claim.claimed_at,
      detail: `$${Number(claim.amount ?? 0).toFixed(2)} USDC`,
    });
  }

  for (const ref of (referralsOut ?? []).slice(0, 5)) {
    activity.push({
      id: ref.id,
      action: "Referral sent",
      timestamp: ref.created_at,
    });
  }

  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    id: profile.id,
    sozuTag: sozuTag(profile.username ?? profile.display_name),
    createdAt: formatDate(profile.created_at),
    transactions: successfulClaims.length,
    volume: Math.round(volume * 100) / 100,
    referralSource,
    orbSource,
    rewardsClaimed: successfulClaims.length,
    referrals: referralsOut?.length ?? 0,
    creditScore: 0,
    activity,
  };
}

export async function getMerchants(): Promise<MerchantSummary[]> {
  const sb = getSupabaseAdmin();

  const [{ data: orgs }, { data: checkouts }] = await Promise.all([
    sb.from("organizations").select("id, name, type, created_at").order("created_at", { ascending: false }),
    sb.from("checkout_sessions").select("org_id, amount_usd, status").eq("status", "completed"),
  ]);

  const statsByOrg = new Map<string, { count: number; volume: number }>();
  for (const checkout of checkouts ?? []) {
    if (!checkout.org_id) continue;
    const current = statsByOrg.get(checkout.org_id) ?? { count: 0, volume: 0 };
    current.count += 1;
    current.volume += Number(checkout.amount_usd ?? 0);
    statsByOrg.set(checkout.org_id, current);
  }

  return (orgs ?? []).map((org) => {
    const stats = statsByOrg.get(org.id) ?? { count: 0, volume: 0 };
    const merchantScore = Math.min(100, stats.count * 5 + Math.round(stats.volume));

    return {
      id: org.id,
      name: org.name,
      location: "—",
      category: org.type ?? "merchant",
      transactions: stats.count,
      volume: Math.round(stats.volume * 100) / 100,
      merchantScore,
    };
  });
}

export async function getMerchantDetail(id: string): Promise<MerchantDetail | null> {
  const merchants = await getMerchants();
  const base = merchants.find((m) => m.id === id);
  if (!base) return null;

  const sb = getSupabaseAdmin();
  const { data: org } = await sb
    .from("organizations")
    .select("created_at")
    .eq("id", id)
    .maybeSingle();

  return {
    ...base,
    joinDate: org?.created_at ? formatDate(org.created_at) : "—",
    uniqueCustomers: 0,
    repeatCustomers: 0,
    averageTicket:
      base.transactions > 0 ? Math.round((base.volume / base.transactions) * 100) / 100 : 0,
    referralsGenerated: 0,
  };
}

export async function getOrbs(): Promise<OrbSummary[]> {
  const sb = getSupabaseAdmin();

  const [{ data: faucets }, { data: posDevices }, { data: claims }] = await Promise.all([
    sb.from("faucets").select("id, name, location_name, status, created_at, claim_amount"),
    sb.from("merchant_pos_devices").select("id, name, device_type, is_online, org_id, created_at"),
    sb.from("faucet_claims").select("faucet_id, user_id, amount, status"),
  ]);

  const claimsByFaucet = new Map<string, { claims: number; wallets: Set<string>; volume: number }>();
  for (const claim of claims ?? []) {
    if (!claim.faucet_id) continue;
    const bucket = claimsByFaucet.get(claim.faucet_id) ?? {
      claims: 0,
      wallets: new Set<string>(),
      volume: 0,
    };
    if (claim.status === "success") {
      bucket.claims += 1;
      if (claim.user_id) bucket.wallets.add(claim.user_id);
      bucket.volume += Number(claim.amount ?? 0);
    }
    claimsByFaucet.set(claim.faucet_id, bucket);
  }

  const orbRows: OrbSummary[] = (faucets ?? []).map((faucet) => {
    const stats = claimsByFaucet.get(faucet.id) ?? { claims: 0, wallets: new Set<string>(), volume: 0 };
    const uniqueWallets = stats.wallets.size;
    const costPerWallet = uniqueWallets > 0 ? stats.volume / uniqueWallets : 0;

    return {
      id: faucet.id,
      name: faucet.name,
      location: faucet.location_name ?? "—",
      status: faucet.status === "active" ? "active" : "inactive",
      claims: stats.claims,
      uniqueWallets,
      volumeGenerated: Math.round(stats.volume * 100) / 100,
      roi: costPerWallet > 0 ? Math.round((stats.volume / costPerWallet) * 10) / 10 : 0,
    };
  });

  for (const device of posDevices ?? []) {
    if (device.device_type !== "nfc") continue;
    orbRows.push({
      id: device.id,
      name: device.name,
      location: "—",
      status: device.is_online ? "active" : "inactive",
      claims: 0,
      uniqueWallets: 0,
      volumeGenerated: 0,
      roi: 0,
    });
  }

  return orbRows;
}

export async function getOrbDetail(id: string): Promise<OrbDetail | null> {
  const orbs = await getOrbs();
  const base = orbs.find((o) => o.id === id);
  if (!base) return null;

  const sb = getSupabaseAdmin();

  const [{ data: faucet }, { data: device }, { data: claims }] = await Promise.all([
    sb.from("faucets").select("created_at, slug").eq("id", id).maybeSingle(),
    sb.from("merchant_pos_devices").select("created_at, device_type").eq("id", id).maybeSingle(),
    sb.from("faucet_claims").select("user_id, status").eq("faucet_id", id),
  ]);

  const successfulClaims = (claims ?? []).filter((c) => c.status === "success");
  const walletCounts = new Map<string, number>();
  for (const claim of successfulClaims) {
    if (!claim.user_id) continue;
    walletCounts.set(claim.user_id, (walletCounts.get(claim.user_id) ?? 0) + 1);
  }
  const repeatWallets = [...walletCounts.values()].filter((count) => count > 1).length;

  const createdDate = faucet?.created_at
    ? formatDate(faucet.created_at)
    : device?.created_at
      ? formatDate(device.created_at)
      : "—";

  return {
    ...base,
    createdDate,
    nfcIdentifier: faucet?.slug ? `NFC-${faucet.slug.toUpperCase()}` : device ? `NFC-${id.slice(0, 8).toUpperCase()}` : "—",
    repeatWallets,
    transactionsGenerated: successfulClaims.length,
    revenueGenerated: Math.round(base.volumeGenerated * 0.02 * 100) / 100,
    costPerWallet:
      base.uniqueWallets > 0
        ? Math.round((base.volumeGenerated / base.uniqueWallets) * 100) / 100
        : 0,
  };
}

export async function getTransactions(limit = 100): Promise<NetworkTransaction[]> {
  const sb = getSupabaseAdmin();
  const network = process.env.STELLAR_NETWORK ?? "testnet";

  const [{ data: claims }, { data: deposits }, { data: checkouts }] = await Promise.all([
    sb
      .from("faucet_claims")
      .select("id, user_id, faucet_id, amount, status, claimed_at, tx_hash")
      .not("tx_hash", "is", null)
      .order("claimed_at", { ascending: false })
      .limit(limit),
    sb
      .from("deposit_intents")
      .select("id, user_id, quoted_usdc_minor, status, created_at, stellar_tx_hash, amount_clp")
      .not("stellar_tx_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    sb
      .from("checkout_sessions")
      .select("id, org_id, amount_usd, status, created_at, destination_stellar_address")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const userIds = new Set<string>();
  const orgIds = new Set<string>();
  const faucetIds = new Set<string>();

  for (const claim of claims ?? []) {
    if (claim.user_id) userIds.add(claim.user_id);
    if (claim.faucet_id) faucetIds.add(claim.faucet_id);
  }
  for (const deposit of deposits ?? []) {
    if (deposit.user_id) userIds.add(deposit.user_id);
  }
  for (const checkout of checkouts ?? []) {
    if (checkout.org_id) orgIds.add(checkout.org_id);
  }

  const [profiles, orgs, faucets] = await Promise.all([
    loadProfilesById([...userIds]),
    (async () => {
      if (orgIds.size === 0) return new Map<string, string>();
      const { data } = await sb.from("organizations").select("id, name").in("id", [...orgIds]);
      return new Map((data ?? []).map((o) => [o.id, o.name]));
    })(),
    (async () => {
      if (faucetIds.size === 0) return new Map<string, string>();
      const { data } = await sb.from("faucets").select("id, name").in("id", [...faucetIds]);
      return new Map((data ?? []).map((f) => [f.id, f.name]));
    })(),
  ]);

  const rows: NetworkTransaction[] = [];

  for (const claim of claims ?? []) {
    const profile = claim.user_id ? profiles.get(claim.user_id) : undefined;
    rows.push({
      id: claim.id,
      time: claim.claimed_at,
      sender: claim.faucet_id ? (faucets.get(claim.faucet_id) ?? "Orb") : "Orb",
      receiver: sozuTag(profile?.username ?? profile?.display_name),
      asset: "USDC",
      amount: Number(claim.amount ?? 0),
      memo: "orb-claim",
      hash: claim.tx_hash,
      status: mapClaimStatus(claim.status),
      network,
    });
  }

  for (const deposit of deposits ?? []) {
    const profile = deposit.user_id ? profiles.get(deposit.user_id) : undefined;
    rows.push({
      id: deposit.id,
      time: deposit.created_at,
      sender: "On-ramp",
      receiver: sozuTag(profile?.username ?? profile?.display_name),
      asset: "USDC",
      amount: Number(deposit.quoted_usdc_minor ?? 0) / 1_000_000,
      memo: deposit.amount_clp ? `${deposit.amount_clp} CLP` : "",
      hash: deposit.stellar_tx_hash,
      status: deposit.status === "completed" || deposit.status === "funded" ? "success" : "pending",
      network,
    });
  }

  for (const checkout of checkouts ?? []) {
    rows.push({
      id: checkout.id,
      time: checkout.created_at,
      sender: "Checkout",
      receiver: checkout.org_id ? (orgs.get(checkout.org_id) ?? "Merchant") : "Merchant",
      asset: "USDC",
      amount: Number(checkout.amount_usd ?? 0),
      memo: checkout.destination_stellar_address?.slice(0, 8) ?? "",
      hash: checkout.id,
      status: "success",
      network,
    });
  }

  rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return rows.slice(0, limit);
}

export async function getReferralMetrics(): Promise<ReferralMetrics> {
  const sb = getSupabaseAdmin();

  const [{ data: referrals }, { data: profiles }, walletsRes] = await Promise.all([
    sb.from("referrals").select("id, referrer_id, referred_user_id, used, created_at"),
    sb.from("profiles").select("id, username, display_name"),
    sb.from("stellar_wallets").select("id", { count: "exact", head: true }),
  ]);

  const totalWallets = walletsRes.count ?? 0;
  const usedReferrals = (referrals ?? []).filter((r) => r.used && r.referred_user_id);
  const referralRate = pct(usedReferrals.length, totalWallets);

  const referrerCounts = new Map<string, number>();
  for (const ref of usedReferrals) {
    referrerCounts.set(ref.referrer_id, (referrerCounts.get(ref.referrer_id) ?? 0) + 1);
  }

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, sozuTag(p.username ?? p.display_name)])
  );

  const topReferrers = [...referrerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({
      id,
      label: profileMap.get(id) ?? id.slice(0, 8),
      count,
      type: "user" as const,
    }));

  return {
    referralRate,
    costPerReferral: 0,
    referralConversion: pct(usedReferrals.length, Math.max(referrals?.length ?? 0, 1)),
    referralRevenue: 0,
    topReferrers,
  };
}

export async function getSettlementQueues(): Promise<SettlementQueues> {
  const sb = getSupabaseAdmin();
  const [offRamp, depositCounts, checkoutCounts] = await Promise.all([
    aggregateOffRampQueueCounts(),
    aggregateDepositOnRampCounts(),
    aggregateCheckoutOnRampCounts(),
  ]);

  const onRamp = {
    pending: depositCounts.pending + checkoutCounts.pending,
    approved: depositCounts.approved + checkoutCounts.approved,
    rejected: depositCounts.rejected + checkoutCounts.rejected,
    completed: depositCounts.completed + checkoutCounts.completed,
  };

  const { data: deposits } = await sb
    .from("deposit_intents")
    .select("status, amount_clp, quoted_usdc_minor");

  let clpPending = 0;
  let usdcCompleted = 0;

  for (const deposit of deposits ?? []) {
    const bucket = mapDepositStatus(deposit.status);
    if (bucket === "pending") clpPending += Number(deposit.amount_clp ?? 0);
    if (bucket === "completed") usdcCompleted += Number(deposit.quoted_usdc_minor ?? 0) / 1_000_000;
  }

  return {
    onRamp,
    offRamp,
    liquidity: {
      clpAvailable: 0,
      usdcAvailable: Math.round(usdcCompleted * 100) / 100,
      pendingLiabilities: Math.round(clpPending),
      pendingReceivables: 0,
      projectedRunwayDays: 0,
    },
  };
}

export async function getCreditMetrics(): Promise<CreditMetrics> {
  const sb = getSupabaseAdmin();

  const [{ data: loans }, { data: installments }, { data: repayments }] = await Promise.all([
    sb.from("credit_agreements").select("id, principal"),
    sb.from("installment_schedule").select("loan_id, status, total_due"),
    sb.from("repayment_events").select("loan_id, amount"),
  ]);

  const loansIssued = loans?.length ?? 0;
  const outstandingPrincipal = (installments ?? [])
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.total_due ?? 0), 0);

  const paidInstallments = (installments ?? []).filter((i) => i.status === "paid").length;
  const totalInstallments = installments?.length ?? 0;
  const repaymentRate = pct(paidInstallments, totalInstallments);

  const defaulted = (installments ?? []).filter((i) => i.status === "defaulted").length;
  const defaultRate = pct(defaulted, totalInstallments);

  const yieldGenerated = (repayments ?? []).reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return {
    loansIssued,
    outstandingPrincipal: Math.round(outstandingPrincipal * 100) / 100,
    repaymentRate,
    defaultRate,
    yieldGenerated: Math.round(yieldGenerated * 100) / 100,
  };
}

export async function getInvestorSnapshot(): Promise<InvestorSnapshot> {
  const [hero, referrals, transactions] = await Promise.all([
    getHeroMetrics(),
    getReferralMetrics(),
    getTransactions(20),
  ]);

  return {
    wallets: hero.walletsCreated.total,
    merchants: hero.activeMerchants.total,
    transactions: hero.payments.count,
    weekOneRetention: hero.activeWallets.retentionPercent,
    referralRate: referrals.referralRate,
    volume: hero.transactionVolume.month,
    orbActivity: hero.orbs.active,
    liveTransactions: transactions,
  };
}

export async function getGrowthData(): Promise<{
  funnel: FunnelStep[];
  acquisition: AcquisitionSource[];
  velocity: VelocityPoint[];
}> {
  const sb = getSupabaseAdmin();
  const weekIso = isoSince(7);

  const [{ data: claims }, { data: wallets }, { data: referrals }, { data: checkouts }] =
    await Promise.all([
      sb.from("faucet_claims").select("id, user_id, status"),
      sb.from("stellar_wallets").select("id, user_id, created_at"),
      sb.from("referrals").select("id, referred_user_id, used"),
      sb.from("checkout_sessions").select("id, status").eq("status", "completed"),
    ]);

  const claimAttempts = claims?.length ?? 0;
  const claimSuccess = (claims ?? []).filter((c) => c.status === "success").length;
  const walletCount = wallets?.length ?? 0;

  const txByUser = new Map<string, number>();
  for (const claim of claims ?? []) {
    if (claim.status !== "success" || !claim.user_id) continue;
    txByUser.set(claim.user_id, (txByUser.get(claim.user_id) ?? 0) + 1);
  }
  const firstPayment = [...txByUser.values()].filter((count) => count >= 1).length;
  const secondPayment = [...txByUser.values()].filter((count) => count >= 2).length;
  const referralCount = (referrals ?? []).filter((r) => r.used && r.referred_user_id).length;
  const merchantVisits = checkouts?.length ?? 0;

  const funnelSteps = [
    { id: "seen", label: "Orb Seen", count: claimAttempts },
    { id: "claimed", label: "Orb Claimed", count: claimSuccess },
    { id: "wallet", label: "Wallet Created", count: walletCount },
    { id: "first_pay", label: "First Payment", count: firstPayment },
    { id: "second_pay", label: "Second Payment", count: secondPayment },
    { id: "referral", label: "Referral", count: referralCount },
    { id: "merchant", label: "Merchant Visit", count: merchantVisits },
  ];

  const funnel: FunnelStep[] = funnelSteps.map((step, index) => {
    const prev = index === 0 ? step.count : funnelSteps[index - 1].count;
    const conversionPercent = index === 0 ? 100 : pct(step.count, prev);
    const dropoffPercent = index === 0 ? 0 : pct(prev - step.count, prev);
    return { ...step, conversionPercent, dropoffPercent };
  });

  const orbUsers = new Set((claims ?? []).map((c) => c.user_id).filter(Boolean));
  const referredUsers = new Set(
    (referrals ?? []).filter((r) => r.used && r.referred_user_id).map((r) => r.referred_user_id as string)
  );
  const orbCount = [...orbUsers].filter((id) => wallets?.some((w) => w.user_id === id)).length;
  const referralAcquisition = referredUsers.size;
  const directCount = Math.max(walletCount - orbCount - referralAcquisition, 0);

  const acquisition: AcquisitionSource[] = [
    { source: "Orb", count: orbCount, percent: pct(orbCount, walletCount) },
    { source: "Referral", count: referralAcquisition, percent: pct(referralAcquisition, walletCount) },
    { source: "Direct", count: directCount, percent: pct(directCount, walletCount) },
  ].filter((s) => s.count > 0 || walletCount === 0);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const velocityMap = new Map<string, number>();
  for (const wallet of wallets ?? []) {
    if (wallet.created_at < weekIso) continue;
    const day = dayLabels[new Date(wallet.created_at).getDay()];
    velocityMap.set(day, (velocityMap.get(day) ?? 0) + 1);
  }

  const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const velocity: VelocityPoint[] = orderedDays.map((period) => ({
    period,
    count: velocityMap.get(period) ?? 0,
  }));

  return { funnel, acquisition, velocity };
}

export async function getNetworkMap(): Promise<NetworkMapData> {
  const sb = getSupabaseAdmin();

  const [{ data: profiles }, { data: orgs }, { data: faucets }, { data: claims }, { data: referrals }] =
    await Promise.all([
      sb.from("profiles").select("id, username, display_name").limit(50),
      sb.from("organizations").select("id, name").limit(20),
      sb.from("faucets").select("id, name").limit(20),
      sb.from("faucet_claims").select("faucet_id, user_id, status"),
      sb.from("referrals").select("referrer_id, referred_user_id, used"),
    ]);

  const userActivity = new Map<string, number>();
  for (const claim of claims ?? []) {
    if (claim.status !== "success" || !claim.user_id) continue;
    userActivity.set(claim.user_id, (userActivity.get(claim.user_id) ?? 0) + 1);
  }

  const topUsers = [...userActivity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, activity]) => {
      const profile = (profiles ?? []).find((p) => p.id === id);
      return {
        id,
        type: "user" as const,
        label: sozuTag(profile?.username ?? profile?.display_name),
        activity,
      };
    });

  const nodes = [
    ...(faucets ?? []).slice(0, 4).map((faucet) => ({
      id: faucet.id,
      type: "orb" as const,
      label: faucet.name,
      activity:
        (claims ?? []).filter((c) => c.faucet_id === faucet.id && c.status === "success").length,
    })),
    ...(orgs ?? []).slice(0, 4).map((org) => ({
      id: org.id,
      type: "merchant" as const,
      label: org.name,
      activity: 0,
    })),
    ...topUsers,
  ];

  const edges: NetworkMapData["edges"] = [];

  for (const claim of claims ?? []) {
    if (claim.status !== "success" || !claim.faucet_id || !claim.user_id) continue;
    if (!nodes.some((n) => n.id === claim.faucet_id) || !nodes.some((n) => n.id === claim.user_id)) {
      continue;
    }
    const existing = edges.find(
      (e) => e.source === claim.faucet_id && e.target === claim.user_id && e.type === "claim"
    );
    if (existing) existing.weight += 1;
    else edges.push({ source: claim.faucet_id, target: claim.user_id, type: "claim", weight: 1 });
  }

  for (const ref of referrals ?? []) {
    if (!ref.used || !ref.referred_user_id) continue;
    if (!nodes.some((n) => n.id === ref.referrer_id) || !nodes.some((n) => n.id === ref.referred_user_id)) {
      continue;
    }
    edges.push({
      source: ref.referrer_id,
      target: ref.referred_user_id,
      type: "referral",
      weight: 1,
    });
  }

  return { nodes, edges };
}

export async function getOverviewSnapshot(): Promise<OverviewSnapshot> {
  const [hero, tvl] = await Promise.all([getHeroMetrics(), getNetworkTvl()]);

  return {
    tvl,
    wallets: hero.walletsCreated.total,
    activeWallets24h: hero.activeWallets.h24,
    merchants: hero.activeMerchants.total,
    volumeMonth: hero.transactionVolume.month,
    payments: hero.payments.count,
    activeOrbs: hero.orbs.active,
  };
}

export async function getDashboardOverview(): Promise<{
  hero: HeroMetrics;
  snapshot: OverviewSnapshot;
}> {
  const [hero, tvl] = await Promise.all([getHeroMetrics(), getNetworkTvl()]);

  return {
    hero,
    snapshot: {
      tvl,
      wallets: hero.walletsCreated.total,
      activeWallets24h: hero.activeWallets.h24,
      merchants: hero.activeMerchants.total,
      volumeMonth: hero.transactionVolume.month,
      payments: hero.payments.count,
      activeOrbs: hero.orbs.active,
    },
  };
}
