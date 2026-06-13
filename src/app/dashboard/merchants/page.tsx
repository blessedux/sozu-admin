import Link from "next/link";
import { DataTable, PageHeader } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";
import { getMerchants } from "@/lib/network/queries";

export default async function MerchantsPage() {
  const merchants = await getMerchants();

  return (
    <div>
      <PageHeader
        title="Merchant Intelligence"
        description="Power users ranked by volume, retention, and referrals"
      />
      <DataTable
        columns={["Merchant", "Location", "Category", "Transactions", "Volume", "Score", ""]}
        rows={merchants.map((m) => [
          m.name,
          m.location,
          m.category,
          m.transactions,
          formatCompactUsd(m.volume),
          m.merchantScore,
          <Link key={m.id} href={`/dashboard/merchants/${m.id}`} className="text-sozu-cyan hover:underline">
            View
          </Link>,
        ])}
      />
    </div>
  );
}
