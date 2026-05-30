import type { MulticaClient } from "../lib/multica-client.js";

declare module "fastify" {
  interface FastifyRequest {
    session: Record<string, any> & {
      destroy: () => void | Promise<void>;
      save?: () => void;
    };
    multicaClient: MulticaClient | null;
  }
}
