import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { encodeFunctionData, type Address, type Hex } from "viem";
import type { Eip1193Provider } from "@safe-global/protocol-kit";
import { policyRegistryAbi } from "../contracts/abi";
import { policyRegistryAddress } from "../contracts/addresses";
import { SAFE_TX_SERVICE_API_KEY } from "../env";
import { SEPOLIA_CHAIN_ID } from "../chains";

export interface PolicyActionInput {
  actionId: Hex;
  target: Address;
  selector: Hex;
  params: Hex;
  nativeValue: bigint;
  earliestExecution: bigint;
  expiry: bigint;
}

export interface ProposePolicyParams {
  provider: Eip1193Provider;
  signerAddress: Address;
  safeAddress: Address;
  policyId: Hex;
  version: bigint;
  destinationChainId: bigint;
  executor: Address;
  activation: bigint;
  expiry: bigint;
  actions: PolicyActionInput[];
}

export interface ProposePolicyResult {
  safeTxHash: string;
  safeTransactionData: unknown;
}

export async function proposePolicyToSafe(params: ProposePolicyParams): Promise<ProposePolicyResult> {
  if (!policyRegistryAddress) {
    throw new Error(
      "PolicyRegistry address is not configured. Set NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS once contracts/deployments.json is published.",
    );
  }

  const data = encodeFunctionData({
    abi: policyRegistryAbi,
    functionName: "registerPolicy",
    args: [
      params.policyId,
      params.version,
      params.destinationChainId,
      params.executor,
      params.activation,
      params.expiry,
      params.actions,
    ],
  });

  const safe = await Safe.init({
    provider: params.provider,
    signer: params.signerAddress,
    safeAddress: params.safeAddress,
  });

  const safeTransaction = await safe.createTransaction({
    transactions: [
      {
        to: policyRegistryAddress,
        value: "0",
        data,
      },
    ],
  });

  const safeTxHash = await safe.getTransactionHash(safeTransaction);
  const signature = await safe.signHash(safeTxHash);

  const apiKit = new SafeApiKit({
    chainId: BigInt(SEPOLIA_CHAIN_ID),
    apiKey: SAFE_TX_SERVICE_API_KEY || undefined,
  });

  await apiKit.proposeTransaction({
    safeAddress: params.safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: params.signerAddress,
    senderSignature: signature.data,
  });

  return { safeTxHash, safeTransactionData: safeTransaction.data };
}

export function createSafeApiKit(): SafeApiKit {
  return new SafeApiKit({
    chainId: BigInt(SEPOLIA_CHAIN_ID),
    apiKey: SAFE_TX_SERVICE_API_KEY || undefined,
  });
}
