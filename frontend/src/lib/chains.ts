import { defineChain } from "viem";
import { sepolia } from "viem/chains";
import { CC3_RPC_URL } from "./env";

export const ethereumSepolia = sepolia;

export const creditcoinCc3 = defineChain({
  id: 102031,
  name: "Creditcoin CC3 Testnet",
  nativeCurrency: { name: "Creditcoin", symbol: "tCTC", decimals: 18 },
  rpcUrls: {
    default: { http: [CC3_RPC_URL] },
  },
  blockExplorers: {
    default: {
      name: "Creditcoin Blockscout",
      url: "https://creditcoin-testnet.blockscout.com",
    },
  },
  testnet: true,
});

export const SEPOLIA_CHAIN_ID = ethereumSepolia.id;
export const CC3_CHAIN_ID = creditcoinCc3.id;
