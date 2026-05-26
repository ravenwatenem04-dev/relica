import type { FastifyInstance, FastifyRequest } from "fastify";

export default async function reviewsRoutes(app: FastifyInstance) {
  app.get("/api/reviews", async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const limit = parseInt(request.query.limit ?? "50", 10);
    const offset = parseInt(request.query.offset ?? "0", 10);

    const result = await multicaClient?.issues?.list?.({ status: "in_review", limit, offset });
    const issues = result?.issues ?? result ?? [];

    return { issues, total: result?.total ?? issues.length };
  });

  app.post("/api/issues/:issueId/review/approve", async (request: FastifyRequest<{ Params: { issueId: string }; Body: { comment?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;
    const { comment } = request.body;

    const issue = await multicaClient?.issues?.updateStatus?.(issueId, "done");

    if (comment) {
      try {
        await multicaClient?.comments?.add?.(issueId, { content: comment });
      } catch {
        // Non-fatal: status updated, comment failed
      }
    }

    return issue;
  });

  app.post("/api/issues/:issueId/review/request-changes", async (request: FastifyRequest<{ Params: { issueId: string }; Body: { comment: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;
    const { comment } = request.body;

    if (!comment) return { statusCode: 400, error: "comment is required" };

    const issue = await multicaClient?.issues?.updateStatus?.(issueId, "in_progress");
    await multicaClient?.comments?.add?.(issueId, { content: comment });

    return issue;
  });
}
