"use client";

import { useEffect, useMemo, useState } from "react";
import type SafeApiKit from "@safe-global/api-kit";
import type { SafeMultisigTransactionResponse } from "@safe-global/types-kit";
import type { SafeInfo } from "@/domain/types";
import { createSafeApiKit } from "@/lib/safe/proposePolicy";
import { truncateAddress } from "@/lib/format";
import { TextLink } from "@/components/ui/Button";
import { Badge, Callout } from "@/components/ui/Feedback";

interface SafeApprovalTrackerProps {
  safeTxHash: string;
  safe: SafeInfo;
}

const POLL_INTERVAL_MS = 8000;

function safeInitApiKit(): { kit: SafeApiKit | null; unavailableReason: string | null } {
  try {
    return { kit: createSafeApiKit(), unavailableReason: null };
  } catch (error) {
    return {
      kit: null,
      unavailableReason: error instanceof Error ? error.message : "The Safe Transaction Service is not configured.",
    };
  }
}

export function SafeApprovalTracker({ safeTxHash, safe }: SafeApprovalTrackerProps) {
  const [transaction, setTransaction] = useState<SafeMultisigTransactionResponse | null>(null);
  const [errored, setErrored] = useState(false);
  const { kit: apiKit, unavailableReason } = useMemo(() => safeInitApiKit(), []);

  useEffect(() => {
    if (!apiKit) return;
    const kit = apiKit;
    let cancelled = false;

    async function poll() {
      try {
        const result = await kit.getTransaction(safeTxHash);
        if (!cancelled) {
          setTransaction(result);
          setErrored(false);
        }
      } catch {
        if (!cancelled) setErrored(true);
      }
    }

    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiKit, safeTxHash]);

  if (unavailableReason) {
    return (
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Safe approval status</h3>
        <div className="mt-4">
          <Callout tone="warning" title="Live signature progress is not available">
            {unavailableReason} SafeRoot has recorded that this policy was submitted to the Safe.
          </Callout>
        </div>
        <div className="mt-4">
          <TextLink href={`https://app.safe.global/transactions/tx?safe=sep:${safe.address}&id=${safeTxHash}`}>
            View Safe transaction
          </TextLink>
        </div>
      </div>
    );
  }

  const confirmedOwners = new Set((transaction?.confirmations ?? []).map((c) => c.owner.toLowerCase()));
  const threshold = transaction?.confirmationsRequired ?? safe.threshold;
  const thresholdReached = confirmedOwners.size >= threshold;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Safe approval status</h3>
        {thresholdReached ? (
          <Badge tone="success" label={`Threshold reached: ${threshold}-of-${safe.owners.length}`} />
        ) : (
          <Badge tone="warning" label={`${confirmedOwners.size} of ${threshold} required`} />
        )}
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-gray-100 border border-gray-200">
        {safe.owners.map((owner, index) => {
          const signed = confirmedOwners.has(owner.toLowerCase());
          const required = index < threshold || signed;
          return (
            <li key={owner} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-mono text-xs text-text-primary">
                Owner {index + 1} · {truncateAddress(owner)}
              </span>
              {signed ? (
                <Badge tone="success" label="Signed" />
              ) : required ? (
                <Badge tone="neutral" label="Not yet signed" />
              ) : (
                <Badge tone="neutral" label="Not required" />
              )}
            </li>
          );
        })}
      </ul>

      {transaction?.isExecuted && (
        <p className="mt-3 text-sm text-success">Safe transaction executed on Ethereum Sepolia.</p>
      )}
      {errored && <p className="mt-3 text-xs text-text-secondary">Could not reach the Safe Transaction Service. Retrying…</p>}

      <div className="mt-4">
        <TextLink href={`https://app.safe.global/transactions/tx?safe=sep:${safe.address}&id=${safeTxHash}`}>
          View Safe transaction
        </TextLink>
      </div>
    </div>
  );
}
