import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuth } from "../plugins/auth.js";

export default async function reviewsRoutes(app: FastifyInstance) {
  app.get("/api/reviews", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const limit = parseInt(request.query.limit ?? "50", 10);
      const offset = parseInt(request.query.offset ?? "0", 10);

      const result = await multicaClient.issues.list({ status: "in_review", limit, offset });
      const issues = result.issues ?? [];

      return { issues, total: result.total ?? issues.length };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.post("/api/issues/:issueId/review/approve", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string }; Body: { comment?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;
      const { comment } = request.body;

      const issue = await multicaClient.issues.updateStatus(issueId, "done");

      if (comment) {
        try {
          await multicaClient.comments.add(issueId, { content: comment });
        } catch {
          // Non-fatal: status updated, comment failed
        }
      }

      return issue;
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.post("/api/issues/:issueId/review/request-changes", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string }; Body: { comment: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;
      const { comment } = request.body;

      if (!comment) return reply.code(400).send({ error: "comment is required" });

      const issue = await multicaClient.issues.updateStatus(issueId, "in_progress");
      await multicaClient.comments.add(issueId, { content: comment });

      return issue;
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });
}
