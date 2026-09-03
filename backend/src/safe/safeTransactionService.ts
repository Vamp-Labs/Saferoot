import axios, { type AxiosInstance } from "axios";
import { env } from "../env";
import { childLogger } from "../logger";

const log = childLogger("safeTransactionService");

export interface SafeInfo {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
}

export interface SafeConfirmation {
  owner: string;
  submissionDate: string;
  signature: string;
}

export interface SafeMultisigTransaction {
  safeTxHash: string;
  safe: string;
  isExecuted: boolean;
  isSuccessful: boolean | null;
  transactionHash: string | null;
  executionDate: string | null;
  confirmationsRequired: number;
  confirmations: SafeConfirmation[];
  to: string;
  data: string | null;
}

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (!client) {
    client = axios.create({
      baseURL: env.SAFE_TX_SERVICE_BASE_URL,
      timeout: 15_000,
      headers: env.SAFE_TX_SERVICE_API_KEY ? { Authorization: `Bearer ${env.SAFE_TX_SERVICE_API_KEY}` } : {},
    });
  }
  return client;
}

export async function fetchSafeInfo(address: string): Promise<SafeInfo> {
  const { data } = await getClient().get(`/safes/${address}/`);
  return {
    address: data.address,
    owners: data.owners,
    threshold: data.threshold,
    nonce: data.nonce,
  };
}

export async function fetchMultisigTransaction(safeTxHash: string): Promise<SafeMultisigTransaction | null> {
  try {
    const { data } = await getClient().get(`/multisig-transactions/${safeTxHash}/`);
    return {
      safeTxHash: data.safeTxHash,
      safe: data.safe,
      isExecuted: data.isExecuted,
      isSuccessful: data.isSuccessful,
      transactionHash: data.transactionHash,
      executionDate: data.executionDate,
      confirmationsRequired: data.confirmationsRequired,
      confirmations: (data.confirmations ?? []).map((c: { owner: string; submissionDate: string; signature: string }) => ({
        owner: c.owner,
        submissionDate: c.submissionDate,
        signature: c.signature,
      })),
      to: data.to,
      data: data.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    log.error({ err: error, safeTxHash }, "Failed to fetch multisig transaction from Safe Transaction Service");
    throw error;
  }
}
