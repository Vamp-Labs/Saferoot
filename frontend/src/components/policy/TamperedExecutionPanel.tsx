"use client";

import { useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWriteContract } from "wagmi";
import { BaseError, ContractFunctionRevertedError, type Address, type Hex } from "viem";
import type { Action, Policy, RejectionReason } from "@/domain/types";
import { CC3_CHAIN_ID } from "@/lib/chains";
import { deployments, deploymentsArePlaceholder } from "@/lib/contracts/addresses";
import { contractErrorToRejectionReason, safeRootPolicyExecutorAbi } from "@/lib/contracts/abi";
import { decodeGrantParams, encodeGrantParams, formatGrantAmount } from "@/domain/actionTemplates";
import { rejectionCopyLibrary } from "@/domain/copy";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surfaces";
import { Callout } from "@/components/ui/Feedback";
import { truncateAddress } from "@/lib/format";
import { ComparisonTable, type ComparisonRow } from "./ComparisonTable";

interface TamperedExecutionPanelProps {
  policy: Policy;
  action: Action;
}

type ResultState =
  | { kind: "idle" }
  | { kind: "blocked"; reason: RejectionReason; mode: "live" | "simulated" }
  | { kind: "executed"; txHash?: string; mode: "live" | "simulated" }
  | { kind: "error"; message: string };

export function TamperedExecutionPanel({ policy, action }: TamperedExecutionPanelProps) {
  const approved = useMemo(() => decodeGrantParams(action.encodedParams as Hex), [action.encodedParams]);
  const [amountInput, setAmountInput] = useState("100000");
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const connection = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync, isPending } = useWriteContract();

  const approvedAmountLabel = `${formatGrantAmount(approved.amount)} ${action.assetLabel ?? "USDC"}`;
  const submittedAmountLabel = `${amountInput || "0"} ${action.assetLabel ?? "USDC"}`;
  const amountDiffers = formatGrantAmount(approved.amount) !== amountInput;

  async function handleAttempt() {
    setResult({ kind: "idle" });
    const tamperedParams = encodeGrantParams({
      recipientLabel: action.recipientLabel ?? "Approved recipient",
      recipientAddress: approved.recipient,
      assetSymbol: action.assetLabel ?? "USDC",
      assetDecimals: 6,
      amount: amountInput,
    });

    if (deploymentsArePlaceholder) {
      if (amountDiffers) {
        setResult({ kind: "blocked", reason: "AmountExceedsApproval", mode: "simulated" });
      } else if (action.state === "Executed") {
        setResult({ kind: "blocked", reason: "ActionAlreadyExecuted", mode: "simulated" });
      } else {
        setResult({ kind: "executed", mode: "simulated" });
      }
      return;
    }

    try {
      if (connection.chainId !== CC3_CHAIN_ID) {
        await switchChainAsync({ chainId: CC3_CHAIN_ID });
      }
      const hash = await writeContractAsync({
        abi: safeRootPolicyExecutorAbi,
        address: deployments.creditcoinCc3.safeRootPolicyExecutor,
        functionName: "executeAction",
        args: [
          policy.id as Hex,
          action.id as Hex,
          action.targetContract as Address,
          action.functionSelector as Hex,
          tamperedParams,
          BigInt(action.nativeValue || "0"),
        ],
        value: BigInt(action.nativeValue || "0"),
        chainId: CC3_CHAIN_ID,
      });
      setResult({ kind: "executed", txHash: hash, mode: "live" });
    } catch (error) {
      let errorName: string | null = null;
      if (error instanceof BaseError) {
        const revertError = error.walk((err) => err instanceof ContractFunctionRevertedError);
        if (revertError instanceof ContractFunctionRevertedError) {
          errorName = revertError.data?.errorName ?? null;
        }
      }
      const reason = errorName ? contractErrorToRejectionReason[errorName] : null;
      if (reason) {
        setResult({ kind: "blocked", reason: reason as RejectionReason, mode: "live" });
      } else {
        setResult({ kind: "error", message: error instanceof Error ? error.message : "Execution failed." });
      }
    }
  }

  const rows: ComparisonRow[] = [
    { field: "Recipient", approved: action.recipientLabel ?? truncateAddress(approved.recipient), submitted: action.recipientLabel ?? truncateAddress(approved.recipient), differs: false },
    { field: "Amount", approved: approvedAmountLabel, submitted: submittedAmountLabel, differs: amountDiffers },
    { field: "Target", approved: truncateAddress(action.targetContract), submitted: truncateAddress(action.targetContract), differs: false },
  ];

  const blockedCopy = result.kind === "blocked" ? rejectionCopyLibrary[result.reason] : null;
  const alteredIsBlocked = result.kind === "blocked";
  const alteredIsExecuted = result.kind === "executed";

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border border-success bg-success-tint/40 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-success">Approved action</p>
          <p className="mt-3 text-2xl font-medium text-text-primary">{approvedAmountLabel}</p>
          <p className="mt-1 text-sm text-text-secondary">to {action.recipientLabel ?? truncateAddress(approved.recipient)}</p>
          <p className="mt-4 text-sm font-semibold text-success">
            {action.state === "Executed" ? "Executed" : "Matches the Safe-approved policy"}
          </p>
        </div>
        <div className={`border p-6 ${alteredIsBlocked ? "border-danger bg-danger-tint/40" : "border-gray-200 bg-tribe-gray/40"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${alteredIsBlocked ? "text-danger" : "text-text-secondary"}`}>
            Altered action
          </p>
          <p className="mt-3 text-2xl font-medium text-text-primary">{submittedAmountLabel}</p>
          <p className="mt-1 text-sm text-text-secondary">to {action.recipientLabel ?? truncateAddress(approved.recipient)}</p>
          <p className={`mt-4 text-sm font-semibold ${alteredIsBlocked ? "text-danger" : alteredIsExecuted ? "text-success" : "text-text-secondary"}`}>
            {alteredIsBlocked ? "Blocked — no funds moved" : alteredIsExecuted ? "Executed" : "Not yet attempted"}
          </p>
        </div>
      </div>

      {blockedCopy && (
        <p className="text-sm font-medium text-text-primary">{blockedCopy.headline.replace("Execution blocked — ", "")}</p>
      )}

    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Level 3 — Adversarial control</p>
      <h3 className="mt-1 text-lg font-medium text-text-primary">Attempt a tampered execution</h3>
      <p className="mt-2 max-w-xl text-sm text-text-secondary">
        Submit {action.label.toLowerCase()} with an altered amount. SafeRoot enforces the boundaries the Safe approved — this
        control lets you prove that live, not just in the abstract.
      </p>

      {deploymentsArePlaceholder && (
        <div className="mt-4">
          <Callout tone="warning" title="Simulated mode">
            No live executor is configured (NEXT_PUBLIC_EXECUTOR_ADDRESS). This attempt will be evaluated locally against the
            same rule the contract enforces, without sending a transaction.
          </Callout>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="font-medium text-text-primary">Submitted amount</span>
          <input
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            inputMode="decimal"
            className="focus-ring mt-1.5 block w-40 border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <Button type="button" variant="danger" onClick={handleAttempt} disabled={isPending}>
          {isPending ? "Submitting…" : "Attempt execution"}
        </Button>
      </div>

      {result.kind !== "idle" && (
        <div className="mt-6">
          <ComparisonTable rows={rows} result={result.kind === "executed" ? "Executed" : "Blocked"} />
        </div>
      )}

      {result.kind === "blocked" && blockedCopy && (
        <div className="mt-4">
          <Callout tone="danger" title={blockedCopy.headline}>
            {blockedCopy.lines[0]}
            {result.mode === "simulated" && <span className="block mt-1 text-xs">(Simulated — no live contracts configured.)</span>}
          </Callout>
        </div>
      )}

      {result.kind === "executed" && (
        <div className="mt-4">
          <Callout tone="success" title="Executed exactly as approved">
            {amountDiffers
              ? "The submitted amount matched what the contract allowed — try a larger change to see a rejection."
              : "This attempt matched the Safe-approved policy exactly."}
            {result.mode === "simulated" && <span className="block mt-1 text-xs">(Simulated — no live contracts configured.)</span>}
          </Callout>
        </div>
      )}

      {result.kind === "error" && (
        <div className="mt-4">
          <Callout tone="danger" title="Could not submit this attempt">
            {result.message}
          </Callout>
        </div>
      )}
    </Card>
    </div>
  );
}
