import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";
import { getOrbs } from "@/lib/network/queries";

export default async function OrbsPage() {
  const orbs = await getOrbs();

  return (
    <div>
      <PageHeader
        title="Orb Intelligence"
        description="ROI and performance for every physical distribution point"
      />
      <DataTable
        columns={["Name", "Location", "Status", "Claims", "Wallets", "Volume", "ROI", ""]}
        rows={orbs.map((o) => [
          o.name,
          o.location,
          <StatusBadge key={o.id} status={o.status} />,
          o.claims,
          o.uniqueWallets,
          formatCompactUsd(o.volumeGenerated),
          `${o.roi.toFixed(1)}x`,
          <Link key={`link-${o.id}`} href={`/dashboard/orbs/${o.id}`} className="text-sozu-cyan hover:underline">
            View
          </Link>,
        ])}
      />
    </div>
  );
}
