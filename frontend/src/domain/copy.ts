import type { RejectionReason } from "./types";

export interface CopyBlock {
  headline: string;
  lines: string[];
}

export const rejectionCopyLibrary: Record<RejectionReason, CopyBlock> = {
  AmountExceedsApproval: {
    headline: "Execution blocked — no funds moved",
    lines: [
      "This action differs from the Safe-approved policy.",
    ],
  },
  WrongTarget: {
    headline: "Execution blocked — unauthorized target",
    lines: ["This policy does not permit calls to the submitted contract."],
  },
  CalldataMismatch: {
    headline: "Execution blocked — recipient changed",
    lines: ["The submitted recipient does not match the recipient approved by the Safe."],
  },
  ActionAlreadyExecuted: {
    headline: "Already executed",
    lines: ["This one-time action was successfully executed earlier and cannot be used again."],
  },
  PolicyExpired: {
    headline: "Execution window ended",
    lines: ["This policy expired before the action was submitted. Create a new Safe-approved policy to continue."],
  },
  StalePolicyVersion: {
    headline: "Policy replaced",
    lines: ["A newer Safe-approved policy is active. This older version cannot execute."],
  },
  ExecutorPaused: {
    headline: "Remaining actions paused",
    lines: ["The Creditcoin guardian paused this policy. No unused action can execute while the pause remains active."],
  },
  ProofAlreadyUsed: {
    headline: "Approval already verified",
    lines: ["This Safe approval has already been processed. The active policy was not changed."],
  },
  PolicyNotActive: {
    headline: "Execution blocked — policy is not active",
    lines: ["This policy has not yet been verified on Creditcoin."],
  },
  WrongDestinationChain: {
    headline: "Execution blocked — wrong destination chain",
    lines: ["This policy is not bound to the chain the action was submitted on."],
  },
  WrongExecutor: {
    headline: "Execution blocked — wrong executor",
    lines: ["This policy is not bound to the executor that submitted this action."],
  },
  FunctionNotAllowed: {
    headline: "Execution blocked — function not allowed",
    lines: ["This policy does not permit calling the submitted function."],
  },
  SourceTransactionFailed: {
    headline: "Execution blocked — source transaction failed",
    lines: ["The Ethereum source transaction did not succeed, so no Creditcoin authority was created."],
  },
  SourceEmitterNotApproved: {
    headline: "Execution blocked — unrecognized source",
    lines: ["The source event was not emitted by the approved policy emitter."],
  },
  SourceSafeMismatch: {
    headline: "Execution blocked — wrong authority Safe",
    lines: ["The source approval did not come from the configured authority Safe."],
  },
};

export const guardianPauseCopy = {
  confirmationHeadline: "Pause all remaining actions?",
  confirmationBody:
    "Completed actions will not be reversed. Unused actions will become unavailable on Creditcoin. The guardian cannot change or execute them.",
  pausedBanner: "Guardian pause active — remaining actions are unavailable.",
  blockedRemaining: "Remaining actions paused",
  blockedRemainingBody:
    "The Creditcoin guardian paused this policy. No unused action can execute while the pause remains active.",
};

export const emptyStateCopy = {
  noSafeConnected: "Connect an Ethereum Safe to create Creditcoin policies.",
  noPolicies: "No policies yet. Create your first bounded Creditcoin policy using an existing Safe.",
  noActiveActions: "This policy has no remaining executable actions.",
};

export const waitingStateCopy = {
  ethereumConfirmation: "The Safe transaction was submitted. No action is required while Ethereum confirms it.",
  attestcoinEvidence: "The Safe approval is confirmed. SafeRoot is waiting for verifiable source evidence.",
  creditcoinVerification: "Evidence is available and is being verified on Creditcoin.",
  attestationWaiting: "Safe approval confirmed. Waiting for Attestcoin evidence. No action is required.",
  relayerWaiting: "Evidence is available. SafeRoot is delivering it to Creditcoin.",
  walletCancelled: "Transaction cancelled. Your policy draft was preserved.",
};

export const safetyStatement = "Relayers cannot change targets, amounts, or calldata.";

export const revocationWarning =
  "Cross-chain revocation is not instantaneous. A paused or superseded policy may remain executable on Creditcoin until the pause or new version is confirmed.";
