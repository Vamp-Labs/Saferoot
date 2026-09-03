import type { Action, Policy } from "@prisma/client";
import { computeDisplayStatus, isExpiringSoon } from "./status";

export type PolicyGroupKey = "needsAttention" | "beingVerified" | "ready" | "history";

export interface GroupablePolicy extends Policy {
  actions: Action[];
}

export function groupPolicy(policy: GroupablePolicy, now: Date = new Date()): PolicyGroupKey {
  const displayStatus = computeDisplayStatus(policy, policy.actions, now);

  if (displayStatus === "Draft") return "needsAttention";
  if (displayStatus === "AwaitingApproval") return "needsAttention";
  if (displayStatus === "Paused") return "needsAttention";
  if (policy.verificationFailureReason) return "needsAttention";

  const inWorkflowProgress =
    displayStatus === "ApprovedOnEthereum" || displayStatus === "AwaitingEvidence" || displayStatus === "Verifying";
  if (inWorkflowProgress && isExpiringSoon(policy, now)) return "needsAttention";
  if (inWorkflowProgress) return "beingVerified";

  if (displayStatus === "Active") return "ready";

  return "history";
}

export function groupPolicies<T extends GroupablePolicy>(
  policies: ReadonlyArray<T>,
  now: Date = new Date(),
): Record<PolicyGroupKey, T[]> {
  const groups: Record<PolicyGroupKey, T[]> = {
    needsAttention: [],
    beingVerified: [],
    ready: [],
    history: [],
  };
  for (const policy of policies) {
    groups[groupPolicy(policy, now)].push(policy);
  }
  return groups;
}
