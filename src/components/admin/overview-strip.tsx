import { formatCompactUsd, formatNumber, formatUsd } from "@/lib/format";
import type { OverviewSnapshot } from "@/lib/network/types";
import { cn } from "@/lib/utils";

function MiniMetric({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        highlight
          ? "border-sozu-cyan/40 bg-sozu-cyan/5"
          : "border-sozu-border bg-sozu-panel/60"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-1 font-bold tabular-nums text-white",
          highlight ? "text-2xl text-sozu-cyan" : "text-lg"
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p> : null}
    </div>
  );
}

export function OverviewStrip({ snapshot }: { snapshot: OverviewSnapshot }) {
  const updatedAt = new Date(snapshot.tvl.asOf).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <section className="rounded-xl border border-sozu-border bg-sozu-panel/40 p-4 backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sozu-cyan">
            Network Snapshot
          </p>
          <p className="text-sm text-gray-400">Headline metrics · live from Supabase + Stellar</p>
        </div>
        <p className="text-xs text-gray-500">TVL as of {updatedAt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <MiniMetric
          label="TVL"
          value={formatCompactUsd(snapshot.tvl.totalUsd)}
          sub={`${formatNumber(snapshot.tvl.accountsWithBalance)} / ${formatNumber(snapshot.tvl.accountCount)} accounts`}
          highlight
        />
        <MiniMetric label="Wallets" value={formatNumber(snapshot.wallets)} />
        <MiniMetric label="Active 24h" value={formatNumber(snapshot.activeWallets24h)} />
        <MiniMetric label="Merchants" value={formatNumber(snapshot.merchants)} />
        <MiniMetric label="Volume (30d)" value={formatCompactUsd(snapshot.volumeMonth)} />
        <MiniMetric label="Payments" value={formatNumber(snapshot.payments)} />
        <MiniMetric label="Active Orbs" value={formatNumber(snapshot.activeOrbs)} />
      </div>

      <p className="mt-3 text-[11px] text-gray-600">
        TVL = USDC held in {formatNumber(snapshot.tvl.accountCount)} smart accounts (
        {formatUsd(snapshot.tvl.totalUsd)} exact) queried via Soroban RPC.
      </p>
    </section>
  );
}
