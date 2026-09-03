import type { Action, ActivityEvent, Integration, Policy } from "@prisma/client";
import { computeDisplayStatus } from "./status";

const NETWORK_TO_API: Record<ActivityEvent["network"], "ethereum-sepolia" | "creditcoin-cc3"> = {
  ethereum_sepolia: "ethereum-sepolia",
  creditcoin_cc3: "creditcoin-cc3",
};

export function serializeAction(action: Action) {
  return {
    id: action.id,
    policyId: action.policyId,
    templateType: action.templateType,
    label: action.label,
    targetContract: action.targetContract,
    functionSelector: action.functionSelector,
    encodedParams: action.encodedParams,
    nativeValue: action.nativeValue,
    earliestExecution: action.earliestExecution.toISOString(),
    expiry: action.expiry.toISOString(),
    state: action.state,
    executionTxHash: action.executionTxHash,
  };
}

export function serializePolicy(policy: Policy, actions: Action[] = []) {
  const displayStatus = computeDisplayStatus(policy, actions);
  return {
    id: policy.id,
    name: policy.name,
    version: policy.version,
    authoritySafeAddress: policy.authoritySafeAddress,
    authoritySafeChainId: policy.authoritySafeChainId,
    destinationChainId: policy.destinationChainId,
    executorAddress: policy.executorAddress,
    activationTime: policy.activationTime.toISOString(),
    expiryTime: policy.expiryTime.toISOString(),
    status: displayStatus,
    safeTxHash: policy.safeTxHash,
    ethereumTxHash: policy.ethereumTxHash,
    attestcoinProofRef: policy.attestcoinProofRef,
    creditcoinActivationTxHash: policy.creditcoinActivationTxHash,
    verificationFailureReason: policy.verificationFailureReason,
    guardianAddress: policy.guardianAddress,
    guardianPauseReason: policy.guardianPauseReason,
    guardianPausedAt: policy.guardianPausedAt ? policy.guardianPausedAt.toISOString() : null,
    createdAt: policy.createdAt.toISOString(),
    updatedAt: policy.updatedAt.toISOString(),
  };
}

export function serializePolicyDetail(policy: Policy, actions: Action[], activity: ActivityEvent[]) {
  return {
    ...serializePolicy(policy, actions),
    actions: actions.map(serializeAction),
    activity: activity.map(serializeActivityEvent),
  };
}

export function serializeActivityEvent(event: ActivityEvent) {
  return {
    id: event.id,
    policyId: event.policyId,
    actionId: event.actionId,
    type: event.type,
    timestamp: event.timestamp.toISOString(),
    actor: event.actor,
    network: NETWORK_TO_API[event.network],
    txHash: event.txHash,
    humanReadableMessage: event.humanReadableMessage,
    rejectionReason: event.rejectionReason,
    technicalDetails: event.technicalDetails,
  };
}

export function serializeIntegration(integration: Integration) {
  return {
    id: integration.id,
    name: integration.name,
    network: integration.network,
    executorAddress: integration.executorAddress,
    verified: integration.verified,
    supportedActions: integration.supportedActions,
  };
}

export const apiNetworkFromActivityNetwork = (network: ActivityEvent["network"]): "ethereum-sepolia" | "creditcoin-cc3" =>
  NETWORK_TO_API[network];
