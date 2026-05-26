import { v4 as uuid } from "uuid";

const MAX_HISTORY = 100;
const HISTORY_KEY_PREFIX = "workspace:events:history:";

export interface WorkspaceEvent {
  id: string;
  type:
    | "issue.updated"
    | "issue.created"
    | "agent.status_changed"
    | "comment.added"
    | "run.status_changed";
  entityId: string;
  entityType: "issue" | "agent" | "comment" | "run";
  timestamp: string;
  summary: string;
  data: Record<string, unknown>;
}

export function createEvent(
  type: WorkspaceEvent["type"],
  entityId: string,
  entityType: WorkspaceEvent["entityType"],
  summary: string,
  data: Record<string, unknown>
): WorkspaceEvent {
  return {
    id: uuid(),
    type,
    entityId,
    entityType,
    timestamp: new Date().toISOString(),
    summary,
    data,
  };
}

export async function pushEvent(
  redisClient: import("ioredis").Redis,
  workspaceId: string,
  event: WorkspaceEvent
): Promise<void> {
  const key = `${HISTORY_KEY_PREFIX}${workspaceId}`;
  await redisClient
    .multi()
    .lpush(key, JSON.stringify(event))
    .ltrim(key, 0, MAX_HISTORY - 1)
    .exec();
}

export async function getRecentEvents(
  redisClient: import("ioredis").Redis,
  workspaceId: string,
  sinceId?: string
): Promise<WorkspaceEvent[]> {
  const key = `${HISTORY_KEY_PREFIX}${workspaceId}`;
  const raw = await redisClient.lrange(key, 0, MAX_HISTORY - 1);

  const events: WorkspaceEvent[] = [];
  for (const item of raw) {
    try {
      events.push(JSON.parse(item) as WorkspaceEvent);
    } catch {
      continue;
    }
  }

  events.reverse();

  if (sinceId) {
    const sinceIndex = events.findIndex((e) => e.id === sinceId);
    if (sinceIndex >= 0) {
      return events.slice(sinceIndex + 1);
    }
  }

  return events;
}
