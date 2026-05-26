import type { FastifyInstance, FastifyRequest } from "fastify";
import { MulticaClient } from "../lib/multica-client.js";
import { config } from "../config.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/login", async (request: FastifyRequest<{ Body: { token: string } }>) => {
    const { token } = request.body;
    if (!token) return { statusCode: 400, error: "Token is required" };

    const client = new MulticaClient(config.MULTICA_API_URL, token);
    let user: any;
    try {
      user = await client.user.me();
    } catch (err: any) {
      if (err instanceof Error && err.message.includes("401")) {
        return { statusCode: 401, error: "Invalid token" };
      }
      return { statusCode: 401, error: "Invalid token" };
    }

    (request.session as any).token = token;
    (request.session as any).user = user;

    return { user, message: "Signed in" };
  });

  app.get("/api/auth/me", async (request) => {
    const token = (request.session as any)?.token;
    if (!token) return { statusCode: 401, error: "Not authenticated" };

    const client = new MulticaClient(config.MULTICA_API_URL, token);
    try {
      const user = await client.user.me();
      return user;
    } catch {
      return { statusCode: 401, error: "Token expired" };
    }
  });

  app.post("/api/auth/logout", async (request) => {
    await request.session.destroy();
    return { message: "Signed out" };
  });
}
