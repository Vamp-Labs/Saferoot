import { env } from "./env";
import { logger } from "./logger";
import { buildServer } from "./server";
import { startAllWorkers } from "./workers";
import { disconnectPrisma } from "./prisma";
import { loadContractSetup } from "./chain/deployments";

async function main(): Promise<void> {
  const setup = loadContractSetup();
  if (setup.source === "fixture") {
    logger.warn(
      "Running against placeholder fixture contract addresses. Real Safe/attestation/execution flows will not " +
        "work until /contracts/deployments.json is published by the Smart Contracts role.",
    );
  }

  const app = await buildServer();
  const workers = startAllWorkers();

  await app.listen({ port: env.PORT, host: env.HOST });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down");
    workers.stop();
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  logger.error({ err: error }, "Fatal error during startup");
  process.exit(1);
});
