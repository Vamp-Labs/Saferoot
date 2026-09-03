"use client";

import { useEffect, useState } from "react";
import { useConnection, useSwitchChain } from "wagmi";
import type { Address, Hex } from "viem";
import type { Policy, SafeInfo } from "@/domain/types";
import { fetchPolicyDetail, linkSafeTransaction } from "@/lib/api/policies";
import { proposePolicyToSafe } from "@/lib/safe/proposePolicy";
import { deploymentsArePlaceholder } from "@/lib/contracts/addresses";
import { SEPOLIA_CHAIN_ID } from "@/lib/chains";
import { ImpactSummary } from "./ImpactSummary";
import { SafeApprovalTracker } from "./SafeApprovalTracker";
import { Card } from "@/components/ui/Surfaces";
import { Callout } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { safetyStatement, revocationWarning, waitingStateCopy } from "@/domain/copy";

interface ReviewApproveClientProps {
  initialPolicy: Policy;
  safe: SafeInfo;
}

function toUnixSeconds(iso: string): bigint {
  return BigInt(Math.floor(new Date(iso).getTime() / 1000));
}

export function ReviewApproveClient({ initialPolicy, safe }: ReviewApproveClientProps) {
  const [policy, setPolicy] = useState(initialPolicy);
  const connection = useConnection();
  const { switchChainAsync } = useSwitchChain();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelledMessage, setCancelledMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!policy.safeTxHash) return;
    const interval = window.setInterval(async () => {
      const { data } = await fetchPolicyDetail(policy.id);
      if (data) setPolicy(data);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [policy.id, policy.safeTxHash]);

  const hasGrant = policy.actions.some((a) => a.templateType === "grant");
  const hasRiskCap = policy.actions.some((a) => a.templateType === "risk_cap");
  const hasPause = policy.actions.some((a) => a.templateType === "pause");

  async function handleSubmitToSafe() {
    setErrorMessage(null);
    setCancelledMessage(null);
    if (!connection.isConnected || !connection.address || !connection.connector) {
      setErrorMessage("Connect the wallet that will co-sign this Safe transaction first.");
      return;
    }

    setSubmitting(true);
    try {
      if (connection.chainId !== SEPOLIA_CHAIN_ID) {
        await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
      }
      const provider = (await connection.connector.getProvider()) as { request: (args: { method: string; params?: unknown }) => Promise<unknown> };

      const { safeTxHash } = await proposePolicyToSafe({
        provider,
        signerAddress: connection.address as Address,
        safeAddress: policy.authoritySafeAddress as Address,
        policyId: policy.id as Hex,
        version: BigInt(policy.version),
        destinationChainId: BigInt(policy.destinationChainId),
        executor: policy.executorAddress as Address,
        activation: toUnixSeconds(policy.activationTime),
        expiry: toUnixSeconds(policy.expiryTime),
        actions: policy.actions.map((action) => ({
          actionId: action.id as Hex,
          target: action.targetContract as Address,
          selector: action.functionSelector as Hex,
          params: action.encodedParams as Hex,
          nativeValue: BigInt(action.nativeValue || "0"),
          earliestExecution: toUnixSeconds(action.earliestExecution),
          expiry: toUnixSeconds(action.expiry),
        })),
      });

      await linkSafeTransaction(policy.id, safeTxHash);
      setPolicy((current) => ({ ...current, safeTxHash, status: "AwaitingApproval" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not submit this policy to the Safe.";
      if (/reject|denied|cancel/i.test(message)) {
        setCancelledMessage(waitingStateCopy.walletCancelled);
      } else {
        setErrorMessage(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-0">
      <h1 className="text-3xl font-medium leading-tight text-text-primary md:text-4xl">Review and approve</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Understand this policy&apos;s effect before it goes to {safe.name ?? "your Safe"} for approval.
      </p>

      <Card className="mt-8">
        <ImpactSummary policy={policy} />
      </Card>

      <div className="mt-8">
        <Callout tone="info" title={safetyStatement} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {hasGrant && <Callout tone="warning" title="This policy authorizes value transfer." />}
        {hasRiskCap && <Callout tone="warning" title="This policy changes a lending risk parameter." />}
        {hasPause && <Callout tone="warning" title="This policy contains an emergency pause." />}
        <Callout tone="warning" title="Cross-chain revocation is not instantaneous.">
          {revocationWarning}
        </Callout>
      </div>

      {deploymentsArePlaceholder && (
        <div className="mt-8">
          <Callout tone="warning" title="No live PolicyRegistry configured">
            Set NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS once contracts/deployments.json is published to submit a real Safe
            transaction. Submitting now will fail at the wallet step.
          </Callout>
        </div>
      )}

      {!policy.safeTxHash ? (
        <div className="mt-10">
          {errorMessage && (
            <div className="mb-4">
              <Callout tone="danger" title="Could not submit to Safe">
                {errorMessage}
              </Callout>
            </div>
          )}
          {cancelledMessage && (
            <div className="mb-4">
              <Callout tone="neutral" title={cancelledMessage} />
            </div>
          )}
          <Button type="button" onClick={handleSubmitToSafe} disabled={submitting} withArrow>
            {submitting ? "Submitting…" : "Submit to Safe"}
          </Button>
        </div>
      ) : (
        <Card className="mt-10">
          <SafeApprovalTracker safeTxHash={policy.safeTxHash} safe={safe} />
        </Card>
      )}
    </div>
  );
}
