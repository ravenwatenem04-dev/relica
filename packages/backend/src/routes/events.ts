import type { FastifyPluginAsync } from "fastify";
import type { Redis } from "ioredis";
import { getRecentEvents, type WorkspaceEvent } from "../lib/event-store.js";

const HEARTBEAT_INTERVAL_MS = 30000;
const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

interface EventsRouteOptions {
  redisSub: Redis;
  redisClient: Redis;
}

interface SSEClient {
  id: string;
  res: import("http").ServerResponse;
  lastEventId: string | null;
}

let clientCounter = 0;
const clients = new Map<string, SSEClient>();

function sendSSE(
  res: import("http").ServerResponse,
  event: string,
  data: string,
  id?: string
): void {
  if (id !== undefined) {
    res.write(`id: ${id}\n`);
  }
  res.write(`event: ${event}\n`);
  res.write(`data: ${data}\n\n`);
}

function removeClient(clientId: string): void {
  const client = clients.get(clientId);
  if (!client) return;
  clients.delete(clientId);
}

async function replayEvents(
  redisClient: Redis,
  workspaceId: string,
  lastEventId: string,
  res: import("http").ServerResponse
): Promise<void> {
  try {
    const events = await getRecentEvents(redisClient, workspaceId, lastEventId);
    for (const evt of events) {
      sendSSE(res, evt.type, JSON.stringify(evt), evt.id);
    }
  } catch {
    console.warn("[events] replay failed for", lastEventId);
  }
}

const eventsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const { redisSub, redisClient } = opts as EventsRouteOptions;

  fastify.get(
    "/api/events/stream",
    {
      schema: {
        tags: ["events"],
        headers: {
          type: "object",
          properties: {
            "last-event-id": { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const workspaceId = request.session?.workspaceId;
      if (!workspaceId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const raw = reply.raw;
      raw.writeHead(200, SSE_HEADERS);

      const clientId = `sse-${++clientCounter}`;
      const lastEventId =
        (request.headers["last-event-id"] as string) ?? null;

      const client: SSEClient = {
        id: clientId,
        res: raw,
        lastEventId,
      };
      clients.set(clientId, client);

      if (lastEventId) {
        await replayEvents(redisClient, workspaceId, lastEventId, raw);
      }

      const channel = `workspace:${workspaceId}:events`;
      const onMessage = (_channel: string, message: string) => {
        try {
          const event = JSON.parse(message) as WorkspaceEvent;
          sendSSE(raw, event.type, message, event.id);
        } catch {
          console.warn("[events] failed to parse message");
        }
      };

      await redisSub.subscribe(channel);
      redisSub.on("message", onMessage);

      const heartbeatTimer = setInterval(() => {
        try {
          raw.write(":ping\n\n");
        } catch {
          clearInterval(heartbeatTimer);
          removeClient(clientId);
        }
      }, HEARTBEAT_INTERVAL_MS);

      request.raw.on("close", () => {
        clearInterval(heartbeatTimer);
        redisSub.unsubscribe(channel);
        redisSub.off("message", onMessage);
        removeClient(clientId);
      });

      request.raw.on("error", () => {
        clearInterval(heartbeatTimer);
        redisSub.unsubscribe(channel);
        redisSub.off("message", onMessage);
        removeClient(clientId);
      });

      await reply.hijack();
    }
  );
};

export default eventsRoutes;
