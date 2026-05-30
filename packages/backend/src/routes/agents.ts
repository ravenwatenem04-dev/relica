import type { FastifyPluginAsync } from "fastify";
import { Type } from "@sinclair/typebox";
import { requireAuth } from "../plugins/auth.js";

const AgentStatus = Type.Union([
  Type.Literal("available"),
  Type.Literal("running"),
  Type.Literal("blocked"),
  Type.Literal("disabled"),
]);

const AgentSchema = Type.Object({
  id: Type.String(),
  displayName: Type.String(),
  status: AgentStatus,
  model: Type.String(),
  currentTask: Type.Union([
    Type.Object({
      id: Type.String(),
      title: Type.String(),
    }),
    Type.Null(),
  ]),
  capabilities: Type.Array(Type.String()),
});

const AgentListResponse = Type.Object({
  agents: Type.Array(AgentSchema),
  total: Type.Number(),
});

const AgentDetailResponse = AgentSchema;

const statusOrder: Record<string, number> = {
  running: 0,
  available: 1,
  blocked: 2,
  disabled: 3,
};

const agentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/api/agents",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["agents"],
        querystring: Type.Object({
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
          offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
        }),
        response: {
          200: AgentListResponse,
        },
      },
    },
    async (request, reply) => {
      const limit = request.query.limit ?? 50;
      const offset = request.query.offset ?? 0;
      const workspaceId = request.session.workspaceId;

      const result = await request.multicaClient.agents.list({
        workspace_id: workspaceId,
        limit,
        offset,
      });

      const agents = result.agents
        .map((agent: any) => ({
          id: agent.id,
          displayName: agent.display_name ?? agent.name ?? agent.id,
          status: agent.status,
          model: agent.model ?? "",
          currentTask: agent.current_task
            ? {
                id: agent.current_task.id,
                title: agent.current_task.title,
              }
            : null,
          capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
        }))
        .sort((a: any, b: any) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

      return reply.send({
        agents,
        total: result.total ?? agents.length,
      });
    }
  );

  fastify.get(
    "/api/agents/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["agents"],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: AgentDetailResponse,
        },
      },
    },
    async (request, reply) => {
      const workspaceId = request.session.workspaceId;

      try {
        const agent: any = await request.multicaClient.agents.get(request.params.id, {
          workspace_id: workspaceId,
        });

        return reply.send({
          id: agent.id,
          displayName: agent.display_name ?? agent.name ?? agent.id,
          status: agent.status,
          model: agent.model ?? "",
          currentTask: agent.current_task
            ? {
                id: agent.current_task.id,
                title: agent.current_task.title,
              }
            : null,
          capabilities: Array.isArray(agent.capabilities) ? agent.capabilities : [],
        });
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.status === 404) {
          return reply.code(404).send({ message: "Agent not found" });
        }
        throw error;
      }
    }
  );
};

export default agentRoutes;
