export type PolicyStatus =
  | "Draft"
  | "AwaitingApproval"
  | "ApprovedOnEthereum"
  | "AwaitingEvidence"
  | "Verifying"
  | "Active"
  | "Paused"
  | "Expired"
  | "Completed"
  | "Superseded";

export type ActionState =
  | "Draft"
  | "Waiting"
  | "Ready"
  | "Executed"
  | "Expired"
  | "Paused"
  | "Blocked";

export type ActionTemplateType = "grant" | "risk_cap" | "pause";

export type RejectionReason =
  | "PolicyNotActive"
  | "PolicyExpired"
  | "ExecutorPaused"
  | "WrongDestinationChain"
  | "WrongExecutor"
  | "WrongTarget"
  | "FunctionNotAllowed"
  | "CalldataMismatch"
  | "AmountExceedsApproval"
  | "ActionAlreadyExecuted"
  | "StalePolicyVersion"
  | "ProofAlreadyUsed"
  | "SourceTransactionFailed"
  | "SourceEmitterNotApproved"
  | "SourceSafeMismatch";

export type ActivityEventType =
  | "PolicyDrafted"
  | "SubmittedToSafe"
  | "SafeSignatureAdded"
  | "SafeThresholdReached"
  | "SourceTransactionExecuted"
  | "AttestcoinEvidenceAvailable"
  | "PolicyVerifiedOnCreditcoin"
  | "ActionSubmitted"
  | "ActionExecuted"
  | "ActionBlocked"
  | "GuardianPauseActivated"
  | "PolicyExpired"
  | "NewPolicyVersionActivated";

export type NetworkId = "ethereum-sepolia" | "creditcoin-cc3";

export interface ActionTechnicalDetails {
  targetContract: string;
  functionSelector: string;
  encodedParams: string;
  nativeValue: string;
}

export interface Action {
  id: string;
  policyId: string;
  templateType: ActionTemplateType;
  label: string;
  targetContract: string;
  functionSelector: string;
  encodedParams: string;
  nativeValue: string;
  earliestExecution: string;
  expiry: string;
  state: ActionState;
  executionTxHash: string | null;
  recipientLabel?: string;
  assetLabel?: string;
  amountLabel?: string;
}

export interface Policy {
  id: string;
  name: string;
  version: number;
  authoritySafeAddress: string;
  authoritySafeChainId: number;
  destinationChainId: number;
  executorAddress: string;
  activationTime: string;
  expiryTime: string;
  status: PolicyStatus;
  safeTxHash: string | null;
  ethereumTxHash: string | null;
  attestcoinProofRef: string | null;
  creditcoinActivationTxHash: string | null;
  createdAt: string;
  updatedAt: string;
  actions: Action[];
}

export interface ActivityEvent {
  id: string;
  policyId: string;
  actionId: string | null;
  type: ActivityEventType;
  timestamp: string;
  actor: string;
  network: NetworkId;
  txHash: string | null;
  humanReadableMessage: string;
  rejectionReason: RejectionReason | null;
  technicalDetails: {
    safeTxHash?: string;
    policyVersion?: number;
    sourceEmitter?: string;
    executor?: string;
    attestcoinProofRef?: string;
    actionCommitment?: string;
    creditcoinTxHash?: string;
  };
}

export interface SupportedAction {
  templateType: ActionTemplateType;
  targetContract: string;
  functionSelector: string;
  description: string;
}

export interface Integration {
  id: string;
  name: string;
  network: NetworkId;
  executorAddress: string;
  verified: boolean;
  supportedActions: SupportedAction[];
}

export interface SafeInfo {
  address: string;
  name: string | null;
  owners: string[];
  threshold: number;
  network: string;
  chainId: number;
}

export interface PoliciesGrouped {
  needsAttention: Policy[];
  beingVerified: Policy[];
  ready: Policy[];
  history: Policy[];
}
