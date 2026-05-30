import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!(request as any).multicaClient) {
    return reply.code(401).send({ error: "Not authenticated" });
  }
}

export default async function usageRoutes(app: FastifyInstance) {
  app.get(
    "/api/usage/summary",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const period = (request.query as any).period ?? "30d";
        if (!["7d", "30d", "90d"].includes(period)) {
          return reply.code(400).send({ error: "Period must be one of: 7d, 30d, 90d" });
        }

        const aggregator = (app as any).usageAggregator;
        if (!aggregator) {
          return reply.send({
            period: { from: "", to: "" },
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            totalTokens: null,
            estimatedCost: null,
            agentBreakdown: [],
            modelBreakdown: [],
            dailyTrend: [],
            dataAvailable: false,
          });
        }

        const workspaceId = (request.session as any)?.workspaceId ?? "";
        const summary = await aggregator.getSummary(workspaceId, period);
        return reply.send(summary);
      } catch (err: unknown) {
        request.log.error(err, "Failed to get usage summary");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/usage/agents",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const period = (request.query as any).period ?? "30d";
        const limit = parseInt((request.query as any).limit ?? "10", 10);
        const aggregator = (app as any).usageAggregator;

        if (!aggregator) return reply.send({ agents: [] });

        const workspaceId = (request.session as any)?.workspaceId ?? "";
        const summary = await aggregator.getSummary(workspaceId, period);
        return reply.send({ agents: summary.agentBreakdown.slice(0, limit) });
      } catch (err: unknown) {
        request.log.error(err, "Failed to get usage agents");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/usage/trends",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const period = (request.query as any).period ?? "30d";
        const aggregator = (app as any).usageAggregator;

        if (!aggregator) return reply.send({ daily: [] });

        const workspaceId = (request.session as any)?.workspaceId ?? "";
        const summary = await aggregator.getSummary(workspaceId, period);
        return reply.send({ daily: summary.dailyTrend });
      } catch (err: unknown) {
        request.log.error(err, "Failed to get usage trends");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}
