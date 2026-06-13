import { notFound } from "next/navigation";
import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { DataTable, PageHeader, Panel } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";
import { mockUserDetail } from "@/lib/network/mock-data";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = mockUserDetail(id);
  if (!user) notFound();

  return (
    <div className="space-y-8">
      <PageHeader title={user.sozuTag} description={`Created ${user.createdAt}`} />
      <Panel>
        <p className="text-sm text-gray-400">
          Referral: {user.referralSource} · Orb: {user.orbSource}
        </p>
      </Panel>
      <MetricGroup title="Metrics">
        <MetricCard label="Transactions" value={String(user.transactions)} />
        <MetricCard label="Volume" value={formatCompactUsd(user.volume)} />
        <MetricCard label="Rewards Claimed" value={String(user.rewardsClaimed)} />
        <MetricCard label="Referrals" value={String(user.referrals)} />
        <MetricCard label="Credit Score" value={String(user.creditScore)} />
      </MetricGroup>
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
          Activity Feed
        </h2>
        <DataTable
          columns={["Time", "Action", "Detail"]}
          rows={user.activity.map((a) => [
            new Date(a.timestamp).toLocaleString(),
            a.action,
            a.detail ?? "—",
          ])}
        />
      </div>
    </div>
  );
}
