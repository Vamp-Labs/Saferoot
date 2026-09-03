import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { env } from "./env";
import { HttpError } from "./lib/httpErrors";
import { safesRoutes } from "./routes/safes";
import { integrationsRoutes } from "./routes/integrations";
import { policiesRoutes } from "./routes/policies";
import { activityRoutes } from "./routes/activity";

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      env.NODE_ENV === "production"
        ? { level: "info" }
        : {
            level: "debug",
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
            },
          },
  });

  await app.register(cors, { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof HttpError) {
      reply.code(error.statusCode).send({ error: error.message });
      return;
    }
    if (error instanceof ZodError) {
      reply.code(400).send({ error: "Validation failed", details: error.issues });
      return;
    }
    app.log.error({ err: error }, "Unhandled request error");
    reply.code(500).send({ error: "Internal server error" });
  });

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(
    async (api) => {
      await safesRoutes(api);
      await integrationsRoutes(api);
      await policiesRoutes(api);
      await activityRoutes(api);
    },
    { prefix: "/api" },
  );

  return app;
}
