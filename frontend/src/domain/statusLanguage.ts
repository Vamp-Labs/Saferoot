import type { ActionState, Policy, PolicyStatus } from "./types";
import { formatCountdown } from "@/lib/format";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

export const policyStatusLanguage: Record<PolicyStatus, StatusPresentation> = {
  Draft: { label: "Building policy", tone: "neutral" },
  AwaitingApproval: { label: "Waiting for Safe approval", tone: "warning" },
  ApprovedOnEthereum: { label: "Safe approved", tone: "info" },
  AwaitingEvidence: { label: "Waiting for evidence", tone: "warning" },
  Verifying: { label: "Verifying on Creditcoin", tone: "info" },
  Active: { label: "Ready to execute", tone: "success" },
  Paused: { label: "Remaining actions paused", tone: "danger" },
  Expired: { label: "Execution window ended", tone: "neutral" },
  Completed: { label: "Completed", tone: "success" },
  Superseded: { label: "Replaced by a newer policy", tone: "neutral" },
};

export const actionStateLanguage: Record<ActionState, StatusPresentation> = {
  Draft: { label: "Not yet approved", tone: "neutral" },
  Waiting: { label: "Waiting for verification", tone: "warning" },
  Ready: { label: "Ready to execute", tone: "success" },
  Executed: { label: "Executed", tone: "success" },
  Expired: { label: "Execution window ended", tone: "neutral" },
  Paused: { label: "Paused by guardian", tone: "danger" },
  Blocked: { label: "Blocked — action differs from approval", tone: "danger" },
};

export const policyStatePriority: PolicyStatus[] = [
  "Paused",
  "Superseded",
  "Expired",
  "Completed",
  "Active",
  "Verifying",
  "AwaitingEvidence",
  "ApprovedOnEthereum",
  "AwaitingApproval",
  "Draft",
];

export function comparePolicyPriority(a: PolicyStatus, b: PolicyStatus): number {
  return policyStatePriority.indexOf(a) - policyStatePriority.indexOf(b);
}

export type JourneyStage = "Build" | "Approve" | "Verify" | "Execute";

export const journeyStages: JourneyStage[] = ["Build", "Approve", "Verify", "Execute"];

export function journeyStageForStatus(status: PolicyStatus): JourneyStage {
  switch (status) {
    case "Draft":
      return "Build";
    case "AwaitingApproval":
      return "Approve";
    case "ApprovedOnEthereum":
    case "AwaitingEvidence":
    case "Verifying":
      return "Verify";
    default:
      return "Execute";
  }
}

export function highestPriorityWarning(policy: Policy): StatusPresentation | null {
  if (policy.status === "Paused") {
    return { label: "Guardian pause active", tone: "danger" };
  }
  if (policy.status === "AwaitingApproval") {
    return { label: "Waiting for Safe signatures", tone: "warning" };
  }
  const expiryMs = new Date(policy.expiryTime).getTime() - Date.now();
  if (policy.status === "Active" && expiryMs > 0 && expiryMs < 6 * 3_600_000) {
    return { label: `Expires ${formatCountdown(policy.expiryTime).toLowerCase()}`, tone: "warning" };
  }
  if (policy.status === "AwaitingEvidence" || policy.status === "Verifying") {
    return { label: "Verification in progress", tone: "info" };
  }
  return null;
}

export function readyActionCount(policy: Policy): number {
  return policy.actions.filter((action) => action.state === "Ready").length;
}
