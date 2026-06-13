"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";

type WithdrawalRow = {
  id: string;
  orgId: string;
  orgName: string;
  amountUsd: string;
  sourceStellarAddress: string;
  bankAccountHolder: string;
  bankCountry: string;
  bankAccountNumber: string;
  bankRoutingCode: string | null;
  bankCurrency: string | null;
  status: string;
  fiatSentAt: string | null;
  releaseTxHash: string | null;
  createdAt: string;
};

const SOZUPAY_URL = process.env.NEXT_PUBLIC_SOZUPAY_URL ?? "http://localhost:3000";

function WithdrawalCard({
  w,
  children,
}: {
  w: WithdrawalRow;
  children?: React.ReactNode;
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-semibold text-white">
              ${w.amountUsd} USDC → {w.bankCurrency ?? "CLP"}
            </p>
            <StatusBadge status={w.status} />
          </div>
          <p className="mt-2 text-sm text-gray-300">
            {w.orgName} <span className="text-gray-500">({w.orgId.slice(0, 8)}…)</span>
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {w.bankAccountHolder} · {w.bankCountry}
          </p>
          <p className="font-mono text-sm text-gray-500">
            {w.bankAccountNumber}
            {w.bankRoutingCode ? ` · ${w.bankRoutingCode}` : ""}
          </p>
          <p className="mt-2 text-xs text-gray-600">
            Source: {w.sourceStellarAddress.slice(0, 12)}… ·{" "}
            {new Date(w.createdAt).toLocaleString()} · {w.id}
          </p>
          {w.fiatSentAt && (
            <p className="mt-1 text-xs text-emerald-500/80">
              CLP sent {new Date(w.fiatSentAt).toLocaleString()}
            </p>
          )}
          {w.releaseTxHash && (
            <p className="mt-1 font-mono text-xs text-sozu-cyan">Tx: {w.releaseTxHash.slice(0, 16)}…</p>
          )}
        </div>
        {children}
      </div>
    </Panel>
  );
}

export default function OffRampQueuePage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [awaitingRelease, setAwaitingRelease] = useState<WithdrawalRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [tableReady, setTableReady] = useState(true);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/network/settlements/off-ramp");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError((data.error as string) ?? "Failed to load queue");
      return;
    }
    setTableReady(data.tableReady !== false);
    if (data.setupMessage) setSetupMessage(data.setupMessage as string);
    if (data.withdrawals) setWithdrawals(data.withdrawals);
    if (data.awaitingRelease) setAwaitingRelease(data.awaitingRelease);
    if (typeof data.pendingCount === "number") setPendingCount(data.pendingCount);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const markFiatSent = async (requestId: string) => {
    if (
      !confirm(
        "Confirm you deposited CLP to this bank account? The merchant will then release USDC from SozuPay with their passkey.",
      )
    ) {
      return;
    }
    setBusyId(requestId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/network/settlements/off-ramp/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? "Could not mark CLP sent");
        return;
      }
      setMessage("CLP marked sent. Merchant can now confirm and release USDC in SozuPay.");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (requestId: string) => {
    if (!confirm("Reject this withdrawal request?")) return;
    setBusyId(requestId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/network/settlements/off-ramp/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) ?? "Could not reject withdrawal");
        return;
      }
      setMessage("Withdrawal rejected.");
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Merchant off-ramp queue"
          description="Step 1: deposit CLP to merchant bank. Step 2: merchant confirms in SozuPay and signs to release USDC."
          className="mb-0"
        />
        <Link href="/dashboard/settlements" className="text-sm text-sozu-cyan hover:underline">
          ← Settlement center
        </Link>
      </div>

      {!tableReady && setupMessage && (
        <Panel className="border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-100">{setupMessage}</p>
        </Panel>
      )}

      {tableReady && pendingCount > 0 && (
        <Panel className="border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-200">
            {pendingCount} withdrawal{pendingCount === 1 ? "" : "s"} waiting for CLP deposit.
          </p>
        </Panel>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading queue…</p>
      ) : !tableReady ? null : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
              Step 1 — Send CLP to bank
            </h2>
            {withdrawals.length === 0 ? (
              <Panel>
                <p className="text-sm text-gray-400">No withdrawals awaiting CLP deposit.</p>
              </Panel>
            ) : (
              withdrawals.map((w) => (
                <WithdrawalCard key={w.id} w={w}>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => markFiatSent(w.id)}
                      className="rounded-lg bg-sozu-cyan/90 px-4 py-2 text-sm font-medium text-black hover:bg-sozu-cyan disabled:opacity-50"
                    >
                      {busyId === w.id ? "Saving…" : "CLP deposited — notify merchant"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === w.id}
                      onClick={() => reject(w.id)}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </WithdrawalCard>
              ))
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-sozu-cyan">
              Step 2 — Awaiting merchant USDC release
            </h2>
            {awaitingRelease.length === 0 ? (
              <Panel>
                <p className="text-sm text-gray-400">
                  After you mark CLP sent, the merchant releases USDC from{" "}
                  <a href={`${SOZUPAY_URL}/dashboard/cashout`} className="text-sozu-cyan hover:underline">
                    SozuPay cashout
                  </a>
                  .
                </p>
              </Panel>
            ) : (
              awaitingRelease.map((w) => (
                <WithdrawalCard key={w.id} w={w}>
                  <div className="shrink-0 text-right text-sm text-gray-400">
                    <p>Waiting for merchant passkey</p>
                    <a
                      href={`${SOZUPAY_URL}/dashboard/cashout`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sozu-cyan hover:underline"
                    >
                      Open SozuPay ↗
                    </a>
                  </div>
                </WithdrawalCard>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
