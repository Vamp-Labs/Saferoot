import { createConfig, http, injected } from "wagmi";
import { CC3_RPC_URL, SEPOLIA_RPC_URL } from "./env";
import { creditcoinCc3, ethereumSepolia } from "./chains";

export const wagmiConfig = createConfig({
  chains: [ethereumSepolia, creditcoinCc3],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [ethereumSepolia.id]: http(SEPOLIA_RPC_URL),
    [creditcoinCc3.id]: http(CC3_RPC_URL),
  },
  ssr: true,
});
