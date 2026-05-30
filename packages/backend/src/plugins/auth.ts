import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { MulticaClient } from "../lib/multica-client.js";
import { config } from "../config.js";

export default async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("multicaClient", null);

  app.addHook("onRequest", async (request) => {
    const session = (request as any).session;
    const token = session?.token;
    if (token) {
      (request as any).multicaClient = new MulticaClient(config.MULTICA_API_URL, token);
    }
  });
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!(request as any).multicaClient) {
    return reply.code(401).send({ message: "Authentication required" });
  }
}
