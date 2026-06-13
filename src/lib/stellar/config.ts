import { Asset, Networks } from "@stellar/stellar-sdk";

export function getStellarNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK === "mainnet"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

export function getHorizonUrl(): string {
  return (
    process.env.HORIZON_URL ??
    (process.env.STELLAR_NETWORK === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org")
  );
}

export function getSorobanRpcUrl(): string {
  return (
    process.env.SOROBAN_RPC_URL ??
    (process.env.STELLAR_NETWORK === "mainnet"
      ? "https://soroban.stellar.org"
      : "https://soroban-testnet.stellar.org")
  );
}

/** Stellar USDC uses 7 decimal places. */
export const USDC_DECIMALS = 7;

export function getUsdcAsset(): Asset {
  const issuer =
    process.env.USDC_ISSUER ??
    (process.env.STELLAR_NETWORK === "mainnet"
      ? "GA5ZSEJYB37JRC5AVAAQPAEJVBDLXKXLBV5HNYG5KBXAFBOU4F52QK7S"
      : "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");

  return new Asset("USDC", issuer);
}

export function getUsdcContractId(): string {
  return getUsdcAsset().contractId(getStellarNetworkPassphrase() as typeof Networks.TESTNET);
}
