import { API_BASE_URL, hasLiveApi } from "../env";

export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

export interface WithSource<T> {
  data: T;
  isLive: boolean;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasLiveApi) {
    throw new ApiUnavailableError("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiUnavailableError(`Could not reach SafeRoot API at ${API_BASE_URL}${path}`);
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApiUnavailableError(`SafeRoot API ${response.status}: ${body || response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function withFixtureFallback<T>(
  live: () => Promise<T>,
  fixture: () => T,
): Promise<WithSource<T>> {
  try {
    const data = await live();
    return { data, isLive: true };
  } catch {
    return { data: fixture(), isLive: false };
  }
}
