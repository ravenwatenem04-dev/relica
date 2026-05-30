import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuth } from "../plugins/auth.js";

interface Run {
  id: string;
  issueId: string;
  agentId: string;
  agentName: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  startedAt: string | null;
  completedAt: string | null;
  model: string | null;
  tokenUsage: { input: number; output: number } | null;
  estimatedCost: number | null;
  failureReason: string | null;
  duration: number | null;
}

function asArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export default async function runsRoutes(app: FastifyInstance) {
  app.get("/api/issues/:issueId/runs", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;

      const runs = asArray<Run>(await multicaClient.runs.list(issueId));
      runs.sort((a, b) => new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime());
      return { runs };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.get("/api/issues/:issueId/runs/:runId", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { runId } = request.params;

      const run = await multicaClient.runs.get(runId);
      if (!run) return reply.code(404).send({ error: "Run not found" });

      return run;
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.get("/api/agents/:agentId/runs", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { agentId: string }; Querystring: { limit?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { agentId } = request.params;
      const limit = parseInt(request.query.limit ?? "20", 10);

      const runs = asArray<Run>(await multicaClient.runs.listByAgent(agentId));
      return { runs: runs.slice(0, limit) };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.post("/api/issues/:issueId/runs/:runId/cancel", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { runId } = request.params;

      await multicaClient.runs.cancel(runId);
      return reply.code(202).send({ message: "Cancellation requested" });
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.post("/api/issues/:issueId/runs/:runId/retry", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId, runId } = request.params;

      const newRun = await multicaClient.runs.retry(runId, issueId);
      return reply.code(201).send({ run: newRun });
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });
}
