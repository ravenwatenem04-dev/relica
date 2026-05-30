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
  const commonOpts = {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    lazyConnect: true,
    connectTimeout: 2000,
    enableOfflineQueue: false,
  };

  const client = REDIS_URL
    ? new Redis(REDIS_URL, commonOpts)
    : new Redis({
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
        ...commonOpts,
      });

  client.on("error", () => {}); // suppress, handled in initRedis

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
    console.log("[redis] connected — realtime features enabled");
  } catch {
    console.log("[redis] not available — running without realtime features");
    enabled = false;
    pub.disconnect();
    sub.disconnect();
    client.disconnect();
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
}
