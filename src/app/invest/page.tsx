import { MetricCard, MetricGroup } from "@/components/admin/metric-card";
import { DataTable, PageHeader } from "@/components/admin/ui";
import { formatCompactUsd, formatNumber, formatPercent } from "@/lib/format";
import { mockInvestorSnapshot, mockTransactions } from "@/lib/network/mock-data";

export default function InvestPage() {
  const data = mockInvestorSnapshot;

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-sozu-border px-4 py-6 text-center">
        <img
          src="/sozucapital_logo_transparent.png"
          alt="Sozu Capital"
          className="mx-auto h-8 w-auto"
        />
        <h1 className="mt-4 text-xl font-bold text-white">Sozu Network — Live Proof</h1>
        <p className="mt-1 text-sm text-gray-400">
          Read-only investor view · No PII · invest.sozu.capital
        </p>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
        <MetricGroup title="Network at a Glance">
          <MetricCard label="Wallets" value={formatNumber(data.wallets)} />
          <MetricCard label="Merchants" value={formatNumber(data.merchants)} />
          <MetricCard label="Transactions" value={formatNumber(data.transactions)} />
          <MetricCard label="Volume" value={formatCompactUsd(data.volume)} />
          <MetricCard label="Week-1 Retention" value={formatPercent(data.weekOneRetention)} />
          <MetricCard label="Referral Rate" value={formatPercent(data.referralRate)} />
          <MetricCard label="Active Orbs" value={formatNumber(data.orbActivity)} />
        </MetricGroup>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
            Live Transactions
          </h2>
          <DataTable
            columns={["Time", "From", "To", "Amount", "Asset"]}
            rows={(data.liveTransactions.length ? data.liveTransactions : mockTransactions).map(
              (tx) => [
                new Date(tx.time).toLocaleTimeString(),
                tx.sender,
                tx.receiver,
                formatCompactUsd(tx.amount),
                tx.asset,
              ]
            )}
          />
        </div>
      </main>
    </div>
  );
}
