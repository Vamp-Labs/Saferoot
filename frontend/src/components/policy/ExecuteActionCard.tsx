"use client";

import { useState } from "react";
import { useConnection, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Address, Hex } from "viem";
import type { Action, Policy } from "@/domain/types";
import { CC3_CHAIN_ID } from "@/lib/chains";
import { deployments, deploymentsArePlaceholder } from "@/lib/contracts/addresses";
import { safeRootPolicyExecutorAbi } from "@/lib/contracts/abi";
import { formatCountdown, truncateAddress } from "@/lib/format";
import { actionStateLanguage } from "@/domain/statusLanguage";
import { Badge, Callout } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Surfaces";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CopyableAddress } from "@/components/ui/CopyableAddress";

interface ExecuteActionCardProps {
  policy: Policy;
  action: Action;
  onExecuted: (actionId: string, txHash: string) => void;
}

export function ExecuteActionCard({ policy, action, onExecuted }: ExecuteActionCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const connection = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync, isPending, error, data: txHash, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: CC3_CHAIN_ID });

  const isReady = action.state === "Ready";
  const status = actionStateLanguage[action.state];

  async function handleExecute() {
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
          action.encodedParams as Hex,
          BigInt(action.nativeValue || "0"),
        ],
        value: BigInt(action.nativeValue || "0"),
        chainId: CC3_CHAIN_ID,
      });
      onExecuted(action.id, hash);
      setConfirmOpen(false);
    } catch {}
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {action.templateType === "grant" ? "Contributor grant" : action.templateType === "risk_cap" ? "Risk-cap change" : "Emergency pause"}
          </p>
          <p className="mt-1 text-lg font-medium text-text-primary">{action.label}</p>
        </div>
        <Badge tone={status.tone} label={status.label} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Source authority</dt>
          <dd className="mt-1 text-sm font-medium text-text-primary">{truncateAddress(policy.authoritySafeAddress)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Destination</dt>
          <dd className="mt-1 text-sm font-medium text-text-primary">Creditcoin CC3</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Expiry</dt>
          <dd className="mt-1 text-sm font-medium text-text-primary">{formatCountdown(action.expiry)}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Relayer</dt>
          <dd className="mt-1 text-sm text-text-secondary">
            {connection.address ? truncateAddress(connection.address) : "Any connected wallet"}
          </dd>
        </div>
      </dl>

      {action.executionTxHash && (
        <p className="mt-4 text-sm text-success">
          Executed exactly as approved. <CopyableAddress address={action.executionTxHash} />
        </p>
      )}

      {isReady && (
        <div className="mt-6">
          <Button type="button" onClick={() => setConfirmOpen(true)} withArrow>
            Execute approved action
          </Button>
        </div>
      )}

      {confirmOpen && (
        <Modal title="Confirm execution" onClose={() => setConfirmOpen(false)}>
          <p className="text-sm text-text-secondary">
            You are executing an action already approved by <span className="font-medium text-text-primary">{policy.name}</span>
            &apos;s authority Safe.
          </p>

          {deploymentsArePlaceholder && (
            <div className="mt-4">
              <Callout tone="warning" title="No live executor configured">
                Set NEXT_PUBLIC_EXECUTOR_ADDRESS once contracts/deployments.json is published to send a real transaction.
              </Callout>
            </div>
          )}

          <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
            <ConfirmRow label="Action" value={action.label} />
            <ConfirmRow label="Destination" value="Creditcoin CC3" />
            <ConfirmRow label="Policy" value={`${policy.name} · v${policy.version}`} />
            <ConfirmRow label="Expiry" value={formatCountdown(action.expiry)} />
          </dl>

          {error && (
            <div className="mt-4">
              <Callout tone="danger" title="Execution failed">
                {error.message}
              </Callout>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button type="button" onClick={handleExecute} disabled={isPending || receipt.isLoading} withArrow>
              {isPending || receipt.isLoading ? "Executing…" : "Confirm and execute"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                reset();
              }}
              className="!px-5 !py-2.5"
            >
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
}
