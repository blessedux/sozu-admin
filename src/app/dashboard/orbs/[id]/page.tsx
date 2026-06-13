import { notFound } from "next/navigation";
import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { formatCompactUsd, formatUsd } from "@/lib/format";
import { mockOrbDetail } from "@/lib/network/mock-data";

export default async function OrbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orb = mockOrbDetail(id);
  if (!orb) notFound();

  return (
    <div className="space-y-8">
      <PageHeader title={orb.name} description={`${orb.location} · ${orb.nfcIdentifier}`} />
      <Panel>
        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
          <span>Created {orb.createdDate}</span>
          <StatusBadge status={orb.status} />
        </div>
      </Panel>

      <MetricGroup title="Metrics">
        <MetricCard label="Claims" value={String(orb.claims)} />
        <MetricCard label="Unique Wallets" value={String(orb.uniqueWallets)} />
        <MetricCard label="Repeat Wallets" value={String(orb.repeatWallets)} />
        <MetricCard label="Transactions" value={String(orb.transactionsGenerated)} />
        <MetricCard label="Volume" value={formatCompactUsd(orb.volumeGenerated)} />
        <MetricCard label="Revenue" value={formatUsd(orb.revenueGenerated)} />
        <MetricCard label="Cost / Wallet" value={formatUsd(orb.costPerWallet)} />
        <MetricCard label="ROI" value={`${orb.roi.toFixed(1)}x`} />
      </MetricGroup>
    </div>
  );
}
