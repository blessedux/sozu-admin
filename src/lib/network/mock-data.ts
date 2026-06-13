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
  ReferralMetrics,
  SettlementQueues,
  UserDetail,
  UserSummary,
  VelocityPoint,
} from "@/lib/network/types";

/** Scaffold data — replace with Supabase + Horizon aggregations. */
export const mockHeroMetrics: HeroMetrics = {
  walletsCreated: { today: 12, thisWeek: 47, total: 317, growthPercent: 18.4 },
  activeWallets: { h24: 89, d7: 142, d30: 198, retentionPercent: 34.2 },
  activeMerchants: { total: 12, newThisWeek: 2, transactionsPerMerchant: 153.5 },
  transactionVolume: { today: 1240, week: 4820, month: 14300, lifetime: 28600 },
  payments: { count: 1842, averageTicket: 7.77, largestPayment: 420 },
  orbs: { active: 8, claimsToday: 23, walletsCreated: 156, conversionPercent: 41.2 },
};

export const mockFunnel: FunnelStep[] = [
  { id: "seen", label: "Orb Seen", count: 2400, conversionPercent: 100, dropoffPercent: 0 },
  { id: "claimed", label: "Orb Claimed", count: 980, conversionPercent: 40.8, dropoffPercent: 59.2 },
  { id: "wallet", label: "Wallet Created", count: 317, conversionPercent: 32.3, dropoffPercent: 67.7 },
  { id: "first_pay", label: "First Payment", count: 198, conversionPercent: 62.5, dropoffPercent: 37.5 },
  { id: "second_pay", label: "Second Payment", count: 108, conversionPercent: 54.5, dropoffPercent: 45.5 },
  { id: "referral", label: "Referral", count: 82, conversionPercent: 75.9, dropoffPercent: 24.1 },
  { id: "merchant", label: "Merchant Visit", count: 64, conversionPercent: 78.0, dropoffPercent: 22.0 },
];

export const mockAcquisition: AcquisitionSource[] = [
  { source: "Orb", count: 156, percent: 49.2 },
  { source: "Merchant QR", count: 89, percent: 28.1 },
  { source: "Referral", count: 52, percent: 16.4 },
  { source: "Direct", count: 20, percent: 6.3 },
];

export const mockVelocity: VelocityPoint[] = [
  { period: "Mon", count: 8 },
  { period: "Tue", count: 11 },
  { period: "Wed", count: 6 },
  { period: "Thu", count: 14 },
  { period: "Fri", count: 9 },
  { period: "Sat", count: 18 },
  { period: "Sun", count: 12 },
];

export const mockOrbs: OrbSummary[] = [
  { id: "orb-1", name: "SCF Demo Orb", location: "Mexico City", status: "active", claims: 89, uniqueWallets: 67, volumeGenerated: 4200, roi: 8.4 },
  { id: "orb-2", name: "Mercado Roma", location: "CDMX", status: "active", claims: 54, uniqueWallets: 41, volumeGenerated: 2800, roi: 5.6 },
  { id: "orb-3", name: "Campus Beta", location: "Guadalajara", status: "deployed", claims: 32, uniqueWallets: 28, volumeGenerated: 1100, roi: 2.2 },
];

export const mockOrbDetail = (id: string): OrbDetail | null => {
  const base = mockOrbs.find((o) => o.id === id);
  if (!base) return null;
  return {
    ...base,
    createdDate: "2025-11-14",
    nfcIdentifier: `NFC-${id.toUpperCase()}`,
    repeatWallets: Math.round(base.uniqueWallets * 0.34),
    transactionsGenerated: Math.round(base.volumeGenerated / 7.5),
    revenueGenerated: base.volumeGenerated * 0.02,
    costPerWallet: 50 / Math.max(base.uniqueWallets, 1),
  };
};

export const mockMerchants: MerchantSummary[] = [
  { id: "m-1", name: "Café Aurora", location: "Roma Norte", category: "Food & Beverage", transactions: 412, volume: 3200, merchantScore: 92 },
  { id: "m-2", name: "Tienda Verde", location: "Condesa", category: "Retail", transactions: 287, volume: 2100, merchantScore: 78 },
  { id: "m-3", name: "Studio MX", location: "Polanco", category: "Services", transactions: 156, volume: 980, merchantScore: 65 },
];

export const mockMerchantDetail = (id: string): MerchantDetail | null => {
  const base = mockMerchants.find((m) => m.id === id);
  if (!base) return null;
  return {
    ...base,
    joinDate: "2025-10-02",
    uniqueCustomers: Math.round(base.transactions * 0.6),
    repeatCustomers: Math.round(base.transactions * 0.22),
    averageTicket: base.volume / Math.max(base.transactions, 1),
    referralsGenerated: Math.round(base.transactions * 0.08),
  };
};

export const mockUsers: UserSummary[] = [
  { id: "u-1", sozuTag: "@maria.beta", createdAt: "2025-12-01", transactions: 14, volume: 108, referralSource: "Orb" },
  { id: "u-2", sozuTag: "@carlos.mx", createdAt: "2025-12-03", transactions: 8, volume: 62, referralSource: "Referral" },
  { id: "u-3", sozuTag: "@ana.demo", createdAt: "2025-12-05", transactions: 22, volume: 184, referralSource: "Merchant QR" },
];

export const mockUserDetail = (id: string): UserDetail | null => {
  const base = mockUsers.find((u) => u.id === id);
  if (!base) return null;
  return {
    ...base,
    orbSource: "SCF Demo Orb",
    rewardsClaimed: 3,
    referrals: 2,
    creditScore: 720,
    activity: [
      { id: "a1", action: "Payment sent", timestamp: "2026-06-12T14:22:00Z", detail: "$12.50 → Café Aurora" },
      { id: "a2", action: "Referral sent", timestamp: "2026-06-11T09:10:00Z" },
      { id: "a3", action: "Wallet created", timestamp: base.createdAt },
    ],
  };
};

export const mockTransactions: NetworkTransaction[] = [
  { id: "tx-1", time: "2026-06-13T10:42:00Z", sender: "@maria.beta", receiver: "Café Aurora", asset: "USDC", amount: 12.5, memo: "coffee", hash: "abc123…", status: "success", network: "testnet" },
  { id: "tx-2", time: "2026-06-13T10:38:00Z", sender: "@carlos.mx", receiver: "Tienda Verde", asset: "USDC", amount: 28.0, memo: "", hash: "def456…", status: "success", network: "testnet" },
  { id: "tx-3", time: "2026-06-13T10:35:00Z", sender: "Orb Claim", receiver: "@ana.demo", asset: "USDC", amount: 5.0, memo: "orb-reward", hash: "ghi789…", status: "success", network: "testnet" },
];

export const mockSettlements: SettlementQueues = {
  onRamp: { pending: 4, approved: 2, rejected: 1, completed: 38 },
  offRamp: { pending: 3, approved: 1, rejected: 0, completed: 22 },
  liquidity: {
    clpAvailable: 4_200_000,
    usdcAvailable: 12_400,
    pendingLiabilities: 3_200,
    pendingReceivables: 1_800,
    projectedRunwayDays: 47,
  },
};

export const mockReferrals: ReferralMetrics = {
  referralRate: 26.0,
  costPerReferral: 1.85,
  referralConversion: 38.5,
  referralRevenue: 1240,
  topReferrers: [
    { id: "u-3", label: "@ana.demo", count: 12, type: "user" },
    { id: "m-1", label: "Café Aurora", count: 9, type: "merchant" },
    { id: "orb-1", label: "SCF Demo Orb", count: 18, type: "orb" },
  ],
};

export const mockCredit: CreditMetrics = {
  loansIssued: 0,
  outstandingPrincipal: 0,
  repaymentRate: 0,
  defaultRate: 0,
  yieldGenerated: 0,
};

export const mockInvestorSnapshot: InvestorSnapshot = {
  wallets: 317,
  merchants: 12,
  transactions: 1842,
  weekOneRetention: 34,
  referralRate: 26,
  volume: 14300,
  orbActivity: 8,
  liveTransactions: mockTransactions,
};

export const mockNetworkMap: NetworkMapData = {
  nodes: [
    { id: "orb-1", type: "orb", label: "SCF Demo Orb", activity: 89 },
    { id: "m-1", type: "merchant", label: "Café Aurora", activity: 412 },
    { id: "u-1", type: "user", label: "@maria.beta", activity: 14 },
    { id: "u-2", type: "user", label: "@carlos.mx", activity: 8 },
    { id: "orb-2", type: "orb", label: "Mercado Roma", activity: 54 },
    { id: "m-2", type: "merchant", label: "Tienda Verde", activity: 287 },
  ],
  edges: [
    { source: "orb-1", target: "u-1", type: "claim", weight: 3 },
    { source: "u-1", target: "m-1", type: "payment", weight: 8 },
    { source: "u-1", target: "u-2", type: "referral", weight: 1 },
    { source: "orb-2", target: "u-2", type: "claim", weight: 2 },
    { source: "u-2", target: "m-2", type: "payment", weight: 5 },
  ],
};
