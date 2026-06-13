import Link from "next/link";
import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel } from "@/components/admin/ui";
import { isWithdrawalRequestsTableAvailable } from "@/lib/db/withdrawal-requests";
import { formatCompactUsd, formatNumber } from "@/lib/format";
import { getSettlementQueues } from "@/lib/network/queries";

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

export default async function SettlementsPage() {
  const [{ onRamp, offRamp, liquidity }, offRampTableReady] = await Promise.all([
    getSettlementQueues(),
    isWithdrawalRequestsTableAvailable(),
  ]);

  const onRampPending = onRamp.pending;
  const offRampPending = offRamp.pending + offRamp.approved;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settlement Center"
        description="Treasury ops — on/off-ramp queues from SozuPay cashout and wallet deposits"
      />

      {!offRampTableReady && (
        <Panel className="border-amber-500/30 bg-amber-500/5">
          <p className="text-sm font-medium text-amber-100">Off-ramp table not deployed yet</p>
          <p className="mt-2 text-sm text-amber-200/80">
            SozuPay cashout writes to{" "}
            <code className="rounded bg-black/30 px-1">withdrawal_requests</code>. Run the migration
            in your shared Supabase SQL editor:
          </p>
          <p className="mt-2 font-mono text-xs text-amber-100/70">
            supabase/migrations/20250613000000_withdrawal_requests_ramp.sql
          </p>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <QueuePanel title="On-Ramp Queue" queue={onRamp} />
          <Link
            href="/dashboard/settlements/on-ramp"
            className="inline-flex text-sm font-medium text-sozu-cyan hover:underline"
          >
            {onRampPending > 0
              ? `View ${onRampPending} open on-ramp request${onRampPending === 1 ? "" : "s"} →`
              : "Open on-ramp queue →"}
          </Link>
        </div>

        <div className="space-y-3">
          <QueuePanel title="Off-Ramp Queue (SozuPay cashout)" queue={offRamp} />
          <Link
            href="/dashboard/settlements/off-ramp"
            className="inline-flex text-sm font-medium text-sozu-cyan hover:underline"
          >
            {offRampPending > 0
              ? `View ${offRampPending} merchant withdrawal${offRampPending === 1 ? "" : "s"} →`
              : "Open off-ramp queue →"}
          </Link>
        </div>
      </div>

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
