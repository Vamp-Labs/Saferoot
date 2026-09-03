import type { ActivityEvent } from "@/domain/types";
import { apiFetch, withFixtureFallback, type WithSource } from "./client";
import { fixtureActivity } from "./fixtures";

export async function fetchActivity(policyId?: string): Promise<WithSource<ActivityEvent[]>> {
  const query = policyId ? `?policyId=${encodeURIComponent(policyId)}` : "";
  return withFixtureFallback(
    () => apiFetch<{ activity: ActivityEvent[] }>(`/activity${query}`).then((response) => response.activity),
    () => (policyId ? fixtureActivity.filter((event) => event.policyId === policyId) : fixtureActivity),
  );
}
