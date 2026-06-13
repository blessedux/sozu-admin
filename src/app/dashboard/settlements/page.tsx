import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel } from "@/components/admin/ui";
import { formatCompactUsd, formatNumber } from "@/lib/format";
import { mockSettlements } from "@/lib/network/mock-data";

function QueuePanel({
  title,
  queue,
}: {
  title: string;
  queue: Record<string, number>;
}) {
  return (
    <Panel>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(queue).map(([status, count]) => (
          <MetricCard key={status} label={status} value={formatNumber(count)} />
        ))}
      </div>
    </Panel>
  );
}

export default function SettlementsPage() {
  const { onRamp, offRamp, liquidity } = mockSettlements;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settlement Center"
        description="Treasury dashboard — on/off-ramp queues and liquidity position"
      />
      <QueuePanel title="On-Ramp Queue" queue={onRamp} />
      <QueuePanel title="Off-Ramp Queue" queue={offRamp} />
      <MetricGroup title="Liquidity Position">
        <MetricCard label="CLP Available" value={formatCompactUsd(liquidity.clpAvailable)} />
        <MetricCard label="USDC Available" value={formatCompactUsd(liquidity.usdcAvailable)} />
        <MetricCard
          label="Pending Liabilities"
          value={formatCompactUsd(liquidity.pendingLiabilities)}
        />
        <MetricCard
          label="Pending Receivables"
          value={formatCompactUsd(liquidity.pendingReceivables)}
        />
        <MetricCard
          label="Projected Runway"
          value={`${liquidity.projectedRunwayDays} days`}
        />
      </MetricGroup>
    </div>
  );
}
