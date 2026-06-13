import Link from "next/link";
import { DataTable, PageHeader, StatusBadge } from "@/components/admin/ui";
import { formatUsd } from "@/lib/format";
import { mockTransactions } from "@/lib/network/mock-data";

const EXPLORER =
  process.env.NEXT_PUBLIC_STELLAR_EXPLORER ??
  "https://stellar.expert/explorer/testnet";

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="Transaction Explorer"
        description="Every payment on the network — click hash to open Stellar Explorer"
      />
      <DataTable
        columns={[
          "Time",
          "Sender",
          "Receiver",
          "Asset",
          "Amount",
          "Memo",
          "Hash",
          "Status",
          "Network",
        ]}
        rows={mockTransactions.map((tx) => [
          new Date(tx.time).toLocaleString(),
          tx.sender,
          tx.receiver,
          tx.asset,
          formatUsd(tx.amount),
          tx.memo || "—",
          <Link
            key={tx.id}
            href={`${EXPLORER}/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sozu-cyan hover:underline"
          >
            {tx.hash}
          </Link>,
          <StatusBadge key={`st-${tx.id}`} status={tx.status} />,
          tx.network,
        ])}
      />
    </div>
  );
}
