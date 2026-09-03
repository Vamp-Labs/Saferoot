import type { Action, Policy } from "@prisma/client";

export const EXPIRING_SOON_WINDOW_MS = 24 * 60 * 60 * 1000;

const WORKFLOW_PROGRESS_STAGES = [
  "AwaitingApproval",
  "ApprovedOnEthereum",
  "AwaitingEvidence",
  "Verifying",
  "Active",
] as const;

export function computeDisplayStatus(
  policy: Pick<Policy, "status" | "expiryTime" | "supersededById">,
  actions: ReadonlyArray<Pick<Action, "state">>,
  now: Date = new Date(),
): Policy["status"] {
  if (policy.status === "Paused") return "Paused";
  if (policy.supersededById) return "Superseded";

  const canExpire = (WORKFLOW_PROGRESS_STAGES as ReadonlyArray<string>).includes(policy.status);
  if (canExpire && now.getTime() > policy.expiryTime.getTime()) return "Expired";

  if (policy.status === "Active") {
    const hasUnexecutedAction = actions.some((action) => action.state === "Ready" || action.state === "Waiting");
    if (!hasUnexecutedAction && actions.length > 0) return "Completed";
    return "Active";
  }

  return policy.status;
}

export function isExpiringSoon(policy: Pick<Policy, "expiryTime">, now: Date = new Date()): boolean {
  const remainingMs = policy.expiryTime.getTime() - now.getTime();
  return remainingMs > 0 && remainingMs <= EXPIRING_SOON_WINDOW_MS;
}
