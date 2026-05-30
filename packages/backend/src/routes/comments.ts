import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MulticaApiError } from "../lib/multica-client.js";

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

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!(request as any).multicaClient) {
    return reply.code(401).send({ error: "Not authenticated" });
  }
}

function mapComment(c: any): Comment {
  return {
    id: c.id,
    issueId: c.issue_id ?? c.issueId,
    parentId: c.parent_id ?? c.parentId ?? null,
    authorType: c.author_type ?? c.authorType ?? "member",
    authorId: c.author_id ?? c.authorId ?? "",
    authorName: c.author_name ?? c.authorName ?? "",
    content: c.content ?? "",
    attachments: Array.isArray(c.attachments) ? c.attachments : [],
    createdAt: c.created_at ?? c.createdAt ?? "",
    updatedAt: c.updated_at ?? c.updatedAt ?? "",
  };
}

export default async function commentsRoutes(app: FastifyInstance) {
  app.get(
    "/api/issues/:issueId/comments",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).multicaClient;
        const issueId = (request.params as any).issueId;

        const commentsData = await client.comments.list(issueId);
        const commentsList = Array.isArray(commentsData) ? commentsData : (commentsData?.comments ?? []);
        const comments = commentsList.map(mapComment);

        return reply.send({ comments, total: comments.length });
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to list comments");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/issues/:issueId/comments",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).multicaClient;
        const issueId = (request.params as any).issueId;
        const body = request.body as any;
        const content = body?.content;
        const parentId = body?.parentId;

        if (!content || content.trim().length === 0) {
          return reply.code(400).send({ error: "Content is required" });
        }

        const params: any = { content };
        if (parentId) params.parent_id = parentId;

        const comment = await client.comments.add(issueId, params);
        return reply.code(201).send(mapComment(comment));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to add comment");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/issues/:issueId/comments/recent",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).multicaClient;
        const issueId = (request.params as any).issueId;
        const count = parseInt((request.query as any).count ?? "20", 10);

        const commentsData = await client.comments.list(issueId);
        const commentsList = Array.isArray(commentsData) ? commentsData : (commentsData?.comments ?? []);
        const comments = commentsList.map(mapComment);

        const roots = comments.filter((c: Comment) => !c.parentId);
        const threads: CommentThread[] = roots.slice(0, count).map((root: Comment) => ({
          root,
          replies: comments.filter((c: Comment) => c.parentId === root.id),
        }));

        return reply.send({ threads });
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to list recent comments");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/issues/:issueId/comments/:commentId/thread",
    {
      preHandler: [requireAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const client = (request as any).multicaClient;
        const issueId = (request.params as any).issueId;
        const commentId = (request.params as any).commentId;

        const commentsData = await client.comments.list(issueId);
        const commentsList = Array.isArray(commentsData) ? commentsData : (commentsData?.comments ?? []);
        const comments = commentsList.map(mapComment);

        const root = comments.find((c: Comment) => c.id === commentId);
        if (!root) {
          return reply.code(404).send({ error: "Comment not found" });
        }

        return reply.send({
          root,
          replies: comments.filter((c: Comment) => c.parentId === commentId),
        });
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to get comment thread");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}
