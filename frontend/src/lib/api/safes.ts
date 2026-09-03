import type { SafeInfo } from "@/domain/types";
import { apiFetch, withFixtureFallback, type WithSource } from "./client";
import { fixtureSafe } from "./fixtures";

export async function fetchSafeInfo(address: string): Promise<WithSource<SafeInfo>> {
  return withFixtureFallback(
    () => apiFetch<SafeInfo>(`/safes/${address}`),
    () => ({ ...fixtureSafe, address }),
  );
}
