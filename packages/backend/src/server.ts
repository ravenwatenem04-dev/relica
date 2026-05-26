import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { initRedis, shutdownRedis } from "./lib/redis.js";
import { EventPoller, MulticaPollerClient } from "./services/event-poller.js";
import issuesRoutes from "./routes/issues.js";
import agentRoutes from "./routes/agents.js";
import eventsRoutes from "./routes/events.js";
import commentsRoutes from "./routes/comments.js";
import runsRoutes from "./routes/runs.js";
import reviewsRoutes from "./routes/reviews.js";
import usageRoutes from "./routes/usage.js";
import { UsageAggregator } from "./services/usage-aggregator.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
});

app.get("/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));

await app.register(issuesRoutes);
await app.register(agentRoutes);
await app.register(commentsRoutes);
await app.register(runsRoutes);
await app.register(reviewsRoutes);
await app.register(usageRoutes);

try {
  const redisClients = await initRedis();

  const pollerClient: MulticaPollerClient = {
    issues: {
      list: async (params) => ({ issues: [], total: 0 }),
    },
    agents: {
      list: async (params) => ({ agents: [], total: 0 }),
    },
  };

  const poller = new EventPoller({
    workspaceId: config.MULTICA_API_TOKEN ? "default" : "",
    pollIntervalMs: config.POLL_INTERVAL_MS,
    redisPub: redisClients.pub,
    client: pollerClient,
  });

  poller.start();

  (app as any).usageAggregator = new UsageAggregator({
    multicaClient: {},
    redis: redisClients.data,
  });

  await app.register(
    async (instance) => {
      await instance.register(eventsRoutes, {
        redisSub: redisClients.sub,
        redisClient: redisClients.client,
      });
    }
  );

  app.addHook("onClose", async () => {
    poller.stop();
    await shutdownRedis();
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`Server running on port ${config.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
