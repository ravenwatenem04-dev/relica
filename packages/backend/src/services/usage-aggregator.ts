import { estimateCost, getModelPrice } from "../config/model-pricing.js";
import type { WorkspaceUsageSummary, AgentUsage, ModelUsage, DailyUsage } from "@multica-console/shared";

interface RunLike {
  id: string;
  status: string;
  startedAt: string | null;
  model: string | null;
  tokenUsage: { input: number; output: number } | null;
  agentId?: string;
  agentName?: string;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
}

interface MulticaRunsClient {
  list?(issueId: string, params?: any): Promise<RunLike[]>;
}

interface MulticaClient {
  runs?: MulticaRunsClient;
  issues?: any;
  agents?: any;
}

export class UsageAggregator {
  private multicaClient: MulticaClient;
  private redis: RedisClient | null;

  constructor(opts: { multicaClient: MulticaClient; redis?: RedisClient | null }) {
    this.multicaClient = opts.multicaClient;
    this.redis = opts.redis ?? null;
  }

  async getSummary(workspaceId: string, period: string): Promise<WorkspaceUsageSummary> {
    const cacheKey = `usage:${workspaceId || "default"}:${period}`;

    if (this.redis) {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const runs = await this.fetchAllRuns(workspaceId);

    if (!runs) {
      return this.emptySummary(days);
    }

    const filtered = this.filterByPeriod(runs, days);
    const summary = this.compute(filtered, days);

    if (this.redis) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(summary));
    }

    return summary;
  }

  private async fetchAllRuns(_workspaceId: string): Promise<RunLike[] | null> {
    try {
      const listFn = this.multicaClient.runs?.list;
      if (!listFn) return null;

      let all: RunLike[] = [];
      let offset = 0;
      const limit = 100;

      while (true) {
        const result = await listFn("", { limit, offset });
        if (!result || result.length === 0) break;
        all = all.concat(result);
        if (result.length < limit) break;
        offset += limit;
      }

      return all;
    } catch {
      return null;
    }
  }

  private filterByPeriod(runs: RunLike[], days: number): RunLike[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return runs.filter((r) => r.startedAt && new Date(r.startedAt) >= cutoff);
  }

  private compute(allRuns: RunLike[], days: number): WorkspaceUsageSummary {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    let successfulRuns = 0;
    let failedRuns = 0;
    let totalInput = 0;
    let totalOutput = 0;
    let hasTokens = false;
    let totalCost = 0;
    let hasCost = false;

    const agentMap = new Map<string, { name: string; runs: RunLike[] }>();
    const modelMap = new Map<string, RunLike[]>();
    const dateMap = new Map<string, { runs: number; cost: number }>();

    for (const run of allRuns) {
      if (run.status === "succeeded" || run.status === "completed") successfulRuns++;
      else if (run.status === "failed") failedRuns++;

      if (run.tokenUsage) {
        hasTokens = true;
        totalInput += run.tokenUsage.input ?? 0;
        totalOutput += run.tokenUsage.output ?? 0;
      }

      if (run.model && run.tokenUsage) {
        const cost = estimateCost(run.model, run.tokenUsage.input ?? 0, run.tokenUsage.output ?? 0);
        if (cost !== null) {
          hasCost = true;
          totalCost += cost;
        }
      }

      const agentId = run.agentId ?? "unknown";
      const agentName = run.agentName ?? agentId;
      if (!agentMap.has(agentId)) agentMap.set(agentId, { name: agentName, runs: [] });
      agentMap.get(agentId)!.runs.push(run);

      const model = run.model ?? "unknown";
      if (!modelMap.has(model)) modelMap.set(model, []);
      modelMap.get(model)!.push(run);

      if (run.startedAt) {
        const date = run.startedAt.slice(0, 10);
        if (!dateMap.has(date)) dateMap.set(date, { runs: 0, cost: 0 });
        const entry = dateMap.get(date)!;
        entry.runs++;
        if (run.model && run.tokenUsage) {
          const c = estimateCost(run.model, run.tokenUsage.input ?? 0, run.tokenUsage.output ?? 0);
          if (c !== null) entry.cost += c;
        }
      }
    }

    const agentBreakdown: AgentUsage[] = [...agentMap.entries()]
      .map(([agentId, info]) => {
        const runs = info.runs;
        const succeeded = runs.filter((r) => r.status === "succeeded" || r.status === "completed").length;
        let input = 0, output = 0;
        for (const r of runs) {
          if (r.tokenUsage) { input += r.tokenUsage.input ?? 0; output += r.tokenUsage.output ?? 0; }
        }
        const tokens = hasTokens ? { input, output } : null;
        let cost: number | null = null;
        for (const r of runs) {
          if (r.model && r.tokenUsage) {
            const c = estimateCost(r.model, r.tokenUsage.input ?? 0, r.tokenUsage.output ?? 0);
            if (c !== null) cost = (cost ?? 0) + c;
          }
        }
        return { agentId, agentName: info.name, runCount: runs.length, successRate: runs.length > 0 ? succeeded / runs.length : 0, totalTokens: tokens, estimatedCost: cost };
      })
      .sort((a, b) => b.runCount - a.runCount);

    const modelBreakdown: ModelUsage[] = [...modelMap.entries()]
      .map(([model, runs]) => {
        let input = 0, output = 0;
        for (const r of runs) {
          if (r.tokenUsage) { input += r.tokenUsage.input ?? 0; output += r.tokenUsage.output ?? 0; }
        }
        const tokens = hasTokens ? { input, output } : null;
        let cost: number | null = null;
        for (const r of runs) {
          if (r.tokenUsage) {
            const c = estimateCost(model, r.tokenUsage.input ?? 0, r.tokenUsage.output ?? 0);
            if (c !== null) cost = (cost ?? 0) + c;
          }
        }
        return { model, runCount: runs.length, totalTokens: tokens, estimatedCost: cost };
      })
      .sort((a, b) => b.runCount - a.runCount);

    const dailyTrend: DailyUsage[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = dateMap.get(dateStr);
      dailyTrend.push({ date: dateStr, runCount: entry?.runs ?? 0, cost: entry?.cost ?? null });
    }

    return {
      period: { from: from.toISOString(), to: now.toISOString() },
      totalRuns: allRuns.length,
      successfulRuns,
      failedRuns,
      totalTokens: hasTokens ? { input: totalInput, output: totalOutput } : null,
      estimatedCost: hasCost ? totalCost : null,
      agentBreakdown,
      modelBreakdown,
      dailyTrend,
      dataAvailable: allRuns.length > 0,
    };
  }

  private emptySummary(days: number): WorkspaceUsageSummary {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - days);

    const dailyTrend: DailyUsage[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      dailyTrend.push({ date: d.toISOString().slice(0, 10), runCount: 0, cost: null });
    }

    return {
      period: { from: from.toISOString(), to: now.toISOString() },
      totalRuns: 0, successfulRuns: 0, failedRuns: 0,
      totalTokens: null, estimatedCost: null,
      agentBreakdown: [], modelBreakdown: [],
      dailyTrend, dataAvailable: false,
    };
  }
}
