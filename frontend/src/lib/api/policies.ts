import { keccak256, toHex } from "viem";
import type { Policy, PoliciesGrouped } from "@/domain/types";
import { apiFetch, withFixtureFallback, type WithSource } from "./client";
import { fixturePoliciesGrouped, fixturePolicyById, fixturePolicies, fixtureIntegration } from "./fixtures";

export async function fetchPoliciesGrouped(): Promise<WithSource<PoliciesGrouped>> {
  return withFixtureFallback(
    () => apiFetch<PoliciesGrouped>("/policies"),
    () => fixturePoliciesGrouped,
  );
}

export async function fetchPolicyDetail(id: string): Promise<WithSource<Policy | null>> {
  return withFixtureFallback(
    () => apiFetch<Policy>(`/policies/${id}`),
    () => fixturePolicyById(id) ?? fixturePolicies[0],
  );
}

export interface CreatePolicyPayload {
  name: string;
  actions: Array<{
    templateType: Policy["actions"][number]["templateType"];
    label: string;
    targetContract: string;
    functionSelector: string;
    encodedParams: string;
    nativeValue: string;
    earliestExecution: string;
    expiry: string;
  }>;
  activationTime: string;
  expiryTime: string;
  authoritySafeAddress: string;
}

export async function createDraftPolicy(payload: CreatePolicyPayload): Promise<WithSource<Policy>> {
  return withFixtureFallback(
    () =>
      apiFetch<Policy>("/policies", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    () => {
      const seed = `local-draft-${payload.name}-${Date.now()}`;
      const policyId = keccak256(toHex(seed));
      return {
        id: policyId,
        name: payload.name,
        version: 1,
        authoritySafeAddress: payload.authoritySafeAddress,
        authoritySafeChainId: 11155111,
        destinationChainId: 102031,
        executorAddress: fixtureIntegration.executorAddress,
        activationTime: payload.activationTime,
        expiryTime: payload.expiryTime,
        status: "Draft",
        safeTxHash: null,
        ethereumTxHash: null,
        attestcoinProofRef: null,
        creditcoinActivationTxHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actions: payload.actions.map((action, index) => ({
          id: keccak256(toHex(`${seed}-action-${index}`)),
          policyId,
          state: "Draft" as const,
          executionTxHash: null,
          ...action,
        })),
      };
    },
  );
}

export async function linkSafeTransaction(policyId: string, safeTxHash: string): Promise<void> {
  await apiFetch<void>(`/policies/${policyId}/link-safe-tx`, {
    method: "POST",
    body: JSON.stringify({ safeTxHash }),
  }).catch(() => undefined);
}
