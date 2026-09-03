import * as fs from "fs";
import * as path from "path";

const DEPLOYMENTS_PATH = path.join(__dirname, "..", "..", "deployments.json");

export type EthereumSepoliaDeployment = {
  chainId: number;
  policyRegistry: string;
  authoritySafe: string;
};

export type CreditcoinCc3Deployment = {
  chainId: number;
  rpcUrl: string;
  safeRootPolicyExecutor: string;
  attestcoinVerifierAdapter: string;
  mockUsdc: string;
  lendingPoolMock: string;
  guardian: string;
};

export type DeploymentsFile = {
  ethereumSepolia?: EthereumSepoliaDeployment;
  creditcoinCc3?: CreditcoinCc3Deployment;
};

export function readDeploymentsFile(): DeploymentsFile {
  if (!fs.existsSync(DEPLOYMENTS_PATH)) return {};
  const raw = fs.readFileSync(DEPLOYMENTS_PATH, "utf8");
  return JSON.parse(raw) as DeploymentsFile;
}

export function writeDeploymentsFile(update: DeploymentsFile): void {
  const current = readDeploymentsFile();
  const merged: DeploymentsFile = { ...current, ...update };
  fs.writeFileSync(DEPLOYMENTS_PATH, `${JSON.stringify(merged, null, 2)}\n`);
}
