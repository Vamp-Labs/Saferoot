import type { Address } from "viem";
import { CC3_CHAIN_ID, SEPOLIA_CHAIN_ID } from "../chains";
import { CC3_RPC_URL } from "../env";

const ZERO_ADDRESS: Address = "0x00000000000000000000000000000000000000";

function envAddress(value: string | undefined): Address | null {
  if (!value) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) return null;
  return value as Address;
}

export const policyRegistryAddress = envAddress(process.env.NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS);
export const authoritySafeAddress = envAddress(process.env.NEXT_PUBLIC_AUTHORITY_SAFE_ADDRESS);
export const executorAddress = envAddress(process.env.NEXT_PUBLIC_EXECUTOR_ADDRESS);
export const mockUsdcAddress = envAddress(process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS);
export const lendingPoolAddress = envAddress(process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS);
export const guardianAddress = envAddress(process.env.NEXT_PUBLIC_GUARDIAN_ADDRESS);

export const deployments = {
  ethereumSepolia: {
    chainId: SEPOLIA_CHAIN_ID,
    policyRegistry: policyRegistryAddress ?? ZERO_ADDRESS,
    authoritySafe: authoritySafeAddress ?? ZERO_ADDRESS,
  },
  creditcoinCc3: {
    chainId: CC3_CHAIN_ID,
    rpcUrl: CC3_RPC_URL,
    safeRootPolicyExecutor: executorAddress ?? ZERO_ADDRESS,
    mockUsdc: mockUsdcAddress ?? ZERO_ADDRESS,
    lendingPoolMock: lendingPoolAddress ?? ZERO_ADDRESS,
    guardian: guardianAddress ?? ZERO_ADDRESS,
  },
};

export const deploymentsArePlaceholder = executorAddress === null || policyRegistryAddress === null;
