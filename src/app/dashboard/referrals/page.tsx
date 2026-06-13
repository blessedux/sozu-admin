import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { DataTable, PageHeader } from "@/components/admin/ui";
import { formatCompactUsd, formatPercent, formatUsd } from "@/lib/format";
import { mockReferrals } from "@/lib/network/mock-data";

export default function ReferralsPage() {
  const data = mockReferrals;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referral Intelligence"
        description="Who invited who — virality across users, merchants, and orbs"
      />
      <MetricGroup title="Network Referral Metrics">
        <MetricCard label="Referral Rate" value={formatPercent(data.referralRate)} />
        <MetricCard label="Cost / Referral" value={formatUsd(data.costPerReferral)} />
        <MetricCard label="Conversion" value={formatPercent(data.referralConversion)} />
        <MetricCard label="Revenue" value={formatCompactUsd(data.referralRevenue)} />
      </MetricGroup>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
          Top Referrers
        </h2>
        <DataTable
          columns={["Entity", "Type", "Referrals"]}
          rows={data.topReferrers.map((r) => [r.label, r.type, r.count])}
        />
      </div>
    </div>
  );
}
