export const REJECTION_REASONS = [
  "Policy not active",
  "Policy expired",
  "Executor paused",
  "Wrong destination chain",
  "Wrong executor",
  "Wrong target",
  "Function not allowed",
  "Calldata differs from approval",
  "Amount exceeds approval",
  "Action already executed",
  "Policy version is stale",
  "Proof already used",
  "Source transaction failed",
  "Source emitter not approved",
  "Source Safe does not match",
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const CONTRACT_ERROR_TO_REJECTION_REASON: Readonly<Record<string, RejectionReason>> = {
  PolicyNotActive: "Policy not active",
  PolicyExpired: "Policy expired",
  ExecutorPaused: "Executor paused",
  ActionNotFound: "Wrong target",
  ActionAlreadyExecuted: "Action already executed",
  TargetMismatch: "Wrong target",
  FunctionNotAllowed: "Function not allowed",
  CalldataMismatch: "Calldata differs from approval",
  AmountExceedsApproval: "Amount exceeds approval",
  NotYetEligible: "Policy not active",
  ActionExpired: "Policy expired",
  UnsupportedSourceChain: "Source transaction failed",
  SourceTransactionFailed: "Source transaction failed",
  EmitterNotApproved: "Source emitter not approved",
  SafeMismatch: "Source Safe does not match",
  WrongDestinationChain: "Wrong destination chain",
  WrongExecutor: "Wrong executor",
  StalePolicyVersion: "Policy version is stale",
  PolicyNotYetValid: "Policy not active",
  PolicyAlreadyExpired: "Policy expired",
  ProofAlreadyUsed: "Proof already used",
};

export function resolveRejectionReason(contractErrorName: string | null | undefined): RejectionReason | null {
  if (!contractErrorName) return null;
  return CONTRACT_ERROR_TO_REJECTION_REASON[contractErrorName] ?? null;
}
