import type { ActivityEvent } from "@/domain/types";
import { apiFetch, withFixtureFallback, type WithSource } from "./client";
import { fixtureActivity } from "./fixtures";

export async function fetchActivity(policyId?: string): Promise<WithSource<ActivityEvent[]>> {
  const query = policyId ? `?policyId=${encodeURIComponent(policyId)}` : "";
  return withFixtureFallback(
    () => apiFetch<ActivityEvent[]>(`/activity${query}`),
    () => (policyId ? fixtureActivity.filter((event) => event.policyId === policyId) : fixtureActivity),
  );
}
