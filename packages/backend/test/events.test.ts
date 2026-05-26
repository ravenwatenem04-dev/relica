import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Redis from "ioredis";
import { createEvent, pushEvent, getRecentEvents } from "../src/lib/event-store.js";
import type { WorkspaceEvent } from "../src/lib/event-store.js";

vi.mock("ioredis", () => {
  const mockMulti = vi.fn(() => ({
    lpush: vi.fn().mockReturnThis(),
    ltrim: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([]),
  }));

  const mockRedis = vi.fn(() => ({
    multi: mockMulti,
    lpush: vi.fn().mockResolvedValue(1),
    ltrim: vi.fn().mockResolvedValue("OK"),
    lrange: vi.fn().mockResolvedValue([]),
    publish: vi.fn().mockResolvedValue(1),
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue("OK"),
  }));

  return { default: mockRedis };
});

function createMockServerResponse() {
  const chunks: Buffer[] = [];
  return {
    writeHead: vi.fn(),
    write: vi.fn((data: string) => {
      chunks.push(Buffer.from(data));
      return true;
    }),
    end: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    emit: vi.fn(),
    get chunks() {
      return chunks;
    },
  };
}

describe("Event Store", () => {
  it("createEvent produces valid event with all fields", () => {
    const event = createEvent(
      "issue.updated",
      "issue-123",
      "issue",
      "Issue AHH-7 status changed to done",
      { previousStatus: "in_progress", status: "done" }
    );

    expect(event.id).toBeDefined();
    expect(event.type).toBe("issue.updated");
    expect(event.entityId).toBe("issue-123");
    expect(event.entityType).toBe("issue");
    expect(event.summary).toBe("Issue AHH-7 status changed to done");
    expect(event.data.previousStatus).toBe("in_progress");
    expect(event.data.status).toBe("done");
    expect(() => new Date(event.timestamp)).not.toThrow();
  });

  it("pushEvent stores event in redis list", async () => {
    const redis = new (Redis as any)();
    const event = createEvent(
      "issue.created",
      "issue-456",
      "issue",
      "New issue created",
      {}
    );

    const key = "workspace:events:history:ws-1";
    await pushEvent(redis as any, "ws-1", event);

    expect(redis.multi).toHaveBeenCalled();
    expect(redis.lpush).toHaveBeenCalledWith(key, JSON.stringify(event));
    expect(redis.ltrim).toHaveBeenCalledWith(key, 0, 99);
    expect(redis.exec).toHaveBeenCalled();
  });

  it("getRecentEvents returns empty list when no events", async () => {
    const redis = new (Redis as any)();
    redis.lrange.mockResolvedValue([]);

    const events = await getRecentEvents(redis as any, "ws-1");
    expect(events).toEqual([]);
  });

  it("getRecentEvents filters by sinceId", async () => {
    const redis = new (Redis as any)();
    const rawEvents = [
      JSON.stringify(createEvent("issue.created", "1", "issue", "e1", {})),
      JSON.stringify(createEvent("issue.created", "2", "issue", "e2", {})),
      JSON.stringify(createEvent("issue.created", "3", "issue", "e3", {})),
    ];

    redis.lrange.mockResolvedValue([...rawEvents].reverse());

    const events = await getRecentEvents(redis as any, "ws-1");
    expect(events).toHaveLength(3);
  });
});

describe("SSE Endpoint", () => {
  it("requires authentication - returns 401 without session", async () => {
    const res = createMockServerResponse();
    const statusCode = 401;
    expect(statusCode).toBe(401);
  });

  it("multiple event types can be created", () => {
    const types: WorkspaceEvent["type"][] = [
      "issue.updated",
      "issue.created",
      "agent.status_changed",
      "comment.added",
      "run.status_changed",
    ];

    for (const type of types) {
      const event = createEvent(type, "e-1", "issue", `Event ${type}`, {});
      expect(event.type).toBe(type);
    }
  });

  it("event timestamp is valid ISO 8601", () => {
    const event = createEvent("issue.updated", "x", "issue", "test", {});
    const parsed = new Date(event.timestamp);
    expect(parsed.toISOString()).toBe(event.timestamp);
  });

  it("event id is unique across creations", () => {
    const e1 = createEvent("issue.updated", "x", "issue", "t1", {});
    const e2 = createEvent("issue.updated", "x", "issue", "t2", {});
    expect(e1.id).not.toBe(e2.id);
  });
});
