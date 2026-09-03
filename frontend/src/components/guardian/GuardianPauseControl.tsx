"use client";

import { useState } from "react";
import { useConnection, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { Hex } from "viem";
import { CC3_CHAIN_ID } from "@/lib/chains";
import { deployments, deploymentsArePlaceholder } from "@/lib/contracts/addresses";
import { safeRootPolicyExecutorAbi } from "@/lib/contracts/abi";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { guardianPauseCopy } from "@/domain/copy";
import { identityPresentation } from "@/domain/identity";

interface GuardianPauseControlProps {
  policyId: Hex;
  policyName: string;
}

export function GuardianPauseControl({ policyId, policyName }: GuardianPauseControlProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const connection = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync, isPending, error, data: txHash, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash, chainId: CC3_CHAIN_ID });

  async function handleConfirm() {
    if (!reason.trim() || !confirmed) return;
    try {
      if (connection.chainId !== CC3_CHAIN_ID) {
        await switchChainAsync({ chainId: CC3_CHAIN_ID });
      }
      await writeContractAsync({
        abi: safeRootPolicyExecutorAbi,
        address: deployments.creditcoinCc3.safeRootPolicyExecutor,
        functionName: "guardianPause",
        args: [policyId, reason.trim()],
        chainId: CC3_CHAIN_ID,
      });
    } catch {}
  }

  function handleClose() {
    setOpen(false);
    setReason("");
    setConfirmed(false);
    reset();
  }

  return (
    <div>
      <p className="text-xs text-text-secondary">{identityPresentation.guardian.description}</p>
      <Button type="button" variant="danger" onClick={() => setOpen(true)} className="mt-3 !px-4 !py-2">
        Pause all remaining actions
      </Button>

      {open && (
        <Modal title={guardianPauseCopy.confirmationHeadline} onClose={handleClose}>
          {deploymentsArePlaceholder && (
            <Callout tone="warning" title="No live executor configured">
              Set NEXT_PUBLIC_EXECUTOR_ADDRESS once contracts/deployments.json is published to send a real transaction.
            </Callout>
          )}
          <p className="mt-3 text-sm text-text-secondary">{guardianPauseCopy.confirmationBody}</p>

          <label className="mt-5 block text-sm">
            <span className="font-medium text-text-primary">Incident reason</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="focus-ring mt-1.5 w-full border border-gray-300 px-3 py-2 text-sm"
              placeholder="Describe the incident that requires pausing this policy"
            />
          </label>

          <label className="mt-4 flex items-start gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="focus-ring mt-0.5 h-4 w-4"
            />
            <span>
              I confirm this pauses <span className="font-medium">{policyName}</span>.
            </span>
          </label>

          {error && (
            <div className="mt-4">
              <Callout tone="danger" title="Guardian pause failed">
                {error.message}
              </Callout>
            </div>
          )}

          {receipt.isSuccess && (
            <div className="mt-4">
              <Callout tone="success" title="Guardian pause submitted">
                This policy&apos;s remaining actions will show as paused once Creditcoin confirms the transaction.
              </Callout>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirm}
              disabled={!reason.trim() || !confirmed || isPending || receipt.isLoading}
              className="!px-5 !py-2.5"
            >
              {isPending || receipt.isLoading ? "Pausing…" : "Confirm pause"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose} className="!px-5 !py-2.5">
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
