import type { FastifyInstance, FastifyRequest } from "fastify";
import { requireAuth } from "../plugins/auth.js";

interface Comment {
  id: string;
  issueId: string;
  parentId: string | null;
  authorType: "member" | "agent" | "system";
  authorId: string;
  authorName: string;
  content: string;
  attachments: { id: string; filename: string; size: number; mimeType: string }[];
  createdAt: string;
  updatedAt: string;
}

interface CommentThread {
  root: Comment;
  replies: Comment[];
}

function asArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export default async function commentsRoutes(app: FastifyInstance) {
  app.get("/api/issues/:issueId/comments", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string }; Querystring: { thread?: string; recent?: string; limit?: string; offset?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;

      const comments = asArray<Comment>(
        await multicaClient.issues.comments.list(issueId)
      );

      return { comments, total: comments.length };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.post("/api/issues/:issueId/comments", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string }; Body: { content: string; parentId?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;
      const { content, parentId } = request.body;

      if (!content) return reply.code(400).send({ error: "content is required" });

      const params: any = { content };
      if (parentId) params.parent_id = parentId;

      const comment = await multicaClient.issues.comments.add(issueId, params);
      return reply.code(201).send(comment);
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.get("/api/issues/:issueId/comments/recent", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string }; Querystring: { count?: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId } = request.params;

      const comments = asArray<Comment>(
        await multicaClient.issues.comments.list(issueId)
      );

      const roots = comments.filter((c) => !c.parentId);
      const threads: CommentThread[] = roots.map((root) => ({
        root,
        replies: comments.filter((c) => c.parentId === root.id),
      }));

      return { threads };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });

  app.get("/api/issues/:issueId/comments/:commentId/thread", {
    preHandler: requireAuth,
  }, async (request: FastifyRequest<{ Params: { issueId: string; commentId: string } }>, reply) => {
    try {
      const multicaClient = (request as any).multicaClient;
      const { issueId, commentId } = request.params;

      const comments = asArray<Comment>(
        await multicaClient.issues.comments.list(issueId)
      );

      const root = comments.find((c) => c.id === commentId);
      if (!root) return reply.code(404).send({ error: "Comment not found" });

      return {
        root,
        replies: comments.filter((c) => c.parentId === commentId),
      };
    } catch (e: any) {
      return reply.code(e.statusCode || 500).send({ error: e.message });
    }
  });
}
