export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export const SAFE_TX_SERVICE_API_KEY = process.env.NEXT_PUBLIC_SAFE_TX_SERVICE_API_KEY ?? "";

export const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const CC3_RPC_URL =
  process.env.NEXT_PUBLIC_CC3_RPC_URL ?? "https://rpc.cc3-testnet.creditcoin.network";

export const hasLiveApi = API_BASE_URL.length > 0;
