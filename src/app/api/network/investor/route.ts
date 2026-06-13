import { NextResponse } from "next/server";
import { mockInvestorSnapshot } from "@/lib/network/mock-data";

/** Public read-only snapshot for investor mode — no PII. */
export async function GET() {
  const { liveTransactions, ...publicSnapshot } = mockInvestorSnapshot;
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
