import { NextResponse } from "next/server";
import { getInvestorSnapshot } from "@/lib/network/queries";

/** Public read-only snapshot for investor mode — no PII. */
export async function GET() {
  const snapshot = await getInvestorSnapshot();
  const { liveTransactions, ...publicSnapshot } = snapshot;

  return NextResponse.json({
    ...publicSnapshot,
    liveTransactions: liveTransactions.map((tx) => ({
      time: tx.time,
      amount: tx.amount,
      asset: tx.asset,
      status: tx.status,
    })),
  });
}
