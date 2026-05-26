import type { FastifyInstance, FastifyRequest } from "fastify";

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
  app.get("/api/issues/:issueId/comments", async (request: FastifyRequest<{ Params: { issueId: string }; Querystring: { thread?: string; recent?: string; limit?: string; offset?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;

    const comments = asArray<Comment>(
      await (multicaClient?.issues?.comments?.list ?? multicaClient?.comments?.list)?.(issueId)
    );

    return { comments, total: comments.length };
  });

  app.post("/api/issues/:issueId/comments", async (request: FastifyRequest<{ Params: { issueId: string }; Body: { content: string; parentId?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;
    const { content, parentId } = request.body;

    if (!content) return { statusCode: 400, error: "content is required" };

    const params: any = { content };
    if (parentId) params.parent_id = parentId;

    const comment = await (multicaClient?.issues?.comments?.add ?? multicaClient?.comments?.add)?.(issueId, params);
    return { statusCode: 201, ...comment };
  });

  app.get("/api/issues/:issueId/comments/recent", async (request: FastifyRequest<{ Params: { issueId: string }; Querystring: { count?: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId } = request.params;
    const count = parseInt(request.query.count ?? "20", 10);

    const comments = asArray<Comment>(
      await (multicaClient?.issues?.comments?.list ?? multicaClient?.comments?.list)?.(issueId)
    );

    const roots = comments.filter((c) => !c.parentId);
    const threads: CommentThread[] = roots.map((root) => ({
      root,
      replies: comments.filter((c) => c.parentId === root.id),
    }));

    return { threads };
  });

  app.get("/api/issues/:issueId/comments/:commentId/thread", async (request: FastifyRequest<{ Params: { issueId: string; commentId: string } }>) => {
    const multicaClient = (request as any).multicaClient;
    const { issueId, commentId } = request.params;

    const comments = asArray<Comment>(
      await (multicaClient?.issues?.comments?.list ?? multicaClient?.comments?.list)?.(issueId)
    );

    const root = comments.find((c) => c.id === commentId);
    if (!root) return { statusCode: 404, error: "Comment not found" };

    return {
      root,
      replies: comments.filter((c) => c.parentId === commentId),
    };
  });
}
