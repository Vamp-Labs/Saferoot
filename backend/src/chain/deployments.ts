import fs from "node:fs";
import path from "node:path";
import { env } from "../env";
import { childLogger } from "../logger";
import { POLICY_REGISTRY_FALLBACK_ABI, SAFE_ROOT_POLICY_EXECUTOR_FALLBACK_ABI } from "./fallbackAbi";

const log = childLogger("deployments");

export interface EthereumSepoliaDeployment {
  chainId: number;
  policyRegistry: string;
  authoritySafe: string;
}

export interface CreditcoinCc3Deployment {
  chainId: number;
  rpcUrl: string;
  safeRootPolicyExecutor: string;
  mockUsdc: string;
  lendingPoolMock: string;
  guardian: string;
}

export interface DeploymentsConfig {
  ethereumSepolia: EthereumSepoliaDeployment;
  creditcoinCc3: CreditcoinCc3Deployment;
}

export interface ResolvedContractSetup {
  deployments: DeploymentsConfig;
  policyRegistryAbi: ReadonlyArray<string>;
  safeRootPolicyExecutorAbi: ReadonlyArray<string>;
  source: "published" | "fixture";
}

const FIXTURE_DEPLOYMENTS: DeploymentsConfig = {
  ethereumSepolia: {
    chainId: 11155111,
    policyRegistry: "0x0000000000000000000000000000000000000001",
    authoritySafe: "0x0000000000000000000000000000000000000002",
  },
  creditcoinCc3: {
    chainId: 102031,
    rpcUrl: "https://rpc.cc3-testnet.creditcoin.network",
    safeRootPolicyExecutor: "0x0000000000000000000000000000000000000003",
    mockUsdc: "0x0000000000000000000000000000000000000004",
    lendingPoolMock: "0x0000000000000000000000000000000000000005",
    guardian: "0x0000000000000000000000000000000000000006",
  },
};

function resolveDeploymentsPath(): string {
  if (env.DEPLOYMENTS_JSON_PATH) return env.DEPLOYMENTS_JSON_PATH;
  return path.resolve(__dirname, "..", "..", "..", "contracts", "deployments.json");
}

function resolveAbiDir(): string {
  if (env.ABI_DIR_PATH) return env.ABI_DIR_PATH;
  return path.resolve(__dirname, "..", "..", "..", "contracts", "abi");
}

function readAbiFile(dir: string, fileName: string): ReadonlyArray<string> | null {
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  const abi = Array.isArray(parsed) ? parsed : (parsed as { abi?: unknown }).abi;
  if (!Array.isArray(abi)) {
    throw new Error(`ABI file ${filePath} did not contain an array or an { abi: [] } shape`);
  }
  return abi as string[];
}

let cached: ResolvedContractSetup | null = null;

export function loadContractSetup(): ResolvedContractSetup {
  if (cached) return cached;

  const deploymentsPath = resolveDeploymentsPath();
  if (fs.existsSync(deploymentsPath)) {
    const raw = fs.readFileSync(deploymentsPath, "utf-8");
    const deployments = JSON.parse(raw) as DeploymentsConfig;
    const abiDir = resolveAbiDir();
    const policyRegistryAbi = readAbiFile(abiDir, "PolicyRegistry.json") ?? POLICY_REGISTRY_FALLBACK_ABI;
    const safeRootPolicyExecutorAbi =
      readAbiFile(abiDir, "SafeRootPolicyExecutor.json") ?? SAFE_ROOT_POLICY_EXECUTOR_FALLBACK_ABI;
    log.info({ deploymentsPath }, "Loaded published contract deployments");
    cached = { deployments, policyRegistryAbi, safeRootPolicyExecutorAbi, source: "published" };
    return cached;
  }

  log.warn(
    { expectedPath: deploymentsPath },
    "contracts/deployments.json not found yet; using placeholder fixture deployments and fallback ABI fragments. " +
      "Workers will fail to submit real transactions until Smart Contracts publishes deployments.json.",
  );
  cached = {
    deployments: FIXTURE_DEPLOYMENTS,
    policyRegistryAbi: POLICY_REGISTRY_FALLBACK_ABI,
    safeRootPolicyExecutorAbi: SAFE_ROOT_POLICY_EXECUTOR_FALLBACK_ABI,
    source: "fixture",
  };
  return cached;
}
