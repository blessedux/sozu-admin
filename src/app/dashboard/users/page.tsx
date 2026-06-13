import Link from "next/link";
import { DataTable, PageHeader } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";
import { mockUsers } from "@/lib/network/mock-data";

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="User Intelligence"
        description="Beta only — wallet profiles and activity (will become private post-launch)"
      />
      <DataTable
        columns={["Sozu Tag", "Created", "Source", "Transactions", "Volume", ""]}
        rows={mockUsers.map((u) => [
          u.sozuTag,
          u.createdAt,
          u.referralSource,
          u.transactions,
          formatCompactUsd(u.volume),
          <Link key={u.id} href={`/dashboard/users/${u.id}`} className="text-sozu-cyan hover:underline">
            View
          </Link>,
        ])}
      />
    </div>
  );
}
