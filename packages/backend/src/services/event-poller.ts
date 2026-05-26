import type Redis from "ioredis";
import { createEvent, pushEvent, type WorkspaceEvent } from "../lib/event-store";

const DEFAULT_INTERVAL = 5000;
const MIN_INTERVAL = 2000;
const MAX_INTERVAL = 30000;

interface IssueSnapshot {
  id: string;
  status: string;
  updatedAt: string;
}

interface AgentSnapshot {
  id: string;
  status: string;
}

interface PollerState {
  issues: Map<string, IssueSnapshot>;
  agents: Map<string, AgentSnapshot>;
}

export interface MulticaPollerClient {
  issues: {
    list(params: {
      workspace_id: string;
      limit: number;
      offset: number;
    }): Promise<{ issues: any[]; total: number }>;
  };
  agents: {
    list(params: {
      workspace_id: string;
      limit: number;
      offset: number;
    }): Promise<{ agents: any[]; total: number }>;
  };
}

export interface EventPollerConfig {
  workspaceId: string;
  pollIntervalMs?: number;
  redisPub: Redis;
  client: MulticaPollerClient;
}

export class EventPoller {
  private readonly workspaceId: string;
  private readonly intervalMs: number;
  private readonly redisPub: Redis;
  private readonly client: MulticaPollerClient;

  private state: PollerState;
  private timer: ReturnType<typeof setInterval> | null;
  private running: boolean;
  private firstPoll: boolean;

  constructor(config: EventPollerConfig) {
    this.workspaceId = config.workspaceId;
    this.intervalMs = Math.max(
      MIN_INTERVAL,
      Math.min(MAX_INTERVAL, config.pollIntervalMs ?? DEFAULT_INTERVAL)
    );
    this.redisPub = config.redisPub;
    this.client = config.client;

    this.state = { issues: new Map(), agents: new Map() };
    this.timer = null;
    this.running = false;
    this.firstPoll = true;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.poll().catch((err) => {
      console.warn("[event-poller] initial poll failed:", err.message);
    });

    this.timer = setInterval(() => {
      this.poll().catch((err) => {
        console.warn("[event-poller] poll failed:", err.message);
      });
    }, this.intervalMs);

    console.log(`[event-poller] started (interval: ${this.intervalMs}ms)`);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }

    console.log("[event-poller] stopped");
  }

  private async poll(): Promise<void> {
    const [issuesResult, agentsResult] = await Promise.allSettled([
      this.pollIssues(),
      this.pollAgents(),
    ]);

    if (issuesResult.status === "rejected") {
      console.warn("[event-poller] issues poll failed:", issuesResult.reason.message);
    }
    if (agentsResult.status === "rejected") {
      console.warn("[event-poller] agents poll failed:", agentsResult.reason.message);
    }
  }

  private async fetchAllIssues(): Promise<any[]> {
    const limit = 50;
    let offset = 0;
    let allIssues: any[] = [];

    while (true) {
      const result = await this.client.issues.list({
        workspace_id: this.workspaceId,
        limit,
        offset,
      });

      const batch = result.issues ?? [];
      allIssues = allIssues.concat(batch);

      if (batch.length < limit) break;
      offset += limit;
    }

    return allIssues;
  }

  private async pollIssues(): Promise<void> {
    const issues = await this.fetchAllIssues();
    const current = new Map<string, IssueSnapshot>();

    for (const issue of issues) {
      current.set(issue.id, {
        id: issue.id,
        status: issue.status,
        updatedAt: issue.updated_at ?? issue.updatedAt,
      });
    }

    if (this.firstPoll) {
      this.state.issues = current;
      return;
    }

    const previous = this.state.issues;
    const events: WorkspaceEvent[] = [];

    for (const [id, snapshot] of current) {
      const prev = previous.get(id);
      if (!prev) {
        events.push(
          createEvent(
            "issue.created",
            id,
            "issue",
            `Issue ${id} created with status ${snapshot.status}`,
            { status: snapshot.status }
          )
        );
      } else if (prev.status !== snapshot.status) {
        events.push(
          createEvent(
            "issue.updated",
            id,
            "issue",
            `Issue ${id} status changed to ${snapshot.status}`,
            {
              previousStatus: prev.status,
              status: snapshot.status,
            }
          )
        );
      } else if (prev.updatedAt !== snapshot.updatedAt) {
        events.push(
          createEvent(
            "issue.updated",
            id,
            "issue",
            `Issue ${id} updated`,
            {
              previousUpdatedAt: prev.updatedAt,
              updatedAt: snapshot.updatedAt,
            }
          )
        );
      }
    }

    this.state.issues = current;

    for (const event of events) {
      await this.publish(event);
    }
  }

  private async pollAgents(): Promise<void> {
    const result = await this.client.agents.list({
      workspace_id: this.workspaceId,
      limit: 100,
      offset: 0,
    });

    const agents = result.agents ?? [];
    const current = new Map<string, AgentSnapshot>();

    for (const agent of agents) {
      current.set(agent.id, {
        id: agent.id,
        status: agent.status,
      });
    }

    if (this.firstPoll) {
      this.state.agents = current;
      this.firstPoll = false;
      return;
    }

    const previous = this.state.agents;
    const events: WorkspaceEvent[] = [];

    for (const [id, snapshot] of current) {
      const prev = previous.get(id);
      if (!prev) {
        continue;
      }
      if (prev.status !== snapshot.status) {
        events.push(
          createEvent(
            "agent.status_changed",
            id,
            "agent",
            `Agent ${id} status changed to ${snapshot.status}`,
            {
              previousStatus: prev.status,
              status: snapshot.status,
            }
          )
        );
      }
    }

    this.state.agents = current;

    for (const event of events) {
      await this.publish(event);
    }
  }

  private async publish(event: WorkspaceEvent): Promise<void> {
    const channel = `workspace:${this.workspaceId}:events`;

    try {
      await Promise.all([
        this.redisPub.publish(channel, JSON.stringify(event)),
        pushEvent(this.redisPub, this.workspaceId, event),
      ]);
    } catch (err: any) {
      console.warn("[event-poller] failed to publish event:", err.message);
    }
  }
}
