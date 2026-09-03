import { JsonRpcProvider, Wallet } from "ethers";
import { env } from "../env";

let sepoliaProvider: JsonRpcProvider | null = null;
let creditcoinProvider: JsonRpcProvider | null = null;
let workerWallet: Wallet | null = null;

export function getSepoliaProvider(): JsonRpcProvider {
  if (!sepoliaProvider) {
    sepoliaProvider = new JsonRpcProvider(env.ETHEREUM_SEPOLIA_RPC_URL, undefined, {
      staticNetwork: true,
    });
  }
  return sepoliaProvider;
}

export function getCreditcoinProvider(): JsonRpcProvider {
  if (!creditcoinProvider) {
    creditcoinProvider = new JsonRpcProvider(env.CREDITCOIN_CC3_RPC_URL, undefined, {
      staticNetwork: true,
    });
  }
  return creditcoinProvider;
}

export function getWorkerWallet(): Wallet {
  if (!workerWallet) {
    workerWallet = new Wallet(env.WORKER_WALLET_PRIVATE_KEY, getCreditcoinProvider());
  }
  return workerWallet;
}
