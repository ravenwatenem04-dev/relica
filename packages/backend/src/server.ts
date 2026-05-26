import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { initRedis, shutdownRedis } from "./lib/redis.js";
import { EventPoller } from "./services/event-poller.js";
import { MulticaPollerClient } from "./services/event-poller.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
});

app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

try {
  const redisClients = await initRedis(config.REDIS_URL);

  const pollerClient: MulticaPollerClient = {
    listIssues: async (params) => ({ issues: [], total: 0 }),
    listAgents: async () => [],
  };

  const poller = new EventPoller({
    multicaClient: pollerClient,
    redisPublisher: redisClients.pub,
    redisData: redisClients.data,
    workspaceId: "",
    pollIntervalMs: config.POLL_INTERVAL_MS,
  });

  app.addHook("onClose", async () => {
    poller.stop();
    await shutdownRedis(redisClients);
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`Server running on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
