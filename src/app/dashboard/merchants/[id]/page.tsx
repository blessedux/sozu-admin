import { notFound } from "next/navigation";
import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { PageHeader, Panel } from "@/components/admin/ui";
import { formatCompactUsd, formatUsd } from "@/lib/format";
import { getMerchantDetail } from "@/lib/network/queries";

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const merchant = await getMerchantDetail(id);
  if (!merchant) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        title={merchant.name}
        description={`${merchant.location} · ${merchant.category}`}
      />
      <Panel>
        <p className="text-sm text-gray-400">Joined {merchant.joinDate}</p>
        <p className="mt-2 text-3xl font-bold text-sozu-cyan">
          Merchant Score {merchant.merchantScore}
        </p>
      </Panel>
      <MetricGroup title="Metrics">
        <MetricCard label="Transactions" value={String(merchant.transactions)} />
        <MetricCard label="Volume" value={formatCompactUsd(merchant.volume)} />
        <MetricCard label="Unique Customers" value={String(merchant.uniqueCustomers)} />
        <MetricCard label="Repeat Customers" value={String(merchant.repeatCustomers)} />
        <MetricCard label="Avg Ticket" value={formatUsd(merchant.averageTicket)} />
        <MetricCard label="Referrals" value={String(merchant.referralsGenerated)} />
      </MetricGroup>
    </div>
  );
}
