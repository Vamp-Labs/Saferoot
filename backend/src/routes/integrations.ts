import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { serializeIntegration } from "../domain/serialize";

export async function integrationsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/integrations", async () => {
    const integrations = await prisma.integration.findMany({ orderBy: { name: "asc" } });
    return { integrations: integrations.map(serializeIntegration) };
  });
}
