import type { FastifyInstance, FastifyRequest } from "fastify";
import { MulticaApiError, MulticaClient } from "../lib/multica-client.js";
import { config } from "../config.js";

function authErrorStatus(error: unknown) {
  return error instanceof MulticaApiError ? error.statusCode : 401;
}

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request: FastifyRequest<{ Body: { token: string } }>, reply) => {
    const { token } = request.body;
    if (!token) return reply.code(400).send({ error: "Token is required" });

    const client = new MulticaClient(config.MULTICA_API_URL, token);
    let user: any;
    try {
      user = await client.user.me();
    } catch (err: any) {
      const status = authErrorStatus(err);
      return reply.code(status || 401).send({ error: status === 401 ? "Invalid token" : err.message });
    }

    const workspaceId = user.workspace_id ?? user.current_workspace_id ?? user.default_workspace_id;
    const userName = user.name ?? user.email ?? user.id;
    const session = request.session as any;
    session.token = token;
    session.workspaceId = workspaceId;
    session.userId = user.id;
    session.userName = userName;
    session.userEmail = user.email;
    session.user = { ...user, workspace_id: workspaceId, name: userName };
    session.save?.();

    return reply.send({ user: session.user, message: "Signed in" });
  });

  app.get("/api/auth/me", async (request, reply) => {
    const session = request.session as any;
    if (!session?.token) return reply.code(401).send({ message: "Authentication required" });

    try {
      const user = await request.multicaClient.user.me();
      session.user = user;
      session.workspaceId = user.workspace_id ?? session.workspaceId;
      session.userId = user.id ?? session.userId;
      session.userName = user.name ?? user.email ?? session.userName;
      session.userEmail = user.email ?? session.userEmail;
      session.save?.();
      return reply.send(user);
    } catch (err: any) {
      const status = authErrorStatus(err);
      if (status === 401) await session.destroy?.();
      return reply.code(status || 401).send({ error: err.message ?? "Token expired" });
    }
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await request.session.destroy();
    return reply.send({ message: "Signed out" });
  });
}
