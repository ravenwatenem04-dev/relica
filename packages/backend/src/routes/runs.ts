import type { FastifyInstance, FastifyRequest } from "fastify";

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
  app.get("/api/issues/:issueId/runs", async (request: FastifyRequest<{ Params: { issueId: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;

    const runs = asArray<Run>(await multicaClient?.runs?.list?.(issueId));
    runs.sort((a, b) => new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime());
    return { runs };
  });

  app.get("/api/issues/:issueId/runs/:runId", async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { runId } = request.params;

    const run = await multicaClient?.runs?.get?.(runId);
    if (!run) return { statusCode: 404, error: "Run not found" };

    return run;
  });

  app.get("/api/agents/:agentId/runs", async (request: FastifyRequest<{ Params: { agentId: string }; Querystring: { limit?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { agentId } = request.params;
    const limit = parseInt(request.query.limit ?? "20", 10);

    const runs = asArray<Run>(await multicaClient?.runs?.listByAgent?.(agentId));
    return { runs: runs.slice(0, limit) };
  });

  app.post("/api/issues/:issueId/runs/:runId/cancel", async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { runId } = request.params;

    try {
      await multicaClient?.runs?.cancel?.(runId);
      return { statusCode: 202, message: "Cancellation requested" };
    } catch {
      return { statusCode: 501, error: "Cancel not supported by platform" };
    }
  });

  app.post("/api/issues/:issueId/runs/:runId/retry", async (request: FastifyRequest<{ Params: { issueId: string; runId: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId, runId } = request.params;

    const newRun = await multicaClient?.runs?.retry?.(runId, issueId);
    return { statusCode: 201, run: newRun };
  });
}
