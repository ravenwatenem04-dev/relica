import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { Type } from "@sinclair/typebox";
import { MulticaApiError } from "../lib/multica-client.js";

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

function mapAgent(agent: any) {
  return {
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
  };
}

async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (request.multicaClient === null || !(request.session as any).workspaceId) {
    return reply.code(401).send({ message: "Authentication required" });
  }
}

function sendApiError(reply: FastifyReply, error: unknown) {
  if (error instanceof MulticaApiError) {
    return reply.code(error.statusCode || 500).send({ error: error.message });
  }
  throw error;
}

const agentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/api/agents",
    {
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
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const query = request.query as { limit?: number; offset?: number };
        const limit = query.limit ?? 50;
        const offset = query.offset ?? 0;
        const workspaceId = (request.session as any).workspaceId;

        const result = await request.multicaClient.agents.list({
          workspace_id: workspaceId,
          limit,
          offset,
        });
        const agentList = Array.isArray(result) ? result : (result.agents ?? []);
        const agents = agentList
          .map(mapAgent)
          .sort((a: any, b: any) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

        return reply.send({
          agents,
          total: result.total ?? agents.length,
        });
      } catch (error) {
        return sendApiError(reply, error);
      }
    }
  );

  fastify.get(
    "/api/agents/:id",
    {
      schema: {
        tags: ["agents"],
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: AgentDetailResponse,
        },
      },
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      try {
        const params = request.params as { id: string };
        const workspaceId = (request.session as any).workspaceId;
        const agent: any = await request.multicaClient.agents.get(params.id, {
          workspace_id: workspaceId,
        });

        return reply.send(mapAgent(agent));
      } catch (error: any) {
        return sendApiError(reply, error);
      }
    }
  );
};

export default agentRoutes;
