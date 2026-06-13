import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel } from "@/components/admin/ui";
import { formatCompactUsd, formatPercent } from "@/lib/format";
import { mockCredit } from "@/lib/network/mock-data";

export default function CreditPage() {
  const data = mockCredit;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Credit Analytics"
        description="Future-proof architecture for credit.sozu.capital — ready when lending goes live"
      />
      <Panel>
        <p className="text-sm text-gray-400">
          Lending product not live yet. Metrics will populate from SozuCredit when loans are issued.
        </p>
      </Panel>
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
