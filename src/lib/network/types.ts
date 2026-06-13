export interface HeroMetrics {
  walletsCreated: {
    today: number;
    thisWeek: number;
    total: number;
    growthPercent: number;
  };
  activeWallets: {
    h24: number;
    d7: number;
    d30: number;
    retentionPercent: number;
  };
  activeMerchants: {
    total: number;
    newThisWeek: number;
    transactionsPerMerchant: number;
  };
  transactionVolume: {
    today: number;
    week: number;
    month: number;
    lifetime: number;
  };
  payments: {
    count: number;
    averageTicket: number;
    largestPayment: number;
  };
  orbs: {
    active: number;
    claimsToday: number;
    walletsCreated: number;
    conversionPercent: number;
  };
}

/** Live USDC locked in Sozu smart accounts (Soroban). */
export interface NetworkTvl {
  totalUsd: number;
  accountCount: number;
  accountsWithBalance: number;
  asOf: string;
}

/** Headline metrics for the dashboard overview strip. */
export interface OverviewSnapshot {
  tvl: NetworkTvl;
  wallets: number;
  activeWallets24h: number;
  merchants: number;
  volumeMonth: number;
  payments: number;
  activeOrbs: number;
}

export interface FunnelStep {
  id: string;
  label: string;
  count: number;
  conversionPercent: number;
  dropoffPercent: number;
}

export interface AcquisitionSource {
  source: string;
  count: number;
  percent: number;
}

export interface VelocityPoint {
  period: string;
  count: number;
}

export interface OrbSummary {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive" | "deployed";
  claims: number;
  uniqueWallets: number;
  volumeGenerated: number;
  roi: number;
}

export interface OrbDetail extends OrbSummary {
  createdDate: string;
  nfcIdentifier: string;
  repeatWallets: number;
  transactionsGenerated: number;
  revenueGenerated: number;
  costPerWallet: number;
}

export interface MerchantSummary {
  id: string;
  name: string;
  location: string;
  category: string;
  transactions: number;
  volume: number;
  merchantScore: number;
}

export interface MerchantDetail extends MerchantSummary {
  joinDate: string;
  uniqueCustomers: number;
  repeatCustomers: number;
  averageTicket: number;
  referralsGenerated: number;
}

export interface UserSummary {
  id: string;
  sozuTag: string;
  createdAt: string;
  transactions: number;
  volume: number;
  referralSource: string;
}

export interface UserDetail extends UserSummary {
  orbSource: string;
  rewardsClaimed: number;
  referrals: number;
  creditScore: number;
  activity: Array<{
    id: string;
    action: string;
    timestamp: string;
    detail?: string;
  }>;
}

export interface NetworkTransaction {
  id: string;
  time: string;
  sender: string;
  receiver: string;
  asset: string;
  amount: number;
  memo: string;
  hash: string;
  status: "success" | "pending" | "failed";
  network: string;
}

export interface SettlementQueues {
  onRamp: Record<"pending" | "approved" | "rejected" | "completed", number>;
  offRamp: Record<"pending" | "approved" | "rejected" | "completed", number>;
  liquidity: {
    clpAvailable: number;
    usdcAvailable: number;
    pendingLiabilities: number;
    pendingReceivables: number;
    projectedRunwayDays: number;
  };
}

export interface ReferralMetrics {
  referralRate: number;
  costPerReferral: number;
  referralConversion: number;
  referralRevenue: number;
  topReferrers: Array<{ id: string; label: string; count: number; type: "user" | "merchant" | "orb" }>;
}

export interface CreditMetrics {
  loansIssued: number;
  outstandingPrincipal: number;
  repaymentRate: number;
  defaultRate: number;
  yieldGenerated: number;
}

export interface InvestorSnapshot {
  wallets: number;
  merchants: number;
  transactions: number;
  weekOneRetention: number;
  referralRate: number;
  volume: number;
  orbActivity: number;
  liveTransactions: NetworkTransaction[];
}

export interface NetworkNode {
  id: string;
  type: "user" | "merchant" | "orb";
  label: string;
  activity: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: "payment" | "referral" | "claim";
  weight: number;
}

export interface NetworkMapData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}
