import type {
  MulticaIssue,
  MulticaIssueListResponse,
  MulticaAgent,
  MulticaAgentListResponse,
  MulticaComment,
  MulticaUsageSummary,
  MulticaCreateIssuePayload,
  MulticaIssueFilters,
  MulticaUsagePeriod,
} from "@multica-console/shared";

export class MulticaAPIError extends Error {
  readonly statusCode: number;
  readonly body: any;

  constructor(statusCode: number, message: string, body: any) {
    super(message);
    this.name = "MulticaAPIError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

type APIResult<T> = T | { error: MulticaAPIError };

const RETRYABLE_STATUSES = new Set([429, 502, 503]);
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

export class MulticaClient {
  private baseUrl: string;
  private token: string;
  private timeoutMs: number;

  constructor(baseUrl: string, token: string, timeoutMs = 10_000) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
    this.timeoutMs = timeoutMs;
  }

  async listIssues(filters?: MulticaIssueFilters): Promise<APIResult<MulticaIssueListResponse>> {
    const params: Record<string, any> = {};
    if (filters?.workspace_id) params.workspace_id = filters.workspace_id;
    if (filters?.status) params.status = filters.status;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.project_id) params.project_id = filters.project_id;
    if (filters?.search) params.search = filters.search;
    if (filters?.limit != null) params.limit = filters.limit;
    if (filters?.offset != null) params.offset = filters.offset;
    return this.safeRequest<MulticaIssueListResponse>("/api/issues", { params });
  }

  async getIssue(id: string): Promise<APIResult<MulticaIssue>> {
    return this.safeRequest<MulticaIssue>(`/api/issues/${encodeURIComponent(id)}`);
  }

  async createIssue(data: MulticaCreateIssuePayload): Promise<APIResult<MulticaIssue>> {
    return this.safeRequest<MulticaIssue>("/api/issues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateIssueStatus(id: string, status: string): Promise<APIResult<MulticaIssue>> {
    return this.safeRequest<MulticaIssue>(`/api/issues/${encodeURIComponent(id)}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  async listAgents(): Promise<APIResult<MulticaAgentListResponse>> {
    return this.safeRequest<MulticaAgentListResponse>("/api/agents");
  }

  async getAgent(id: string): Promise<APIResult<MulticaAgent>> {
    return this.safeRequest<MulticaAgent>(`/api/agents/${encodeURIComponent(id)}`);
  }

  async assignAgent(issueId: string, agentId: string): Promise<APIResult<MulticaIssue>> {
    return this.safeRequest<MulticaIssue>(`/api/issues/${encodeURIComponent(issueId)}/assign`, {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId }),
    });
  }

  async listComments(issueId: string): Promise<APIResult<MulticaComment[]>> {
    return this.safeRequest<MulticaComment[]>(`/api/issues/${encodeURIComponent(issueId)}/comments`);
  }

  async addComment(issueId: string, content: string, parentId?: string): Promise<APIResult<MulticaComment>> {
    const body: Record<string, string> = { content };
    if (parentId) body["parent_id"] = parentId;
    return this.safeRequest<MulticaComment>(`/api/issues/${encodeURIComponent(issueId)}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getUsageMetrics(period: MulticaUsagePeriod): Promise<APIResult<MulticaUsageSummary>> {
    const qs = new URLSearchParams({ from: period.from, to: period.to });
    return this.safeRequest<MulticaUsageSummary>(`/api/usage/summary?${qs.toString()}`);
  }

  issues = {
    list: (params?: Record<string, any>) =>
      this.request<{ issues: any[]; total: number }>("/api/issues", { method: "GET", params }),
    get: (id: string, params?: Record<string, any>) =>
      this.request<any>(`/api/issues/${encodeURIComponent(id)}`, { method: "GET", params }),
    create: (data: Record<string, any>) =>
      this.request<any>("/api/issues", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, any>) =>
      this.request<any>(`/api/issues/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      this.request<any>(`/api/issues/${encodeURIComponent(id)}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
  };

  agents = {
    list: (params?: Record<string, any>) =>
      this.request<{ agents: any[]; total: number }>("/api/agents", { method: "GET", params }),
    get: (id: string, params?: Record<string, any>) =>
      this.request<any>(`/api/agents/${encodeURIComponent(id)}`, { method: "GET", params }),
  };

  comments = {
    list: (issueId: string) =>
      this.request<any[]>(`/api/issues/${encodeURIComponent(issueId)}/comments`),
    add: (issueId: string, data: { content: string; parent_id?: string }) =>
      this.request<any>(`/api/issues/${encodeURIComponent(issueId)}/comments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  };

  runs = {
    list: (issueId: string) =>
      this.request<any[]>(`/api/issues/${encodeURIComponent(issueId)}/runs`),
    get: (runId: string) =>
      this.request<any>(`/api/runs/${encodeURIComponent(runId)}`),
    listByAgent: (agentId: string) =>
      this.request<any[]>(`/api/agents/${encodeURIComponent(agentId)}/runs`),
    cancel: (runId: string) =>
      this.request<void>(`/api/runs/${encodeURIComponent(runId)}/cancel`, { method: "POST" }),
    retry: (runId: string, issueId: string) =>
      this.request<any>(`/api/issues/${encodeURIComponent(issueId)}/runs/${encodeURIComponent(runId)}/retry`, {
        method: "POST",
      }),
  };

  user = {
    me: () => this.request<any>("/api/user/me"),
  };

  private async request<T>(path: string, options: RequestInit & { params?: Record<string, any> } = {}): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (options.params) {
      const qs = new URLSearchParams();
      for (const [key, val] of Object.entries(options.params)) {
        if (val != null) qs.set(key, String(val));
      }
      const q = qs.toString();
      if (q) url += `?${q}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const { params: _, ...fetchOptions } = options;

    let lastError: MulticaAPIError | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (response.ok) {
          if (response.status === 204) return {} as T;
          const body = await response.json();
          return body as T;
        }

        let errorBody: any;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { message: response.statusText };
        }

        const message = errorBody?.message || errorBody?.error || `HTTP ${response.status}`;
        lastError = new MulticaAPIError(response.status, message, errorBody);

        if (!RETRYABLE_STATUSES.has(response.status)) {
          throw lastError;
        }
      } catch (err: any) {
        if (err instanceof MulticaAPIError) {
          if (!RETRYABLE_STATUSES.has(err.statusCode)) {
            throw err;
          }
          lastError = err;
        } else if (err.name === "TimeoutError" || err.name === "AbortError") {
          lastError = new MulticaAPIError(0, "Request timed out", null);
          continue;
        } else {
          throw new MulticaAPIError(0, err.message || "Network error", null);
        }
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    throw lastError!;
  }

  private async safeRequest<T>(path: string, options: RequestInit & { params?: Record<string, any> } = {}): Promise<APIResult<T>> {
    try {
      const result = await this.request<T>(path, options);
      return result;
    } catch (err) {
      if (err instanceof MulticaAPIError) {
        return { error: err };
      }
      return { error: new MulticaAPIError(0, (err as Error).message || "Unknown error", null) };
    }
  }
}
