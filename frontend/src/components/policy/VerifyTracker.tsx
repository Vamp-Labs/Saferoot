"use client";

import { useEffect, useState } from "react";
import type { Policy } from "@/domain/types";
import { fetchPolicyDetail } from "@/lib/api/policies";
import { formatDateTime } from "@/lib/format";
import { ProgressTracker, type TrackerStep } from "@/components/ui/ProgressTracker";
import { Callout } from "@/components/ui/Feedback";
import { Disclosure } from "@/components/ui/Disclosure";
import { waitingStateCopy } from "@/domain/copy";

interface VerifyTrackerProps {
  initialPolicy: Policy;
}

const POLL_INTERVAL_MS = 6000;

export function VerifyTracker({ initialPolicy }: VerifyTrackerProps) {
  const [policy, setPolicy] = useState(initialPolicy);

  useEffect(() => {
    let cancelled = false;
    const interval = window.setInterval(async () => {
      const { data } = await fetchPolicyDetail(policy.id);
      if (data && !cancelled) setPolicy(data);
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [policy.id]);

  const safeApproved = policy.status !== "Draft" && policy.status !== "AwaitingApproval";
  const ethereumConfirmed = Boolean(policy.ethereumTxHash);
  const evidenceAvailable = Boolean(policy.attestcoinProofRef);
  const verifiedOnCreditcoin = Boolean(policy.creditcoinActivationTxHash);

  const failedExpiredBeforeActivation = policy.status === "Expired" && !verifiedOnCreditcoin;
  const superseded = policy.status === "Superseded";

  function stepStatus(complete: boolean, isCurrent: boolean): TrackerStep["status"] {
    if (failedExpiredBeforeActivation || superseded) {
      return complete ? "complete" : isCurrent ? "failed" : "pending";
    }
    if (complete) return "complete";
    if (isCurrent) return "current";
    return "pending";
  }

  const steps: TrackerStep[] = [
    {
      label: "Safe approved",
      status: stepStatus(safeApproved, !safeApproved),
      detail: !safeApproved ? waitingStateCopy.ethereumConfirmation : undefined,
    },
    {
      label: "Ethereum confirmed",
      status: stepStatus(ethereumConfirmed, safeApproved && !ethereumConfirmed),
    },
    {
      label: "Attestcoin evidence available",
      status: stepStatus(evidenceAvailable, ethereumConfirmed && !evidenceAvailable),
      detail: ethereumConfirmed && !evidenceAvailable ? waitingStateCopy.attestationWaiting : undefined,
    },
    {
      label: "Verified on Creditcoin",
      status: stepStatus(verifiedOnCreditcoin, evidenceAvailable && !verifiedOnCreditcoin),
      detail: evidenceAvailable && !verifiedOnCreditcoin ? waitingStateCopy.creditcoinVerification : undefined,
    },
  ];

  return (
    <div>
      <ProgressTracker steps={steps} />

      <p className="mt-2 text-xs text-text-secondary">Status last changed {formatDateTime(policy.updatedAt)}.</p>

      {verifiedOnCreditcoin && !failedExpiredBeforeActivation && !superseded && (
        <div className="mt-8">
          <Callout tone="success" title="Policy active">
            This policy is verified on Creditcoin and its actions are ready to execute.
          </Callout>
        </div>
      )}

      {failedExpiredBeforeActivation && (
        <div className="mt-8">
          <Callout tone="danger" title="Execution window ended">
            This policy expired before verification completed. Create a new Safe-approved policy to continue — no action can
            be taken on this one.
          </Callout>
        </div>
      )}

      {superseded && (
        <div className="mt-8">
          <Callout tone="neutral" title="Policy replaced">
            A newer Safe-approved policy is active. This older version cannot activate or execute.
          </Callout>
        </div>
      )}

      <div className="mt-8">
        <Disclosure label="View technical proof" levelLabel="Level 3">
          <dl className="space-y-1.5 font-mono text-xs">
            <Row label="Ethereum transaction" value={policy.ethereumTxHash ?? "Not yet available"} />
            <Row label="Policy version" value={String(policy.version)} />
            <Row label="Attestcoin proof reference" value={policy.attestcoinProofRef ?? "Not yet available"} />
            <Row label="Creditcoin activation transaction" value={policy.creditcoinActivationTxHash ?? "Not yet available"} />
            <Row label="Executor" value={policy.executorAddress} />
          </dl>
        </Disclosure>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="max-w-[65%] truncate text-right text-text-primary" title={value}>
        {value}
      </dd>
    </div>
  );
}
