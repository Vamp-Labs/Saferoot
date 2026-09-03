import type { Action, Policy } from "@prisma/client";
import { prisma } from "../prisma";
import { childLogger } from "../logger";
import { env } from "../env";
import { recordActivity } from "../lib/activityLog";
import { activityMessage } from "../domain/activityMessages";
import { actionsToActionInputs, encodeActionInputs } from "../domain/actionInput";
import { resolveRejectionReason } from "../domain/rejectionReasons";
import { decodeCustomErrorName } from "../lib/decodeRevert";
import { getSafeRootPolicyExecutorWriteContract } from "../chain/contracts";
import { getSepoliaProvider } from "../chain/clients";
import { startPollingLoop, type PollingLoopHandle } from "./loop";
import { computeProofRef, encodeUscProof, fetchInclusionProof } from "../usc/attestcoinClient";
import { signInterimAttestation } from "../usc/interimAttestor";

const log = childLogger("attestcoinWorker");

type PolicyWithActions = Policy & { actions: Action[] };

async function buildAttestcoinProof(
  policy: PolicyWithActions,
): Promise<{ proof: string; proofRef: string; sourceBlockHeight: number } | { pending: true } | { failed: string }> {
  if (!policy.ethereumTxHash) return { failed: "Source transaction failed" };

  if (env.ATTESTCOIN_MODE === "interim") {
    const receipt = await getSepoliaProvider().getTransactionReceipt(policy.ethereumTxHash);
    if (!receipt) return { pending: true };
    const encodedActions = encodeActionInputs(actionsToActionInputs(policy.actions));
    const proof = signInterimAttestation({
      sourceChainId: policy.authoritySafeChainId,
      ethereumTxHash: policy.ethereumTxHash,
      policyId: policy.id,
      version: BigInt(policy.version),
      safe: policy.authoritySafeAddress,
      destinationChainId: BigInt(policy.destinationChainId),
      executor: policy.executorAddress,
      activation: BigInt(Math.floor(policy.activationTime.getTime() / 1000)),
      expiry: BigInt(Math.floor(policy.expiryTime.getTime() / 1000)),
      encodedActions,
    });
    return { proof, proofRef: `interim:${policy.ethereumTxHash}`, sourceBlockHeight: receipt.blockNumber };
  }

  const result = await fetchInclusionProof(policy.ethereumTxHash);
  if (!result.ready || !result.proof) {
    log.debug({ policyId: policy.id, error: result.error }, "Attestcoin inclusion proof not yet available");
    return { pending: true };
  }
  return {
    proof: encodeUscProof(result.proof),
    proofRef: computeProofRef(result.proof),
    sourceBlockHeight: result.proof.headerNumber,
  };
}

async function activate(policy: PolicyWithActions): Promise<void> {
  if (policy.creditcoinActivationTxHash) return;

  if (policy.status === "ApprovedOnEthereum") {
    await prisma.policy.update({ where: { id: policy.id }, data: { status: "AwaitingEvidence" } });
    policy = { ...policy, status: "AwaitingEvidence" };
  }

  const outcome = await buildAttestcoinProof(policy);
  if ("pending" in outcome) return;
  if ("failed" in outcome) {
    await prisma.policy.update({
      where: { id: policy.id },
      data: { verificationFailureReason: outcome.failed, verificationFailedAt: new Date() },
    });
    return;
  }

  const evidenceAlreadyLogged = await prisma.activityEvent.findFirst({
    where: { policyId: policy.id, type: "AttestcoinEvidenceAvailable" },
  });
  if (!evidenceAlreadyLogged) {
    await recordActivity(prisma, {
      policyId: policy.id,
      type: "AttestcoinEvidenceAvailable",
      actor: "system",
      network: "creditcoin_cc3",
      humanReadableMessage: activityMessage.AttestcoinEvidenceAvailable({
        sourceBlockHeight: outcome.sourceBlockHeight,
      }),
      technicalDetails: { mode: env.ATTESTCOIN_MODE, proofRef: outcome.proofRef },
    });
  }

  await prisma.policy.update({
    where: { id: policy.id },
    data: { status: "Verifying", attestcoinProofRef: outcome.proofRef, lastActivationAttemptAt: new Date() },
  });

  const executor = getSafeRootPolicyExecutorWriteContract();
  const actionInputs = actionsToActionInputs(policy.actions).map((a) => [
    a.actionId,
    a.target,
    a.selector,
    a.params,
    a.nativeValue,
    a.earliestExecution,
    a.expiry,
  ]);

  try {
    const activatePolicy = executor.getFunction("activatePolicy");
    const tx = await activatePolicy(
      outcome.proof,
      policy.id,
      policy.version,
      policy.authoritySafeAddress,
      policy.destinationChainId,
      policy.executorAddress,
      Math.floor(policy.activationTime.getTime() / 1000),
      Math.floor(policy.expiryTime.getTime() / 1000),
      actionInputs,
    );
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error("activatePolicy transaction reverted");

    await prisma.$transaction([
      prisma.policy.update({
        where: { id: policy.id },
        data: {
          status: "Active",
          creditcoinActivationTxHash: receipt.hash,
          verificationFailureReason: null,
          verificationFailedAt: null,
        },
      }),
      prisma.action.updateMany({
        where: { policyId: policy.id, state: { in: ["Draft", "Waiting"] } },
        data: { state: "Ready" },
      }),
    ]);

    await recordActivity(prisma, {
      policyId: policy.id,
      type: "PolicyVerifiedOnCreditcoin",
      actor: "system",
      network: "creditcoin_cc3",
      txHash: receipt.hash,
      humanReadableMessage: activityMessage.PolicyVerifiedOnCreditcoin({ creditcoinTxHash: receipt.hash }),
      technicalDetails: { mode: env.ATTESTCOIN_MODE, proofRef: outcome.proofRef },
    });
    log.info({ policyId: policy.id, txHash: receipt.hash }, "Policy activated on Creditcoin CC3");
  } catch (error) {
    const errorName = decodeCustomErrorName(executor, error);
    const reason = resolveRejectionReason(errorName) ?? "Source transaction failed";
    await prisma.policy.update({
      where: { id: policy.id },
      data: { status: "AwaitingEvidence", verificationFailureReason: reason, verificationFailedAt: new Date() },
    });
    await recordActivity(prisma, {
      policyId: policy.id,
      type: "ActionBlocked",
      actor: "system",
      network: "creditcoin_cc3",
      rejectionReason: reason,
      humanReadableMessage: activityMessage.ActionBlocked({ actionLabel: null, reason }),
      technicalDetails: { contractError: errorName, mode: env.ATTESTCOIN_MODE, message: String(error) },
    });
    log.error({ err: error, policyId: policy.id, errorName }, "activatePolicy submission failed");
  }
}

async function tick(): Promise<void> {
  const policies = await prisma.policy.findMany({
    where: {
      status: { in: ["ApprovedOnEthereum", "AwaitingEvidence", "Verifying"] },
      creditcoinActivationTxHash: null,
    },
    include: { actions: true },
  });

  for (const policy of policies) {
    try {
      await activate(policy);
    } catch (error) {
      log.error({ err: error, policyId: policy.id }, "Attestcoin worker tick failed for policy");
    }
  }
}

export function startAttestcoinWorker(): PollingLoopHandle {
  return startPollingLoop("attestcoinWorker", env.ATTESTCOIN_WORKER_POLL_INTERVAL_MS, tick);
}
