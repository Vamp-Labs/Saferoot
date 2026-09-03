import type { RejectionReason } from "./rejectionReasons";

export interface PolicyDraftedContext {
  policyName: string;
}
export interface SubmittedToSafeContext {
  safeTxHash: string;
}
export interface SafeSignatureAddedContext {
  signerAddress: string;
  confirmations: number;
  threshold: number;
}
export interface SafeThresholdReachedContext {
  threshold: number;
}
export interface SourceTransactionExecutedContext {
  ethereumTxHash: string;
}
export interface AttestcoinEvidenceAvailableContext {
  sourceBlockHeight: number;
}
export interface PolicyVerifiedOnCreditcoinContext {
  creditcoinTxHash: string;
}
export interface ActionSubmittedContext {
  actionLabel: string;
  submitter: string;
}
export interface ActionExecutedContext {
  actionLabel: string;
  creditcoinTxHash: string;
}
export interface ActionBlockedContext {
  actionLabel: string | null;
  reason: RejectionReason;
}
export interface GuardianPauseActivatedContext {
  guardianAddress: string;
  reason: string;
}
export interface PolicyExpiredContext {
  policyName: string;
}
export interface NewPolicyVersionActivatedContext {
  policyName: string;
  version: number;
}

export const activityMessage = {
  PolicyDrafted: (ctx: PolicyDraftedContext): string => `Policy "${ctx.policyName}" was drafted.`,
  SubmittedToSafe: (ctx: SubmittedToSafeContext): string =>
    `Policy submitted to Safe for approval (transaction ${ctx.safeTxHash}).`,
  SafeSignatureAdded: (ctx: SafeSignatureAddedContext): string =>
    `${ctx.signerAddress} signed the Safe transaction (${ctx.confirmations}/${ctx.threshold} signatures).`,
  SafeThresholdReached: (ctx: SafeThresholdReachedContext): string =>
    `Safe signature threshold reached (${ctx.threshold} of ${ctx.threshold}).`,
  SourceTransactionExecuted: (ctx: SourceTransactionExecutedContext): string =>
    `Safe transaction executed on Ethereum Sepolia (${ctx.ethereumTxHash}).`,
  AttestcoinEvidenceAvailable: (ctx: AttestcoinEvidenceAvailableContext): string =>
    `Attestcoin evidence is available for source block ${ctx.sourceBlockHeight}.`,
  PolicyVerifiedOnCreditcoin: (ctx: PolicyVerifiedOnCreditcoinContext): string =>
    `Policy verified and activated on Creditcoin CC3 (${ctx.creditcoinTxHash}).`,
  ActionSubmitted: (ctx: ActionSubmittedContext): string =>
    `${ctx.submitter} submitted action "${ctx.actionLabel}" for execution.`,
  ActionExecuted: (ctx: ActionExecutedContext): string =>
    `Action "${ctx.actionLabel}" executed exactly as approved (${ctx.creditcoinTxHash}).`,
  ActionBlocked: (ctx: ActionBlockedContext): string =>
    ctx.actionLabel
      ? `Execution blocked for action "${ctx.actionLabel}" — no funds moved. Reason: ${ctx.reason}.`
      : `Policy activation blocked — no state changed. Reason: ${ctx.reason}.`,
  GuardianPauseActivated: (ctx: GuardianPauseActivatedContext): string =>
    `Guardian ${ctx.guardianAddress} paused all remaining actions. Reason: ${ctx.reason}.`,
  PolicyExpired: (ctx: PolicyExpiredContext): string => `Policy "${ctx.policyName}" has expired.`,
  NewPolicyVersionActivated: (ctx: NewPolicyVersionActivatedContext): string =>
    `A newer version (v${ctx.version}) of policy "${ctx.policyName}" is now active, superseding the previous version.`,
} as const;
