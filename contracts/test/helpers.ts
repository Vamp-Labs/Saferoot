import { ethers } from "hardhat";
import { AbiCoder, keccak256, toUtf8Bytes } from "ethers";

export const POLICY_APPROVED_SIGNATURE = keccak256(
  toUtf8Bytes("PolicyApproved(bytes32,uint256,address,uint256,address,uint256,uint256,bytes)")
);

export const SEPOLIA_CHAIN_ID = 11155111n;

export const FAR_FUTURE_TIMESTAMP = 9_999_999_999n;

const coder = AbiCoder.defaultAbiCoder();

export type ActionInput = {
  actionId: string;
  target: string;
  selector: string;
  params: string;
  nativeValue: bigint;
  earliestExecution: bigint;
  expiry: bigint;
};

export const ACTION_INPUT_TUPLE = "tuple(bytes32,address,bytes4,bytes,uint256,uint256,uint256)";

export function encodeActions(actions: ActionInput[]): string {
  return coder.encode(
    [`${ACTION_INPUT_TUPLE}[]`],
    [
      actions.map((a) => [
        a.actionId,
        a.target,
        a.selector,
        a.params,
        a.nativeValue,
        a.earliestExecution,
        a.expiry
      ])
    ]
  );
}

export type PolicyApprovedArgs = {
  policyId: string;
  version: bigint;
  safe: string;
  destinationChainId: bigint;
  executor: string;
  activation: bigint;
  expiry: bigint;
  actions: ActionInput[];
};

export function expectedTopics(args: PolicyApprovedArgs): string[] {
  return [
    POLICY_APPROVED_SIGNATURE,
    args.policyId,
    coder.encode(["address"], [args.safe])
  ];
}

export function expectedData(args: PolicyApprovedArgs): string {
  const encodedActions = encodeActions(args.actions);
  return coder.encode(
    ["uint256", "uint256", "address", "uint256", "uint256", "bytes"],
    [args.version, args.destinationChainId, args.executor, args.activation, args.expiry, encodedActions]
  );
}

export type MockProofInput = {
  claimedSourceChainId: bigint;
  receiptStatus: number;
  logEmitter: string;
  logTopics: string[];
  logData: string;
};

const MOCK_PROOF_TUPLE = "tuple(uint256,uint8,address,bytes32[],bytes)";

export function encodeMockProof(proof: MockProofInput): string {
  return coder.encode(
    [MOCK_PROOF_TUPLE],
    [
      [
        proof.claimedSourceChainId,
        proof.receiptStatus,
        proof.logEmitter,
        proof.logTopics,
        proof.logData
      ]
    ]
  );
}

export function validMockProofFor(policyRegistryAddress: string, args: PolicyApprovedArgs): string {
  return encodeMockProof({
    claimedSourceChainId: SEPOLIA_CHAIN_ID,
    receiptStatus: 1,
    logEmitter: policyRegistryAddress,
    logTopics: expectedTopics(args),
    logData: expectedData(args)
  });
}

export async function nowSeconds(): Promise<bigint> {
  const block = await ethers.provider.getBlock("latest");
  if (!block) throw new Error("no latest block");
  return BigInt(block.timestamp);
}

export function selectorOf(signature: string): string {
  return keccak256(toUtf8Bytes(signature)).slice(0, 10);
}

const LOG_ENTRY_TUPLE = "tuple(address,bytes32[],bytes)";

export type EvmV1LogInput = {
  address: string;
  topics: string[];
  data: string;
};

export function encodeEvmV1Transaction(params: {
  receiptStatus: number;
  logs: EvmV1LogInput[];
}): string {
  const commonTxChunk = coder.encode(
    ["uint64", "uint64", "address", "bool", "address", "uint256", "bytes"],
    [0n, 21000n, "0x0000000000000000000000000000000000000001", false, "0x0000000000000000000000000000000000000002", 0n, "0x"]
  );
  const legacyFieldsChunk = coder.encode(
    ["uint128", "uint256", "bytes32", "bytes32"],
    [1n, 27n, ethers.ZeroHash, ethers.ZeroHash]
  );
  const receiptChunk = coder.encode(
    ["uint8", "uint64", `${LOG_ENTRY_TUPLE}[]`, "bytes"],
    [
      params.receiptStatus,
      21000n,
      params.logs.map((l) => [l.address, l.topics, l.data]),
      "0x"
    ]
  );

  return coder.encode(["uint8", "bytes[]"], [0, [commonTxChunk, legacyFieldsChunk, receiptChunk]]);
}

const ENCODED_PROOF_TUPLE =
  "tuple(uint64,uint64,bytes,bytes32,tuple(bytes32,bool)[],bytes32,bytes32[])";

export type RealProofInput = {
  chainKey: bigint;
  blockHeight: bigint;
  encodedTransaction: string;
  merkleRoot: string;
  siblings: { hash: string; isLeft: boolean }[];
  lowerEndpointDigest: string;
  continuityRoots: string[];
};

export function encodeRealProof(proof: RealProofInput): string {
  return coder.encode(
    [ENCODED_PROOF_TUPLE],
    [
      [
        proof.chainKey,
        proof.blockHeight,
        proof.encodedTransaction,
        proof.merkleRoot,
        proof.siblings.map((s) => [s.hash, s.isLeft]),
        proof.lowerEndpointDigest,
        proof.continuityRoots
      ]
    ]
  );
}
