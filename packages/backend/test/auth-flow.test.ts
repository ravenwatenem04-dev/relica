import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

async function buildApp() {
  vi.resetModules();
  vi.stubEnv("MULTICA_API_URL", "https://api.multica.test");
  vi.stubEnv("SESSION_SECRET", "test-session-secret");

  const [{ default: authPlugin }, { default: authRoutes }, { default: agentRoutes }, { default: issuesRoutes }] =
    await Promise.all([
      import("../src/plugins/auth.js"),
      import("../src/routes/auth.js"),
      import("../src/routes/agents.js"),
      import("../src/routes/issues.js"),
    ]);

  const app = Fastify({ logger: false });
  const sessionStore = new Map<string, Record<string, any>>();

  app.decorateRequest("session", null);
  app.addHook("onRequest", async (request, reply) => {
    const cookieHeader = request.headers.cookie ?? "";
    const match = /multica_session=([^;]+)/.exec(cookieHeader);
    let sessionId = match?.[1];
    let session = sessionId ? sessionStore.get(sessionId) : undefined;

    if (!session) {
      sessionId = "test-session";
      session = {};
      sessionStore.set(sessionId, session);
    }

    session.save = () => sessionStore.set(sessionId!, session!);
    session.destroy = () => sessionStore.delete(sessionId!);
    (request as any).session = session;
    reply.header("Set-Cookie", `multica_session=${sessionId}; Path=/; HttpOnly`);
  });

  await app.register(authPlugin);
  await app.register(authRoutes);
  await app.register(agentRoutes);
  await app.register(issuesRoutes);

  return app;
}

describe("Multica auth flow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("stores workspace and user fields from /api/user/me during login", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        workspace_id: "workspace-1",
      })
    );
    const app = await buildApp();

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { token: "token-1" },
    });
    expect(login.statusCode).toBe(200);
    const cookie = login.headers["set-cookie"] as string;

    fetchMock.mockResolvedValueOnce(makeResponse({ agents: [], total: 0 }));
    const agents = await app.inject({
      method: "GET",
      url: "/api/agents",
      headers: { cookie },
    });

    expect(agents.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "https://api.multica.test/api/agents?workspace_id=workspace-1&limit=50&offset=0",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      })
    );

    await app.close();
  });

  it("returns the required 401 response shape when a proxy route has no session", async () => {
    const app = await buildApp();

    const response = await app.inject({ method: "GET", url: "/api/issues" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: "Authentication required" });

    await app.close();
  });

  it("returns Multica API errors without converting them to 500s", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        makeResponse({
          id: "user-1",
          name: "Ada",
          email: "ada@example.com",
          workspace_id: "workspace-1",
        })
      )
      .mockResolvedValueOnce(makeResponse({ error: "Workspace not found" }, 404));
    const app = await buildApp();

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { token: "token-1" },
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/issues",
      headers: { cookie: login.headers["set-cookie"] as string },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Workspace not found" });

    await app.close();
  });
});
