-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('Draft', 'AwaitingApproval', 'ApprovedOnEthereum', 'AwaitingEvidence', 'Verifying', 'Active', 'Paused', 'Expired', 'Completed', 'Superseded');

-- CreateEnum
CREATE TYPE "ActionTemplateType" AS ENUM ('grant', 'risk_cap', 'pause');

-- CreateEnum
CREATE TYPE "ActionState" AS ENUM ('Draft', 'Waiting', 'Ready', 'Executed', 'Expired', 'Paused', 'Blocked');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PolicyDrafted', 'SubmittedToSafe', 'SafeSignatureAdded', 'SafeThresholdReached', 'SourceTransactionExecuted', 'AttestcoinEvidenceAvailable', 'PolicyVerifiedOnCreditcoin', 'ActionSubmitted', 'ActionExecuted', 'ActionBlocked', 'GuardianPauseActivated', 'PolicyExpired', 'NewPolicyVersionActivated');

-- CreateEnum
CREATE TYPE "ActivityNetwork" AS ENUM ('ethereum_sepolia', 'creditcoin_cc3');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "authoritySafeAddress" TEXT NOT NULL,
    "authoritySafeChainId" INTEGER NOT NULL,
    "destinationChainId" INTEGER NOT NULL,
    "executorAddress" TEXT NOT NULL,
    "activationTime" TIMESTAMP(3) NOT NULL,
    "expiryTime" TIMESTAMP(3) NOT NULL,
    "status" "PolicyStatus" NOT NULL DEFAULT 'Draft',
    "safeTxHash" TEXT,
    "ethereumTxHash" TEXT,
    "attestcoinProofRef" TEXT,
    "creditcoinActivationTxHash" TEXT,
    "supersededById" TEXT,
    "verificationFailureReason" TEXT,
    "verificationFailedAt" TIMESTAMP(3),
    "lastActivationAttemptAt" TIMESTAMP(3),
    "guardianAddress" TEXT,
    "guardianPauseReason" TEXT,
    "guardianPausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "templateType" "ActionTemplateType" NOT NULL,
    "label" TEXT NOT NULL,
    "targetContract" TEXT NOT NULL,
    "functionSelector" TEXT NOT NULL,
    "encodedParams" TEXT NOT NULL,
    "nativeValue" TEXT NOT NULL,
    "earliestExecution" TIMESTAMP(3) NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "state" "ActionState" NOT NULL DEFAULT 'Draft',
    "executionTxHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "actionId" TEXT,
    "type" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "network" "ActivityNetwork" NOT NULL,
    "txHash" TEXT,
    "humanReadableMessage" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "technicalDetails" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "executorAddress" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "supportedActions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerCursor" (
    "key" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerCursor_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_safeTxHash_idx" ON "Policy"("safeTxHash");

-- CreateIndex
CREATE INDEX "Action_policyId_idx" ON "Action"("policyId");

-- CreateIndex
CREATE INDEX "Action_state_idx" ON "Action"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Action_policyId_id_key" ON "Action"("policyId", "id");

-- CreateIndex
CREATE INDEX "ActivityEvent_policyId_timestamp_idx" ON "ActivityEvent"("policyId", "timestamp");

-- CreateIndex
CREATE INDEX "ActivityEvent_actionId_idx" ON "ActivityEvent"("actionId");

-- CreateIndex
CREATE INDEX "ActivityEvent_type_idx" ON "ActivityEvent"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_network_executorAddress_key" ON "Integration"("network", "executorAddress");

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;
