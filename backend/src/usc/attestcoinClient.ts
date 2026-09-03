import { chainInfo, proofProvider } from "@gluwa/usc-sdk";
import { AbiCoder } from "ethers";
import { env } from "../env";
import { childLogger } from "../logger";
import { getCreditcoinProvider } from "../chain/clients";

const log = childLogger("attestcoinClient");

export type UscInclusionProof = proofProvider.ContinuityResponse;

const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

let cachedSourceChainKey: number | null = null;
let chainInfoProvider: chainInfo.PrecompileChainInfoProvider | null = null;
let proofBuilder: proofProvider.service.ProofBuilder | null = null;

function getChainInfoProvider(): chainInfo.PrecompileChainInfoProvider {
  if (!chainInfoProvider) {
    chainInfoProvider = new chainInfo.PrecompileChainInfoProvider(getCreditcoinProvider());
  }
  return chainInfoProvider;
}

export async function resolveEthereumSepoliaChainKey(): Promise<number> {
  if (cachedSourceChainKey !== null) return cachedSourceChainKey;

  const chains = await getChainInfoProvider().getSupportedChains();
  const sepolia = chains.find((chain) => chain.chainId === ETHEREUM_SEPOLIA_CHAIN_ID);
  if (!sepolia) {
    throw new Error(
      `Ethereum Sepolia (chainId ${ETHEREUM_SEPOLIA_CHAIN_ID}) is not among Creditcoin's supported USC source chains yet`,
    );
  }
  cachedSourceChainKey = sepolia.chainKey;
  log.info({ chainKey: sepolia.chainKey }, "Resolved Ethereum Sepolia USC chain key");
  return cachedSourceChainKey;
}

function getProofBuilder(chainKey: number): proofProvider.service.ProofBuilder {
  if (!proofBuilder) {
    proofBuilder = new proofProvider.service.ProofBuilder(
      chainKey,
      env.ATTESTCOIN_PROOF_BUILDER_URL,
      env.ATTESTCOIN_PROOF_TIMEOUT_MS,
    );
  }
  return proofBuilder;
}

export interface FetchProofResult {
  ready: boolean;
  proof: UscInclusionProof | null;
  error: string | null;
}

export async function fetchInclusionProof(ethereumTxHash: string): Promise<FetchProofResult> {
  const chainKey = await resolveEthereumSepoliaChainKey();
  const result = await getProofBuilder(chainKey).getProof(ethereumTxHash);
  if (!result.success || !result.data) {
    return { ready: false, proof: null, error: result.error ?? "Proof not yet available" };
  }
  return { ready: true, proof: result.data, error: null };
}

const USC_PROOF_ENCODING = [
  "tuple(uint64 chainKey, uint64 blockHeight, bytes encodedTransaction, bytes32 merkleRoot, tuple(bytes32 hash, bool isLeft)[] siblings, bytes32 lowerEndpointDigest, bytes32[] continuityRoots)",
];

export function encodeUscProof(proof: UscInclusionProof): string {
  const abiCoder = AbiCoder.defaultAbiCoder();
  return abiCoder.encode(USC_PROOF_ENCODING, [
    [
      proof.chainKey,
      proof.headerNumber,
      proof.txBytes,
      proof.merkleProof.root,
      proof.merkleProof.siblings.map((s) => [s.hash, s.isLeft]),
      proof.continuityProof.lowerEndpointDigest,
      proof.continuityProof.roots,
    ],
  ]);
}

export function computeProofRef(proof: UscInclusionProof): string {
  return `usc:${proof.chainKey}:${proof.headerNumber}:${proof.txHash}`;
}
