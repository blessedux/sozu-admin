import "server-only";

import {
  Account,
  Address,
  Contract,
  Keypair,
  rpc,
  scValToNative,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { NetworkTvl } from "@/lib/network/types";
import {
  getSorobanRpcUrl,
  getStellarNetworkPassphrase,
  getUsdcContractId,
  USDC_DECIMALS,
} from "@/lib/stellar/config";

const SIMULATE_SOURCE = new Account(Keypair.random().publicKey(), "0");
const BALANCE_CONCURRENCY = 10;

async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = BALANCE_CONCURRENCY
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) break;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

async function fetchSmartAccountAddresses(): Promise<string[]> {
  const sb = getSupabaseAdmin();

  const [{ data: smartAccounts }, { data: wallets }, { data: orgs }] = await Promise.all([
    sb.from("smart_accounts").select("contract_id"),
    sb.from("stellar_wallets").select("public_key").in("wallet_type", ["oz", "factory"]),
    sb.from("organizations").select("soroban_contract_id").not("soroban_contract_id", "is", null),
  ]);

  const addresses = new Set<string>();

  for (const row of smartAccounts ?? []) {
    if (row.contract_id?.startsWith("C")) addresses.add(row.contract_id);
  }

  for (const row of wallets ?? []) {
    if (row.public_key?.startsWith("C")) addresses.add(row.public_key);
  }

  for (const row of orgs ?? []) {
    if (row.soroban_contract_id?.startsWith("C")) addresses.add(row.soroban_contract_id);
  }

  return [...addresses];
}

async function fetchUsdcBalance(
  server: rpc.Server,
  contractId: string,
  accountId: string
): Promise<number> {
  try {
    const contract = new Contract(contractId);
    const tx = new TransactionBuilder(SIMULATE_SOURCE, {
      fee: "100000",
      networkPassphrase: getStellarNetworkPassphrase(),
    })
      .addOperation(contract.call("balance", Address.fromString(accountId).toScVal()))
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) return 0;

    const value = simulation.result?.retval;
    if (!value) return 0;

    return Number(scValToNative(value)) / 10 ** USDC_DECIMALS;
  } catch {
    return 0;
  }
}

/** Live USDC held across all Sozu smart accounts (Soroban C addresses). */
export async function getNetworkTvl(): Promise<NetworkTvl> {
  const addresses = await fetchSmartAccountAddresses();
  const server = new rpc.Server(getSorobanRpcUrl());
  const usdcContractId = getUsdcContractId();

  const balances = await mapConcurrent(addresses, (address) =>
    fetchUsdcBalance(server, usdcContractId, address)
  );

  const totalUsd = balances.reduce((sum, balance) => sum + balance, 0);
  const accountsWithBalance = balances.filter((balance) => balance > 0).length;

  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    accountCount: addresses.length,
    accountsWithBalance,
    asOf: new Date().toISOString(),
  };
}
