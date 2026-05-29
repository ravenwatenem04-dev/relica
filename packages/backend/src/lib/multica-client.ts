export class MulticaApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "MulticaApiError";
    this.status = status;
    this.code = code;
  }
}

export class MulticaClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(30000) });
    } catch (err: any) {
      if (err.name === "TimeoutError") {
        throw new MulticaApiError(0, "timeout", "Request timed out after 30s");
      }
      throw new MulticaApiError(0, "network_error", err.message || "Network error");
    }

    if (response.status >= 500 && response.status < 600) {
      await new Promise((r) => setTimeout(r, 1000));
      response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(30000) });
    }

    if (!response.ok) {
      let body: any;
      try {
        body = await response.json();
      } catch {
        body = {};
      }
      throw new MulticaApiError(
        response.status,
        body.code || "api_error",
        body.message || body.error || `HTTP ${response.status}`
      );
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  workspaces = {
    list: () => this.request<any[]>("/api/workspaces"),
    get: (id: string) => this.request<any>(`/api/workspaces/${encodeURIComponent(id)}`),
  };

  projects = {
    list: (workspaceId: string) =>
      this.request<any[]>(`/api/workspaces/${encodeURIComponent(workspaceId)}/projects`),
    get: (id: string) => this.request<any>(`/api/projects/${encodeURIComponent(id)}`),
  };

  agents = {
    list: (workspaceId?: string) =>
      this.request<any[]>(workspaceId ? `/api/agents?workspace_id=${encodeURIComponent(workspaceId)}` : "/api/agents"),
    get: (id: string) => this.request<any>(`/api/agents/${encodeURIComponent(id)}`),
  };

  issues = {
    list: (params?: { workspace_id?: string; status?: string; priority?: string; project_id?: string; search?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.workspace_id) qs.set("workspace_id", params.workspace_id);
      if (params?.status) qs.set("status", params.status);
      if (params?.priority) qs.set("priority", params.priority);
      if (params?.project_id) qs.set("project_id", params.project_id);
      if (params?.search) qs.set("search", params.search);
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      return this.request<any>(`/api/issues?${qs.toString()}`);
    },
    get: (id: string) => this.request<any>(`/api/issues/${encodeURIComponent(id)}`),
    create: (data: any) => this.request<any>("/api/issues", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      this.request<any>(`/api/issues/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      this.request<any>(`/api/issues/${encodeURIComponent(id)}/status`, { method: "POST", body: JSON.stringify({ status }) }),
  };

  comments = {
    list: (issueId: string) =>
      this.request<any[]>(`/api/issues/${encodeURIComponent(issueId)}/comments`),
    add: (issueId: string, data: { content: string; parent_id?: string }) =>
      this.request<any>(`/api/issues/${encodeURIComponent(issueId)}/comments`, { method: "POST", body: JSON.stringify(data) }),
  };

  metadata = {
    list: (issueId: string) =>
      this.request<Record<string, any>>(`/api/issues/${encodeURIComponent(issueId)}/metadata`),
    set: (issueId: string, key: string, value: string) =>
      this.request<void>(`/api/issues/${encodeURIComponent(issueId)}/metadata`, {
        method: "POST",
        body: JSON.stringify({ key, value }),
      }),
  };

  user = {
    me: () => this.request<any>("/api/user/me"),
  };
}
