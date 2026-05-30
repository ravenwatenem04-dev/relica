import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MulticaClient, MulticaApiError } from "../lib/multica-client.js";
import { config } from "../config.js";

async function requireGuest(request: FastifyRequest, reply: FastifyReply) {
  if ((request as any).multicaClient) {
    return reply.code(400).send({ error: "Already authenticated" });
  }
}

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply) => {
      const { token } = request.body;
      if (!token) {
        return reply.code(400).send({ error: "Token is required" });
      }

      let user: any;
      try {
        const client = new MulticaClient(config.MULTICA_API_URL, token);
        user = await client.user.me();
      } catch (err: unknown) {
        if (err instanceof MulticaApiError) {
          if (err.status === 401) {
            return reply.code(401).send({ error: "Invalid token" });
          }
          return reply.code(err.status).send({ error: err.message });
        }
        request.log.error(err, "Login API call failed");
        return reply.code(500).send({ error: "Internal server error" });
      }

      const session = (request.session as any);
      session.token = token;
      session.user = user;
      session.workspaceId = user.current_workspace_id ?? user.workspace_id ?? user.default_workspace_id ?? "";
      session.save?.();

      return reply.send({ user, message: "Signed in" });
    }
  );

  app.get("/api/auth/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const session = (request.session as any);
    if (!session?.token) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    try {
      const client = (request as any).multicaClient;
      if (!client) {
        return reply.code(401).send({ error: "Not authenticated" });
      }
      const user = await client.user.me();
      session.user = user;
      return reply.send(user);
    } catch (err: unknown) {
      if (err instanceof MulticaApiError) {
        if (err.status === 401) {
          session.destroy?.();
          return reply.code(401).send({ error: "Token expired" });
        }
        return reply.code(err.status).send({ error: err.message });
      }
      request.log.error(err, "Me API call failed");
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    await request.session.destroy?.();
    return reply.send({ message: "Signed out" });
  });
}
