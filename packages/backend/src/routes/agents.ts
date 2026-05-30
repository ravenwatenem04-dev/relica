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
  if (!(request as any).multicaClient) {
    return reply.code(401).send({ error: "Not authenticated" });
  }
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
        const workspaceId = (request.session as any)?.workspaceId;
        const limit = request.query.limit ?? 50;
        const offset = request.query.offset ?? 0;

        let agentsData: any;
        try {
          agentsData = await request.multicaClient.agents.list(workspaceId);
        } catch (listErr: unknown) {
          if (listErr instanceof MulticaApiError) {
            return reply.code(listErr.status).send({ error: listErr.message });
          }
          throw listErr;
        }

        const agentsList = Array.isArray(agentsData) ? agentsData : (agentsData?.agents ?? []);
        const agents = agentsList
          .slice(offset, offset + limit)
          .map(mapAgent)
          .sort((a: any, b: any) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));

        return reply.send({
          agents,
          total: agentsData?.total ?? agentsList.length,
        });
      } catch (err: unknown) {
        request.log.error(err, "Failed to list agents");
        return reply.code(500).send({ error: "Internal server error" });
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
        const agent: any = await request.multicaClient.agents.get(request.params.id);
        return reply.send(mapAgent(agent));
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 404) {
            return reply.code(404).send({ error: "Agent not found" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Failed to get agent");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
};

export default agentRoutes;
