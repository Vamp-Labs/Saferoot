import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { serializeActivityEvent } from "../domain/serialize";
import { activityQuerySchema } from "../lib/schemas";

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  app.get("/activity", async (request) => {
    const query = activityQuerySchema.parse(request.query);
    const events = await prisma.activityEvent.findMany({
      where: query.policyId ? { policyId: query.policyId } : undefined,
      orderBy: { timestamp: "desc" },
      take: query.limit,
    });
    return { activity: events.map(serializeActivityEvent) };
  });
}
