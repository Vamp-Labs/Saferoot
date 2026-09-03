"use client";

import { useState } from "react";
import type { Policy } from "@/domain/types";
import { ExecuteActionCard } from "./ExecuteActionCard";
import { GuardianBanner } from "@/components/guardian/GuardianBanner";
import { EmptyState } from "@/components/ui/Feedback";
import { emptyStateCopy } from "@/domain/copy";
import { TextLink } from "@/components/ui/Button";

interface ExecuteScreenClientProps {
  policy: Policy;
}

export function ExecuteScreenClient({ policy }: ExecuteScreenClientProps) {
  const [actions, setActions] = useState(policy.actions);

  function handleExecuted(actionId: string, txHash: string) {
    setActions((current) =>
      current.map((action) => (action.id === actionId ? { ...action, state: "Executed", executionTxHash: txHash } : action)),
    );
  }

  const readyActions = actions.filter((action) => action.state === "Ready");
  const otherActions = actions.filter((action) => action.state !== "Ready");

  return (
    <div>
      {policy.status === "Paused" && (
        <div className="mb-8">
          <GuardianBanner />
        </div>
      )}

      {readyActions.length === 0 && otherActions.length === 0 ? (
        <EmptyState message={emptyStateCopy.noActiveActions} />
      ) : (
        <div className="flex flex-col gap-6">
          {readyActions.length === 0 && policy.status !== "Paused" && <EmptyState message={emptyStateCopy.noActiveActions} />}
          {readyActions.map((action) => (
            <ExecuteActionCard key={action.id} policy={policy} action={action} onExecuted={handleExecuted} />
          ))}
          {otherActions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Other actions</h2>
              <div className="mt-4 flex flex-col gap-4">
                {otherActions.map((action) => (
                  <ExecuteActionCard key={action.id} policy={policy} action={action} onExecuted={handleExecuted} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <TextLink href={`/policies/${policy.id}/protected`}>Attempt a tampered execution (demo)</TextLink>
      </div>
    </div>
  );
}
