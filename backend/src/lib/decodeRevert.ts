import type { Contract } from "ethers";

interface MaybeCallException {
  data?: string;
  error?: { data?: string };
  info?: { error?: { data?: string } };
}

export function extractRevertData(error: unknown): string | null {
  const candidate = error as MaybeCallException;
  return candidate?.data ?? candidate?.error?.data ?? candidate?.info?.error?.data ?? null;
}

export function decodeCustomErrorName(contract: Contract, error: unknown): string | null {
  const data = extractRevertData(error);
  if (!data) return null;
  try {
    const parsed = contract.interface.parseError(data);
    return parsed?.name ?? null;
  } catch {
    return null;
  }
}
