import type { FastifyInstance, FastifyRequest } from "fastify";

interface WorkspaceUsageSummary {
  period: { from: string; to: string };
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalTokens: { input: number; output: number } | null;
  estimatedCost: number | null;
  agentBreakdown: { agentId: string; agentName: string; runCount: number; successRate: number; totalTokens: { input: number; output: number } | null; estimatedCost: number | null }[];
  modelBreakdown: { model: string; runCount: number; totalTokens: { input: number; output: number } | null; estimatedCost: number | null }[];
  dailyTrend: { date: string; runCount: number; cost: number | null }[];
  dataAvailable: boolean;
}

export default async function usageRoutes(app: FastifyInstance) {
  app.get("/api/usage/summary", async (request: FastifyRequest<{ Querystring: { period?: string } }>) => {
    const period = request.query.period ?? "30d";
    const aggregator = (app as any).usageAggregator;

    if (!aggregator) {
      return {
        totalRuns: 0, successfulRuns: 0, failedRuns: 0,
        totalTokens: null, estimatedCost: null,
        agentBreakdown: [], modelBreakdown: [], dailyTrend: [],
        period: { from: "", to: "" }, dataAvailable: false,
      };
    }

    return await aggregator.getSummary("", period);
  });

  app.get("/api/usage/agents", async (request: FastifyRequest<{ Querystring: { period?: string; limit?: string } }>) => {
    const period = request.query.period ?? "30d";
    const limit = parseInt(request.query.limit ?? "10", 10);
    const aggregator = (app as any).usageAggregator;

    if (!aggregator) return { agents: [] };

    const summary = await aggregator.getSummary("", period);
    return { agents: summary.agentBreakdown.slice(0, limit) };
  });

  app.get("/api/usage/trends", async (request: FastifyRequest<{ Querystring: { period?: string } }>) => {
    const period = request.query.period ?? "30d";
    const aggregator = (app as any).usageAggregator;

    if (!aggregator) return { daily: [] };

    const summary = await aggregator.getSummary("", period);
    return { daily: summary.dailyTrend };
  });
}
