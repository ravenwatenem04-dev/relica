import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import { MulticaApiError } from "../lib/multica-client.js";

const IssueStatus = Type.Union([
  Type.Literal("todo"),
  Type.Literal("in_progress"),
  Type.Literal("in_review"),
  Type.Literal("done"),
  Type.Literal("blocked"),
  Type.Literal("backlog"),
  Type.Literal("cancelled"),
]);

const IssueResponse = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  status: IssueStatus,
  priority: Type.Union([Type.String(), Type.Null()]),
  projectId: Type.Union([Type.String(), Type.Null()]),
  assigneeId: Type.Union([Type.String(), Type.Null()]),
  assigneeType: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Record(Type.String(), Type.Any()),
  labels: Type.Array(Type.String()),
  parentIssueId: Type.Union([Type.String(), Type.Null()]),
  dueDate: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const IssueListResponse = Type.Object({
  issues: Type.Array(IssueResponse),
  total: Type.Number(),
  hasMore: Type.Boolean(),
});

const CreateIssueBody = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  priority: Type.Optional(Type.String()),
  projectId: Type.Optional(Type.String()),
  assigneeId: Type.Optional(Type.String()),
  parentIssueId: Type.Optional(Type.String()),
});

const UpdateIssueBody = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(Type.String()),
  priority: Type.Optional(Type.String()),
  status: Type.Optional(IssueStatus),
  assigneeId: Type.Optional(Type.String()),
  projectId: Type.Optional(Type.String()),
  dueDate: Type.Optional(Type.String()),
});

const ChangeStatusBody = Type.Object({
  status: IssueStatus,
});

const AssignBody = Type.Object({
  agentId: Type.String({ minLength: 1 }),
});

const mapIssue = (issue: any) => ({
  id: issue.id,
  title: issue.title,
  description: issue.description ?? null,
  status: issue.status,
  priority: issue.priority ?? null,
  projectId: issue.project_id ?? null,
  assigneeId: issue.assignee_id ?? null,
  assigneeType: issue.assignee_type ?? null,
  metadata: issue.metadata ?? {},
  labels: issue.labels ?? [],
  parentIssueId: issue.parent_issue_id ?? null,
  dueDate: issue.due_date ?? null,
  createdAt: issue.created_at,
  updatedAt: issue.updated_at,
});

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!(request as any).multicaClient) {
    return reply.code(401).send({ error: "Not authenticated" });
  }
}

function getWorkspaceId(request: FastifyRequest): string | undefined {
  return (request.session as any)?.workspaceId;
}

async function handleApiCall<T>(
  request: FastifyRequest,
  reply: FastifyReply,
  fn: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (err instanceof MulticaApiError) {
      if (err.status === 404) {
        await reply.code(404).send({ error: err.message });
        return undefined;
      }
      await reply.code(err.status).send({ error: err.message });
      return undefined;
    }
    throw err;
  }
}

const issuesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/api/issues",
    {
      schema: {
        tags: ["issues"],
        querystring: Type.Object({
          status: Type.Optional(Type.String()),
          priority: Type.Optional(Type.String()),
          project_id: Type.Optional(Type.String()),
          assignee_id: Type.Optional(Type.String()),
          search: Type.Optional(Type.String()),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
          offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        }),
        response: {
          200: IssueListResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const limit = request.query.limit ?? 50;
        const offset = request.query.offset ?? 0;
        const params = {
          workspace_id: getWorkspaceId(request),
          status: request.query.status,
          priority: request.query.priority,
          project_id: request.query.project_id,
          assignee_id: request.query.assignee_id,
          search: request.query.search,
          limit,
          offset,
        };

        const result = await request.multicaClient.issues.list(params);
        const issues = (result.issues ?? []).map(mapIssue);

        return reply.send({
          issues,
          total: result.total ?? issues.length,
          hasMore: offset + issues.length < (result.total ?? issues.length),
        });
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to list issues");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.get(
    "/api/issues/:id",
    {
      schema: {
        tags: ["issues"],
        params: Type.Object({ id: Type.String() }),
        response: {
          200: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const issue = await handleApiCall(request, reply, () =>
          request.multicaClient.issues.get(request.params.id)
        );
        if (issue) {
          return reply.send(mapIssue(issue));
        }
      } catch (err: unknown) {
        request.log.error(err, "Failed to get issue");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.post(
    "/api/issues",
    {
      schema: {
        tags: ["issues"],
        body: CreateIssueBody,
        response: {
          201: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const body = request.body;
        const issue = await request.multicaClient.issues.create({
          workspace_id: getWorkspaceId(request),
          title: body.title,
          description: body.description,
          priority: body.priority,
          project_id: body.projectId,
          assignee_id: body.assigneeId,
          assignee_type: body.assigneeId ? "agent" : undefined,
          parent_issue_id: body.parentIssueId,
        });

        return reply.code(201).send(mapIssue(issue));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to create issue");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.patch(
    "/api/issues/:id",
    {
      schema: {
        tags: ["issues"],
        params: Type.Object({ id: Type.String() }),
        body: UpdateIssueBody,
        response: {
          200: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const body = request.body;
        const payload: Record<string, unknown> = {};
        if (body.title !== undefined) payload.title = body.title;
        if (body.description !== undefined) payload.description = body.description;
        if (body.priority !== undefined) payload.priority = body.priority;
        if (body.status !== undefined) payload.status = body.status;
        if (body.projectId !== undefined) payload.project_id = body.projectId;
        if (body.assigneeId !== undefined) {
          payload.assignee_id = body.assigneeId;
          payload.assignee_type = body.assigneeId ? "agent" : null;
        }
        if (body.dueDate !== undefined) payload.due_date = body.dueDate;

        const issue = await request.multicaClient.issues.update(request.params.id, {
          workspace_id: getWorkspaceId(request),
          ...payload,
        });

        return reply.send(mapIssue(issue));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to update issue");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.post(
    "/api/issues/:id/status",
    {
      schema: {
        tags: ["issues"],
        params: Type.Object({ id: Type.String() }),
        body: ChangeStatusBody,
        response: {
          200: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const issue = await request.multicaClient.issues.update(request.params.id, {
          workspace_id: getWorkspaceId(request),
          status: request.body.status,
        });
        return reply.send(mapIssue(issue));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to change issue status");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.post(
    "/api/issues/:id/assign",
    {
      schema: {
        tags: ["issues"],
        params: Type.Object({ id: Type.String() }),
        body: AssignBody,
        response: {
          200: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const issue = await request.multicaClient.issues.update(request.params.id, {
          workspace_id: getWorkspaceId(request),
          assignee_id: request.body.agentId,
          assignee_type: "agent",
        });
        return reply.send(mapIssue(issue));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to assign issue");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  fastify.post(
    "/api/issues/:id/unassign",
    {
      schema: {
        tags: ["issues"],
        params: Type.Object({ id: Type.String() }),
        response: {
          200: IssueResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const issue = await request.multicaClient.issues.update(request.params.id, {
          workspace_id: getWorkspaceId(request),
          assignee_id: null,
          assignee_type: null,
        });
        return reply.send(mapIssue(issue));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Issue not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to unassign issue");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
};

export default issuesRoutes;
