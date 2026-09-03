import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().default("*"),

  ETHEREUM_SEPOLIA_RPC_URL: z.string().url(),
  CREDITCOIN_CC3_RPC_URL: z.string().url().default("https://rpc.cc3-testnet.creditcoin.network"),

  SAFE_TX_SERVICE_BASE_URL: z
    .string()
    .url()
    .default("https://safe-transaction-sepolia.safe.global/api/v1"),
  SAFE_TX_SERVICE_API_KEY: z.string().optional(),

  WORKER_WALLET_PRIVATE_KEY: z.string().min(1, "WORKER_WALLET_PRIVATE_KEY is required"),

  ATTESTCOIN_MODE: z.enum(["usc", "interim"]).default("usc"),
  ATTESTCOIN_PROOF_BUILDER_URL: z
    .string()
    .url()
    .default("https://prover.cc3-testnet.creditcoin.network"),
  ATTESTCOIN_PROOF_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  ATTESTCOIN_INTERIM_ATTESTOR_PRIVATE_KEY: z.string().optional(),

  SAFE_WATCHER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(6_000),
  ATTESTCOIN_WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(10_000),
  CHAIN_INDEXER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(8_000),

  DEPLOYMENTS_JSON_PATH: z.string().optional(),
  ABI_DIR_PATH: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
