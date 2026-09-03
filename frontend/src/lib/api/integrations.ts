import type { Integration } from "@/domain/types";
import { apiFetch, withFixtureFallback, type WithSource } from "./client";
import { fixtureIntegration } from "./fixtures";

export async function fetchIntegrations(): Promise<WithSource<Integration[]>> {
  return withFixtureFallback(
    () => apiFetch<Integration[]>("/integrations"),
    () => [fixtureIntegration],
  );
}
