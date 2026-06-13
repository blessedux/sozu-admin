import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { OverviewStrip } from "@/components/admin/overview-strip";
import { formatCompactUsd, formatNumber, formatPercent, formatUsd } from "@/lib/format";
import type { HeroMetrics, OverviewSnapshot } from "@/lib/network/types";

export function HeroMetricsGrid({
  data,
  snapshot,
}: {
  data: HeroMetrics;
  snapshot: OverviewSnapshot;
}) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Is Sozu growing?</h1>
        <p className="mt-1 text-sm text-gray-400">
          Real-time operational view of the Sozu Network
        </p>
      </div>

      <OverviewStrip snapshot={snapshot} />

      <MetricGroup title="Wallets Created">
        <MetricCard label="Today" value={formatNumber(data.walletsCreated.today)} />
        <MetricCard label="This Week" value={formatNumber(data.walletsCreated.thisWeek)} />
        <MetricCard label="Total" value={formatNumber(data.walletsCreated.total)} />
        <MetricCard
          label="Growth"
          value={formatPercent(data.walletsCreated.growthPercent)}
          growth={data.walletsCreated.growthPercent}
        />
      </MetricGroup>

      <MetricGroup title="Active Wallets">
        <MetricCard label="24h" value={formatNumber(data.activeWallets.h24)} />
        <MetricCard label="7d" value={formatNumber(data.activeWallets.d7)} />
        <MetricCard label="30d" value={formatNumber(data.activeWallets.d30)} />
        <MetricCard
          label="Retention"
          value={formatPercent(data.activeWallets.retentionPercent)}
        />
      </MetricGroup>

      <MetricGroup title="Active Merchants">
        <MetricCard label="Total" value={formatNumber(data.activeMerchants.total)} />
        <MetricCard
          label="New This Week"
          value={formatNumber(data.activeMerchants.newThisWeek)}
        />
        <MetricCard
          label="Tx / Merchant"
          value={data.activeMerchants.transactionsPerMerchant.toFixed(1)}
        />
        <MetricCard label="—" value="—" />
      </MetricGroup>

      <MetricGroup title="Transaction Volume">
        <MetricCard label="Today" value={formatCompactUsd(data.transactionVolume.today)} />
        <MetricCard label="Week" value={formatCompactUsd(data.transactionVolume.week)} />
        <MetricCard label="Month" value={formatCompactUsd(data.transactionVolume.month)} />
        <MetricCard
          label="Lifetime"
          value={formatCompactUsd(data.transactionVolume.lifetime)}
        />
      </MetricGroup>

      <MetricGroup title="Payments">
        <MetricCard label="Count" value={formatNumber(data.payments.count)} />
        <MetricCard label="Avg Ticket" value={formatUsd(data.payments.averageTicket)} />
        <MetricCard label="Largest" value={formatUsd(data.payments.largestPayment)} />
        <MetricCard label="—" value="—" />
      </MetricGroup>

      <MetricGroup title="Orbs">
        <MetricCard label="Active" value={formatNumber(data.orbs.active)} />
        <MetricCard label="Claims Today" value={formatNumber(data.orbs.claimsToday)} />
        <MetricCard label="Wallets Created" value={formatNumber(data.orbs.walletsCreated)} />
        <MetricCard label="Conversion" value={formatPercent(data.orbs.conversionPercent)} />
      </MetricGroup>
    </div>
  );
}
