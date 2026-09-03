import type {
  Action,
  ActivityEvent,
  Integration,
  Policy,
  PoliciesGrouped,
  SafeInfo,
} from "@/domain/types";
import { keccak256, toHex, type Hex } from "viem";
import { SEPOLIA_CHAIN_ID, CC3_CHAIN_ID } from "../chains";
import {
  defaultGrantValues,
  defaultRiskCapValues,
  encodeGrantParams,
  encodePauseParams,
  encodeRiskCapParams,
} from "@/domain/actionTemplates";

const now = Date.now();
const hours = (n: number) => new Date(now + n * 3_600_000).toISOString();

function fixtureId(label: string): Hex {
  return keccak256(toHex(label));
}

const activePolicyId = fixtureId("policy-active-0001");
const awaitingApprovalPolicyId = fixtureId("policy-awaiting-0002");
const verifyingPolicyId = fixtureId("policy-verifying-0003");
const pausedPolicyId = fixtureId("policy-paused-0004");
const completedPolicyId = fixtureId("policy-completed-0005");

export const fixtureSafe: SafeInfo = {
  address: "0xe1f2b6f0ae3c8f4a1b7d4c6e9a2f1d8b3e5c7a9e",
  name: "Acme Treasury Safe",
  owners: [
    "0xa1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4",
    "0xb2c3d4e5f6a78901b2c3d4e5f6a78901b2c3d4e5",
    "0xc3d4e5f6a7b89012c3d4e5f6a7b89012c3d4e5f6",
  ],
  threshold: 2,
  network: "ethereum-sepolia",
  chainId: SEPOLIA_CHAIN_ID,
};

export const fixtureIntegration: Integration = {
  id: "integration-safeRoot-demo",
  name: "SafeRoot Demo Executor",
  network: "creditcoin-cc3",
  executorAddress: "0x9f3e1a2b4c5d6e7f80919f3e1a2b4c5d6e7f8091",
  verified: true,
  supportedActions: [
    {
      templateType: "grant",
      targetContract: "0x4d5e6f708192a3b4c5d6e7f84d5e6f708192a3b4",
      functionSelector: "0xa9059cbb",
      description: "Pay MockUSDC from the executor's balance to a fixed recipient.",
    },
    {
      templateType: "risk_cap",
      targetContract: "0x2b3c4d5e6f708192a3b42b3c4d5e6f708192a3b4",
      functionSelector: "0x4b2ac2fb",
      description: "Update the maximum loan-to-value ratio on the demo lending pool.",
    },
    {
      templateType: "pause",
      targetContract: "0x2b3c4d5e6f708192a3b42b3c4d5e6f708192a3b4",
      functionSelector: "0x8456cb59",
      description: "Pause new deposits on the demo lending pool.",
    },
  ],
};

function makeActions(policyId: Hex, state: Action["state"]): Action[] {
  return [
    {
      id: fixtureId(`${policyId}-action-grant`),
      policyId,
      templateType: "grant",
      label: "Pay 25,000 USDC to Alice DAO",
      targetContract: fixtureIntegration.supportedActions[0].targetContract,
      functionSelector: fixtureIntegration.supportedActions[0].functionSelector,
      encodedParams: encodeGrantParams(defaultGrantValues),
      nativeValue: "0",
      earliestExecution: hours(-2),
      expiry: hours(18),
      state,
      executionTxHash: null,
      recipientLabel: "Alice DAO",
      assetLabel: "USDC",
      amountLabel: "25,000",
    },
    {
      id: fixtureId(`${policyId}-action-riskcap`),
      policyId,
      templateType: "risk_cap",
      label: "Set maximum LTV to 68%",
      targetContract: fixtureIntegration.supportedActions[1].targetContract,
      functionSelector: fixtureIntegration.supportedActions[1].functionSelector,
      encodedParams: encodeRiskCapParams(defaultRiskCapValues),
      nativeValue: "0",
      earliestExecution: hours(-2),
      expiry: hours(18),
      state,
      executionTxHash: null,
    },
    {
      id: fixtureId(`${policyId}-action-pause`),
      policyId,
      templateType: "pause",
      label: "Pause new deposits",
      targetContract: fixtureIntegration.supportedActions[2].targetContract,
      functionSelector: fixtureIntegration.supportedActions[2].functionSelector,
      encodedParams: encodePauseParams(),
      nativeValue: "0",
      earliestExecution: hours(-2),
      expiry: hours(18),
      state,
      executionTxHash: null,
    },
  ];
}

const activePolicy: Policy = {
  id: activePolicyId,
  name: "Protocol Operations",
  version: 1,
  authoritySafeAddress: fixtureSafe.address,
  authoritySafeChainId: SEPOLIA_CHAIN_ID,
  destinationChainId: CC3_CHAIN_ID,
  executorAddress: fixtureIntegration.executorAddress,
  activationTime: hours(-3),
  expiryTime: hours(18),
  status: "Active",
  safeTxHash: "0xsafe-tx-active-0001",
  ethereumTxHash: "0xeth-tx-active-0001",
  attestcoinProofRef: "attestcoin-proof-active-0001",
  creditcoinActivationTxHash: "0xcc3-tx-activate-0001",
  createdAt: hours(-6),
  updatedAt: hours(-1),
  actions: makeActions(activePolicyId, "Ready"),
};

const awaitingApprovalPolicy: Policy = {
  id: awaitingApprovalPolicyId,
  name: "Q3 Contributor Payments",
  version: 1,
  authoritySafeAddress: fixtureSafe.address,
  authoritySafeChainId: SEPOLIA_CHAIN_ID,
  destinationChainId: CC3_CHAIN_ID,
  executorAddress: fixtureIntegration.executorAddress,
  activationTime: hours(1),
  expiryTime: hours(72),
  status: "AwaitingApproval",
  safeTxHash: "0xsafe-tx-awaiting-0002",
  ethereumTxHash: null,
  attestcoinProofRef: null,
  creditcoinActivationTxHash: null,
  createdAt: hours(-1),
  updatedAt: hours(-0.2),
  actions: makeActions(awaitingApprovalPolicyId, "Draft"),
};

const verifyingPolicy: Policy = {
  id: verifyingPolicyId,
  name: "Risk Parameter Update",
  version: 1,
  authoritySafeAddress: fixtureSafe.address,
  authoritySafeChainId: SEPOLIA_CHAIN_ID,
  destinationChainId: CC3_CHAIN_ID,
  executorAddress: fixtureIntegration.executorAddress,
  activationTime: hours(-0.5),
  expiryTime: hours(48),
  status: "AwaitingEvidence",
  safeTxHash: "0xsafe-tx-verifying-0003",
  ethereumTxHash: "0xeth-tx-verifying-0003",
  attestcoinProofRef: null,
  creditcoinActivationTxHash: null,
  createdAt: hours(-2),
  updatedAt: hours(-0.1),
  actions: makeActions(verifyingPolicyId, "Waiting"),
};

const pausedPolicy: Policy = {
  id: pausedPolicyId,
  name: "Bridge Incident Response",
  version: 1,
  authoritySafeAddress: fixtureSafe.address,
  authoritySafeChainId: SEPOLIA_CHAIN_ID,
  destinationChainId: CC3_CHAIN_ID,
  executorAddress: fixtureIntegration.executorAddress,
  activationTime: hours(-30),
  expiryTime: hours(2),
  status: "Paused",
  safeTxHash: "0xsafe-tx-paused-0004",
  ethereumTxHash: "0xeth-tx-paused-0004",
  attestcoinProofRef: "attestcoin-proof-paused-0004",
  creditcoinActivationTxHash: "0xcc3-tx-activate-0004",
  createdAt: hours(-40),
  updatedAt: hours(-4),
  actions: makeActions(pausedPolicyId, "Paused"),
};

const completedPolicy: Policy = {
  id: completedPolicyId,
  name: "Genesis Operations Policy",
  version: 1,
  authoritySafeAddress: fixtureSafe.address,
  authoritySafeChainId: SEPOLIA_CHAIN_ID,
  destinationChainId: CC3_CHAIN_ID,
  executorAddress: fixtureIntegration.executorAddress,
  activationTime: hours(-96),
  expiryTime: hours(-24),
  status: "Completed",
  safeTxHash: "0xsafe-tx-completed-0005",
  ethereumTxHash: "0xeth-tx-completed-0005",
  attestcoinProofRef: "attestcoin-proof-completed-0005",
  creditcoinActivationTxHash: "0xcc3-tx-activate-0005",
  createdAt: hours(-100),
  updatedAt: hours(-25),
  actions: makeActions(completedPolicyId, "Executed"),
};

export const fixturePolicies: Policy[] = [
  activePolicy,
  awaitingApprovalPolicy,
  verifyingPolicy,
  pausedPolicy,
  completedPolicy,
];

export function fixturePolicyById(id: string): Policy | null {
  return fixturePolicies.find((policy) => policy.id === id) ?? null;
}

export const fixturePoliciesGrouped: PoliciesGrouped = {
  needsAttention: [awaitingApprovalPolicy, pausedPolicy],
  beingVerified: [verifyingPolicy],
  ready: [activePolicy],
  history: [completedPolicy],
};

export const fixtureActivity: ActivityEvent[] = [
  {
    id: "activity-1",
    policyId: activePolicy.id,
    actionId: null,
    type: "PolicyDrafted",
    timestamp: hours(-6),
    actor: fixtureSafe.address,
    network: "ethereum-sepolia",
    txHash: null,
    humanReadableMessage: "Policy drafted: Protocol Operations",
    rejectionReason: null,
    technicalDetails: { policyVersion: 1 },
  },
  {
    id: "activity-2",
    policyId: activePolicy.id,
    actionId: null,
    type: "SubmittedToSafe",
    timestamp: hours(-5.8),
    actor: fixtureSafe.owners[0],
    network: "ethereum-sepolia",
    txHash: null,
    humanReadableMessage: "Policy submitted to Acme Treasury Safe",
    rejectionReason: null,
    technicalDetails: { safeTxHash: activePolicy.safeTxHash ?? undefined },
  },
  {
    id: "activity-3",
    policyId: activePolicy.id,
    actionId: null,
    type: "SafeThresholdReached",
    timestamp: hours(-5.5),
    actor: "system",
    network: "ethereum-sepolia",
    txHash: null,
    humanReadableMessage: "Safe threshold reached (2-of-3)",
    rejectionReason: null,
    technicalDetails: { safeTxHash: activePolicy.safeTxHash ?? undefined },
  },
  {
    id: "activity-4",
    policyId: activePolicy.id,
    actionId: null,
    type: "SourceTransactionExecuted",
    timestamp: hours(-5),
    actor: "system",
    network: "ethereum-sepolia",
    txHash: activePolicy.ethereumTxHash,
    humanReadableMessage: "Ethereum transaction confirmed",
    rejectionReason: null,
    technicalDetails: {
      sourceEmitter: "PolicyRegistry",
      policyVersion: 1,
    },
  },
  {
    id: "activity-5",
    policyId: activePolicy.id,
    actionId: null,
    type: "AttestcoinEvidenceAvailable",
    timestamp: hours(-4),
    actor: "system",
    network: "creditcoin-cc3",
    txHash: null,
    humanReadableMessage: "Attestcoin evidence became available",
    rejectionReason: null,
    technicalDetails: { attestcoinProofRef: activePolicy.attestcoinProofRef ?? undefined },
  },
  {
    id: "activity-6",
    policyId: activePolicy.id,
    actionId: null,
    type: "PolicyVerifiedOnCreditcoin",
    timestamp: hours(-3),
    actor: "system",
    network: "creditcoin-cc3",
    txHash: activePolicy.creditcoinActivationTxHash,
    humanReadableMessage: "Policy activated on Creditcoin",
    rejectionReason: null,
    technicalDetails: {
      executor: fixtureIntegration.executorAddress,
      creditcoinTxHash: activePolicy.creditcoinActivationTxHash ?? undefined,
    },
  },
  {
    id: "activity-7",
    policyId: activePolicy.id,
    actionId: activePolicy.actions[0].id,
    type: "ActionBlocked",
    timestamp: hours(-1.5),
    actor: "0x7777888899990000111122223333444455556666",
    network: "creditcoin-cc3",
    txHash: "0xcc3-tx-blocked-demo",
    humanReadableMessage: "Altered grant action blocked",
    rejectionReason: "AmountExceedsApproval",
    technicalDetails: {
      actionCommitment: activePolicy.actions[0].id,
      creditcoinTxHash: "0xcc3-tx-blocked-demo",
    },
  },
  {
    id: "activity-8",
    policyId: pausedPolicy.id,
    actionId: null,
    type: "GuardianPauseActivated",
    timestamp: hours(-4),
    actor: fixtureIntegration.executorAddress,
    network: "creditcoin-cc3",
    txHash: "0xcc3-tx-guardian-pause",
    humanReadableMessage: "Guardian paused remaining actions",
    rejectionReason: null,
    technicalDetails: { creditcoinTxHash: "0xcc3-tx-guardian-pause" },
  },
];
