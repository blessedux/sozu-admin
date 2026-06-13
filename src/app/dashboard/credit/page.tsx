import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel } from "@/components/admin/ui";
import { formatCompactUsd, formatPercent } from "@/lib/format";
import { getCreditMetrics } from "@/lib/network/queries";

export default async function CreditPage() {
  const data = await getCreditMetrics();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Credit Analytics"
        description="Live metrics from SozuCredit — loans, repayments, and yield"
      />
      {data.loansIssued === 0 ? (
        <Panel>
          <p className="text-sm text-gray-400">
            No active loans yet. Metrics will populate automatically when credit agreements are issued.
          </p>
        </Panel>
      ) : null}
      <MetricGroup title="Credit Network">
        <MetricCard label="Loans Issued" value={String(data.loansIssued)} />
        <MetricCard
          label="Outstanding Principal"
          value={formatCompactUsd(data.outstandingPrincipal)}
        />
        <MetricCard label="Repayment Rate" value={formatPercent(data.repaymentRate)} />
        <MetricCard label="Default Rate" value={formatPercent(data.defaultRate)} />
        <MetricCard label="Yield Generated" value={formatCompactUsd(data.yieldGenerated)} />
      </MetricGroup>
    </div>
  );
}
