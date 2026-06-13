"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { formatCompactUsd } from "@/lib/format";

type ConsumerDeposit = {
  id: string;
  userTag: string;
  method: string;
  amountClp: number;
  quotedUsdc: number;
  status: string;
  bankReference: string | null;
  destinationAddress: string;
  createdAt: string;
};

type MerchantCheckout = {
  id: string;
  orgName: string;
  amountUsd: string;
  reference: string | null;
  status: string;
  paymentMethod: string | null;
  providerUrl: string | null;
  destinationAddress: string;
  createdAt: string;
};

export default function OnRampQueuePage() {
  const [deposits, setDeposits] = useState<ConsumerDeposit[]>([]);
  const [checkouts, setCheckouts] = useState<MerchantCheckout[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/network/settlements/on-ramp");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data.error as string) ?? "Failed to load on-ramp queue");
      return;
    }
    if (data.consumerDeposits) setDeposits(data.consumerDeposits);
    if (data.merchantCheckouts) setCheckouts(data.merchantCheckouts);
    if (typeof data.pendingCount === "number") setPendingCount(data.pendingCount);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="On-ramp queue"
          description="Consumer wallet deposits and SozuPay merchant checkout sessions awaiting payment."
          className="mb-0"
        />
        <Link href="/dashboard/settlements" className="text-sm text-sozu-cyan hover:underline">
          ← Settlement center
        </Link>
      </div>

      {pendingCount > 0 && (
        <Panel className="border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-200">
            {pendingCount} open on-ramp request{pendingCount === 1 ? "" : "s"} across consumer and
            merchant rails.
          </p>
        </Panel>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading queue…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
              Merchant checkout (SozuPay)
            </h2>
            {checkouts.length === 0 ? (
              <Panel>
                <p className="text-sm text-gray-400">No pending merchant checkout sessions.</p>
              </Panel>
            ) : (
              checkouts.map((c) => (
                <Panel key={c.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-white">${c.amountUsd} USDC</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-2 text-sm text-gray-300">
                        {c.orgName}
                        {c.reference ? ` · ${c.reference}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {c.id} · {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {c.providerUrl ? (
                      <a
                        href={c.providerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-sozu-border px-4 py-2 text-sm text-sozu-cyan hover:bg-sozu-panel"
                      >
                        Open checkout ↗
                      </a>
                    ) : null}
                  </div>
                </Panel>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
              Consumer wallet deposits
            </h2>
            {deposits.length === 0 ? (
              <Panel>
                <p className="text-sm text-gray-400">No pending consumer deposit intents.</p>
              </Panel>
            ) : (
              deposits.map((d) => (
                <Panel key={d.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">
                      {d.amountClp.toLocaleString()} CLP → {formatCompactUsd(d.quotedUsdc)}
                    </p>
                    <StatusBadge status={d.status.replace(/_/g, " ")} />
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    {d.userTag} · {d.method}
                    {d.bankReference ? ` · ref ${d.bankReference}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {new Date(d.createdAt).toLocaleString()}
                  </p>
                </Panel>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
