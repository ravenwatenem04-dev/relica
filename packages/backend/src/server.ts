import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import crypto from "crypto";
import { config } from "./config.js";
import { initRedis, shutdownRedis, isRedisEnabled } from "./lib/redis.js";
import { EventPoller, MulticaPollerClient } from "./services/event-poller.js";
import { UsageAggregator } from "./services/usage-aggregator.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import issuesRoutes from "./routes/issues.js";
import agentRoutes from "./routes/agents.js";
import eventsRoutes from "./routes/events.js";
import commentsRoutes from "./routes/comments.js";
import runsRoutes from "./routes/runs.js";
import reviewsRoutes from "./routes/reviews.js";
import usageRoutes from "./routes/usage.js";

const sessionStore = new Map<string, Record<string, any>>();

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const [key, ...rest] = c.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:3000"],
  credentials: true,
});

await app.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: "1 minute",
});

app.decorateRequest("session", null);

app.addHook("onRequest", async (request, reply) => {
  const cookieHeader = request.headers.cookie || "";
  const cookies = parseCookies(cookieHeader);
  let sessionId = cookies["multica_session"];
  let session = sessionId ? sessionStore.get(sessionId) : null;

  if (!session) {
    session = {};
    sessionId = crypto.randomUUID();
    sessionStore.set(sessionId, session);
  }

  (session as any).id = sessionId;
  (session as any).save = () => sessionStore.set(sessionId!, session!);
  (session as any).destroy = () => sessionStore.delete(sessionId!);

  (request as any).session = session;

  const cookieValue = `multica_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`;
  reply.header("Set-Cookie", cookieValue);
});

app.setErrorHandler(async (error: any, request, reply) => {
  request.log.error(error, "Unhandled error");
  if (reply.raw.headersSent) {
    return reply.raw.end();
  }
  const statusCode = error.statusCode ?? 500;
  const message = statusCode === 500 ? "Internal server error" : error.message;
  return reply.code(statusCode).send({ error: message });
});

await app.register(authPlugin);
await app.register(authRoutes);

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
      list: async () => ({ issues: [], total: 0 }),
    },
    agents: {
      list: async () => ({ agents: [], total: 0 }),
    },
  };

  const poller = new EventPoller({
    workspaceId: config.MULTICA_API_TOKEN ? "default" : "",
    pollIntervalMs: config.POLL_INTERVAL_MS,
    redisPub: redisClients.pub,
    client: pollerClient,
  });

  if (isRedisEnabled()) {
    poller.start();
  }

  (app as any).usageAggregator = new UsageAggregator({
    multicaClient: {},
    redis: redisClients.data,
  });

  if (isRedisEnabled()) {
    await app.register(
      async (instance) => {
        await instance.register(eventsRoutes, {
          redisSub: redisClients.sub,
          redisClient: redisClients.client,
        });
      }
    );
  }

  app.addHook("onClose", async () => {
    poller.stop();
    await shutdownRedis();
  });

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Login at http://localhost:${config.PORT}/api/auth/login`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export default app;
