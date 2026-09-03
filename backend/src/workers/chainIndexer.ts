import { Interface, type Log, type TransactionResponse } from "ethers";
import { prisma } from "../prisma";
import { childLogger } from "../logger";
import { env } from "../env";
import { recordActivity } from "../lib/activityLog";
import { activityMessage } from "../domain/activityMessages";
import { resolveRejectionReason } from "../domain/rejectionReasons";
import { decodeCustomErrorName } from "../lib/decodeRevert";
import { getCreditcoinProvider } from "../chain/clients";
import { getSafeRootPolicyExecutorReadContract } from "../chain/contracts";
import { loadContractSetup } from "../chain/deployments";
import { startPollingLoop, type PollingLoopHandle } from "./loop";

const log = childLogger("chainIndexer");
const CURSOR_KEY = "chainIndexer";
const MAX_BLOCK_RANGE = 2000;
const INITIAL_LOOKBACK_BLOCKS = 2000;

async function getCursor(currentBlock: bigint): Promise<bigint> {
  const existing = await prisma.workerCursor.findUnique({ where: { key: CURSOR_KEY } });
  if (existing) return existing.blockNumber;
  const startBlock = currentBlock > BigInt(INITIAL_LOOKBACK_BLOCKS) ? currentBlock - BigInt(INITIAL_LOOKBACK_BLOCKS) : 0n;
  await prisma.workerCursor.create({ data: { key: CURSOR_KEY, blockNumber: startBlock } });
  return startBlock;
}

async function saveCursor(blockNumber: bigint): Promise<void> {
  await prisma.workerCursor.update({ where: { key: CURSOR_KEY }, data: { blockNumber } });
}

async function handlePolicyActivated(log_: Log, iface: Interface): Promise<void> {
  const parsed = iface.parseLog(log_);
  if (!parsed) return;
  const policyId = parsed.args.policyId as string;
  const version = Number(parsed.args.version as bigint);

  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) return;

  if (policy.status !== "Active" || policy.version !== version) {
    await prisma.$transaction([
      prisma.policy.update({
        where: { id: policyId },
        data: {
          status: "Active",
          version,
          creditcoinActivationTxHash: policy.creditcoinActivationTxHash ?? log_.transactionHash,
        },
      }),
      prisma.action.updateMany({
        where: { policyId, state: { in: ["Draft", "Waiting"] } },
        data: { state: "Ready" },
      }),
    ]);
  }

  const alreadyLogged = await prisma.activityEvent.findFirst({
    where: { policyId, type: "PolicyVerifiedOnCreditcoin", txHash: log_.transactionHash },
  });
  if (!alreadyLogged) {
    await recordActivity(prisma, {
      policyId,
      type: "PolicyVerifiedOnCreditcoin",
      actor: "system",
      network: "creditcoin_cc3",
      txHash: log_.transactionHash,
      humanReadableMessage: activityMessage.PolicyVerifiedOnCreditcoin({ creditcoinTxHash: log_.transactionHash }),
      technicalDetails: { observedVia: "chainIndexer", version },
    });
  }
}

async function handleActionExecuted(log_: Log, iface: Interface): Promise<void> {
  const parsed = iface.parseLog(log_);
  if (!parsed) return;
  const policyId = parsed.args.policyId as string;
  const actionId = parsed.args.actionId as string;
  const success = parsed.args.success as boolean;

  const action = await prisma.action.findUnique({ where: { id: actionId } });
  if (!action || action.policyId !== policyId) return;
  if (action.executionTxHash === log_.transactionHash) return;

  if (success) {
    await prisma.action.update({
      where: { id: actionId },
      data: { state: "Executed", executionTxHash: log_.transactionHash },
    });
    await recordActivity(prisma, {
      policyId,
      actionId,
      type: "ActionExecuted",
      actor: "system",
      network: "creditcoin_cc3",
      txHash: log_.transactionHash,
      humanReadableMessage: activityMessage.ActionExecuted({
        actionLabel: action.label,
        creditcoinTxHash: log_.transactionHash,
      }),
      technicalDetails: { observedVia: "chainIndexer" },
    });
  } else {
    await prisma.action.update({ where: { id: actionId }, data: { state: "Blocked", executionTxHash: log_.transactionHash } });
    await recordActivity(prisma, {
      policyId,
      actionId,
      type: "ActionBlocked",
      actor: "system",
      network: "creditcoin_cc3",
      txHash: log_.transactionHash,
      rejectionReason: "Wrong target",
      humanReadableMessage: `Action "${action.label}" reached its target but the underlying call failed. No approved boundary was violated by the relayer.`,
      technicalDetails: { observedVia: "chainIndexer", note: "downstream target call returned success=false" },
    });
  }
}

async function handleGuardianPaused(log_: Log, iface: Interface): Promise<void> {
  const parsed = iface.parseLog(log_);
  if (!parsed) return;
  const policyId = parsed.args.policyId as string;
  const guardian = parsed.args.guardian as string;
  const reason = parsed.args.reason as string;

  const alreadyLogged = await prisma.activityEvent.findFirst({
    where: { policyId, type: "GuardianPauseActivated", txHash: log_.transactionHash },
  });
  if (alreadyLogged) return;

  await prisma.$transaction([
    prisma.policy.update({
      where: { id: policyId },
      data: { status: "Paused", guardianAddress: guardian, guardianPauseReason: reason, guardianPausedAt: new Date() },
    }),
    prisma.action.updateMany({
      where: { policyId, state: { in: ["Draft", "Waiting", "Ready"] } },
      data: { state: "Paused" },
    }),
  ]);

  await recordActivity(prisma, {
    policyId,
    type: "GuardianPauseActivated",
    actor: guardian,
    network: "creditcoin_cc3",
    txHash: log_.transactionHash,
    humanReadableMessage: activityMessage.GuardianPauseActivated({ guardianAddress: guardian, reason }),
    technicalDetails: { observedVia: "chainIndexer" },
  });
}

async function scanFailedExecuteActionAttempts(fromBlock: bigint, toBlock: bigint): Promise<void> {
  const { deployments } = loadContractSetup();
  const executorAddress = deployments.creditcoinCc3.safeRootPolicyExecutor.toLowerCase();
  const provider = getCreditcoinProvider();
  const executor = getSafeRootPolicyExecutorReadContract();

  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    const block = await provider.getBlock(Number(blockNumber), true);
    if (!block) continue;

    const transactions = block.prefetchedTransactions as TransactionResponse[] | undefined;
    if (!transactions || transactions.length === 0) continue;

    for (const tx of transactions) {
      if (!tx.to || tx.to.toLowerCase() !== executorAddress) continue;

      let decoded: ReturnType<Interface["decodeFunctionData"]> | null = null;
      try {
        decoded = executor.interface.decodeFunctionData("executeAction", tx.data);
      } catch {
        continue;
      }

      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt || receipt.status !== 0) continue;

      const alreadyLogged = await prisma.activityEvent.findFirst({ where: { txHash: tx.hash, type: "ActionBlocked" } });
      if (alreadyLogged) continue;

      const [policyId, actionId, target, selector, params, nativeValue] = decoded as unknown as [
        string,
        string,
        string,
        string,
        string,
        bigint,
      ];

      let errorName: string | null = null;
      try {
        await provider.call({
          to: tx.to,
          from: tx.from,
          data: tx.data,
          value: tx.value,
          blockTag: Number(blockNumber - 1n),
        });
      } catch (error) {
        errorName = decodeCustomErrorName(executor, error);
      }
      const reason = resolveRejectionReason(errorName) ?? "Wrong target";

      const approvedAction = await prisma.action.findUnique({ where: { id: actionId } });

      await recordActivity(prisma, {
        policyId,
        actionId: approvedAction ? actionId : null,
        type: "ActionBlocked",
        actor: tx.from,
        network: "creditcoin_cc3",
        txHash: tx.hash,
        rejectionReason: reason,
        humanReadableMessage: activityMessage.ActionBlocked({
          actionLabel: approvedAction?.label ?? null,
          reason,
        }),
        technicalDetails: {
          observedVia: "chainIndexer",
          contractError: errorName,
          approved: approvedAction
            ? {
                targetContract: approvedAction.targetContract,
                functionSelector: approvedAction.functionSelector,
                encodedParams: approvedAction.encodedParams,
                nativeValue: approvedAction.nativeValue,
              }
            : null,
          submitted: { target, selector, params, nativeValue: nativeValue.toString() },
        },
      });

      log.warn({ policyId, actionId, txHash: tx.hash, reason }, "Recorded blocked/tampered executeAction attempt");
    }
  }
}

async function sweepExpiredPolicies(): Promise<void> {
  const now = new Date();
  const candidates = await prisma.policy.findMany({
    where: {
      status: { in: ["Active", "Verifying", "AwaitingEvidence", "ApprovedOnEthereum"] },
      expiryTime: { lt: now },
    },
    include: { actions: true },
  });

  for (const policy of candidates) {
    const alreadyLogged = await prisma.activityEvent.findFirst({ where: { policyId: policy.id, type: "PolicyExpired" } });
    if (alreadyLogged) continue;

    await prisma.action.updateMany({
      where: { policyId: policy.id, state: { in: ["Draft", "Waiting", "Ready"] } },
      data: { state: "Expired" },
    });

    await recordActivity(prisma, {
      policyId: policy.id,
      type: "PolicyExpired",
      actor: "system",
      network: "creditcoin_cc3",
      humanReadableMessage: activityMessage.PolicyExpired({ policyName: policy.name }),
      technicalDetails: {},
    });
  }
}

async function tick(): Promise<void> {
  const provider = getCreditcoinProvider();
  const { deployments, safeRootPolicyExecutorAbi } = loadContractSetup();
  const iface = new Interface(safeRootPolicyExecutorAbi as string[]);

  const currentBlock = BigInt(await provider.getBlockNumber());
  const cursor = await getCursor(currentBlock);
  if (cursor >= currentBlock) {
    await sweepExpiredPolicies();
    return;
  }

  const fromBlock = cursor + 1n;
  const toBlock = fromBlock + BigInt(MAX_BLOCK_RANGE) - 1n < currentBlock ? fromBlock + BigInt(MAX_BLOCK_RANGE) - 1n : currentBlock;

  const logs = await provider.getLogs({
    address: deployments.creditcoinCc3.safeRootPolicyExecutor,
    fromBlock,
    toBlock,
  });

  for (const entry of logs) {
    const parsed = iface.parseLog(entry);
    if (!parsed) continue;
    try {
      if (parsed.name === "PolicyActivated") await handlePolicyActivated(entry, iface);
      else if (parsed.name === "ActionExecuted") await handleActionExecuted(entry, iface);
      else if (parsed.name === "GuardianPaused") await handleGuardianPaused(entry, iface);
    } catch (error) {
      log.error({ err: error, event: parsed.name, txHash: entry.transactionHash }, "Failed to process chain event");
    }
  }

  try {
    await scanFailedExecuteActionAttempts(fromBlock, toBlock);
  } catch (error) {
    log.error({ err: error }, "Failed to scan for blocked executeAction attempts");
  }

  await saveCursor(toBlock);
  await sweepExpiredPolicies();
}

export function startChainIndexer(): PollingLoopHandle {
  return startPollingLoop("chainIndexer", env.CHAIN_INDEXER_POLL_INTERVAL_MS, tick);
}
