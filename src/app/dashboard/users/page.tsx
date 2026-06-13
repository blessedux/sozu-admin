import Link from "next/link";
import { DataTable, PageHeader } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";
import { getUsers } from "@/lib/network/queries";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <PageHeader
        title="User Intelligence"
        description="Beta only — wallet profiles and activity (will become private post-launch)"
      />
      <DataTable
        columns={["Sozu Tag", "Created", "Source", "Transactions", "Volume", ""]}
        rows={users.map((u) => [
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
