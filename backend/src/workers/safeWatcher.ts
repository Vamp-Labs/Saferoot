import { prisma } from "../prisma";
import { childLogger } from "../logger";
import { fetchMultisigTransaction } from "../safe/safeTransactionService";
import { recordActivity } from "../lib/activityLog";
import { activityMessage } from "../domain/activityMessages";
import { startPollingLoop, type PollingLoopHandle } from "./loop";
import { env } from "../env";

const log = childLogger("safeWatcher");

async function processPolicy(policyId: string, safeTxHash: string): Promise<void> {
  const tx = await fetchMultisigTransaction(safeTxHash);
  if (!tx) {
    log.debug({ policyId, safeTxHash }, "Safe transaction not yet visible in Transaction Service");
    return;
  }

  const alreadyLoggedSigners = new Set(
    (
      await prisma.activityEvent.findMany({
        where: { policyId, type: "SafeSignatureAdded" },
        select: { technicalDetails: true },
      })
    ).map((event) => (event.technicalDetails as { signer?: string }).signer),
  );

  for (const confirmation of tx.confirmations) {
    if (alreadyLoggedSigners.has(confirmation.owner)) continue;
    await recordActivity(prisma, {
      policyId,
      type: "SafeSignatureAdded",
      actor: confirmation.owner,
      network: "ethereum_sepolia",
      humanReadableMessage: activityMessage.SafeSignatureAdded({
        signerAddress: confirmation.owner,
        confirmations: tx.confirmations.length,
        threshold: tx.confirmationsRequired,
      }),
      technicalDetails: { signer: confirmation.owner, safeTxHash },
    });
  }

  if (tx.confirmations.length >= tx.confirmationsRequired) {
    const thresholdAlreadyLogged = await prisma.activityEvent.findFirst({
      where: { policyId, type: "SafeThresholdReached" },
    });
    if (!thresholdAlreadyLogged) {
      await recordActivity(prisma, {
        policyId,
        type: "SafeThresholdReached",
        actor: "system",
        network: "ethereum_sepolia",
        humanReadableMessage: activityMessage.SafeThresholdReached({ threshold: tx.confirmationsRequired }),
        technicalDetails: { safeTxHash },
      });
    }
  }

  if (!tx.isExecuted) return;

  if (tx.isSuccessful && tx.transactionHash) {
    await prisma.policy.update({
      where: { id: policyId },
      data: { status: "ApprovedOnEthereum", ethereumTxHash: tx.transactionHash },
    });
    const alreadyLogged = await prisma.activityEvent.findFirst({
      where: { policyId, type: "SourceTransactionExecuted" },
    });
    if (!alreadyLogged) {
      await recordActivity(prisma, {
        policyId,
        type: "SourceTransactionExecuted",
        actor: "system",
        network: "ethereum_sepolia",
        txHash: tx.transactionHash,
        humanReadableMessage: activityMessage.SourceTransactionExecuted({ ethereumTxHash: tx.transactionHash }),
        technicalDetails: { safeTxHash },
      });
    }
    log.info({ policyId, ethereumTxHash: tx.transactionHash }, "Safe transaction executed successfully");
    return;
  }

  if (tx.isSuccessful === false) {
    const alreadyLogged = await prisma.activityEvent.findFirst({
      where: { policyId, type: "ActionBlocked", rejectionReason: "Source transaction failed" },
    });
    if (!alreadyLogged) {
      await prisma.policy.update({
        where: { id: policyId },
        data: { verificationFailureReason: "Source transaction failed", verificationFailedAt: new Date() },
      });
      await recordActivity(prisma, {
        policyId,
        type: "ActionBlocked",
        actor: "system",
        network: "ethereum_sepolia",
        txHash: tx.transactionHash,
        rejectionReason: "Source transaction failed",
        humanReadableMessage: activityMessage.ActionBlocked({ actionLabel: null, reason: "Source transaction failed" }),
        technicalDetails: { safeTxHash },
      });
      log.warn({ policyId, safeTxHash }, "Safe transaction executed but reverted on Ethereum Sepolia");
    }
  }
}

async function tick(): Promise<void> {
  const policies = await prisma.policy.findMany({
    where: { status: "AwaitingApproval", safeTxHash: { not: null } },
    select: { id: true, safeTxHash: true },
  });

  for (const policy of policies) {
    if (!policy.safeTxHash) continue;
    try {
      await processPolicy(policy.id, policy.safeTxHash);
    } catch (error) {
      log.error({ err: error, policyId: policy.id }, "Failed to process Safe watcher tick for policy");
    }
  }
}

export function startSafeWatcher(): PollingLoopHandle {
  return startPollingLoop("safeWatcher", env.SAFE_WATCHER_POLL_INTERVAL_MS, tick);
}
