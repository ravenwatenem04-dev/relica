import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { MulticaClient } from "../lib/multica-client.js";
import { config } from "../config.js";

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("multicaClient", null);

  app.addHook("onRequest", async (request) => {
    const session = (request as any).session;
    const token = session?.token;
    if (token) {
      (request as any).multicaClient = new MulticaClient(config.MULTICA_API_URL, token);
    }
  });
}

export default fp(authPlugin, { name: "auth-plugin" });
