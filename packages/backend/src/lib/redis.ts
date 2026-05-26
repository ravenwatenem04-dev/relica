import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "";

export interface RedisClients {
  pub: Redis;
  sub: Redis;
  client: Redis;
}

let clients: RedisClients | null = null;
let enabled = false;

function createClient(label: string): Redis {
  const client = REDIS_URL
    ? new Redis(REDIS_URL, {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          const delay = Math.min(Math.pow(2, times) * 100, 10000);
          return delay;
        },
        lazyConnect: true,
      })
    : new Redis({
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
        maxRetriesPerRequest: null,
        retryStrategy: (times) => {
          const delay = Math.min(Math.pow(2, times) * 100, 10000);
          return delay;
        },
        lazyConnect: true,
      });

  client.on("error", (err) => {
    console.warn(`[redis:${label}] connection error:`, err.message);
  });

  client.on("connect", () => {
    console.log(`[redis:${label}] connected`);
  });

  client.on("close", () => {
    console.log(`[redis:${label}] connection closed`);
  });

  return client;
}

export async function initRedis(): Promise<RedisClients> {
  if (clients) {
    return clients;
  }

  const pub = createClient("pub");
  const sub = createClient("sub");
  const client = createClient("data");

  try {
    await Promise.all([pub.connect(), sub.connect(), client.connect()]);
    enabled = true;
    console.log("[redis] all connections established");
  } catch (err: any) {
    console.warn("[redis] connection failed, realtime features disabled:", err.message);
    enabled = false;
  }

  clients = { pub, sub, client };
  return clients;
}

export function isRedisEnabled(): boolean {
  return enabled;
}

export async function shutdownRedis(): Promise<void> {
  if (!clients) return;

  const { pub, sub, client } = clients;
  await Promise.allSettled([
    pub.quit().catch(() => {}),
    sub.quit().catch(() => {}),
    client.quit().catch(() => {}),
  ]);
  clients = null;
  enabled = false;
  console.log("[redis] all connections closed");
}
