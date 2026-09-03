import type { FastifyInstance } from "fastify";
import { fetchSafeInfo } from "../safe/safeTransactionService";
import { NotFoundError } from "../lib/httpErrors";

export async function safesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { address: string } }>("/safes/:address", async (request) => {
    const { address } = request.params;
    try {
      const info = await fetchSafeInfo(address);
      return {
        address: info.address,
        name: null,
        owners: info.owners,
        threshold: info.threshold,
        network: "ethereum-sepolia",
      };
    } catch {
      throw new NotFoundError(`Safe ${address} was not found on Ethereum Sepolia's Safe Transaction Service`);
    }
  });
}
