export interface MulticaIssue {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  assignee_id: string | null;
  assignee_type: string | null;
  creator_id: string;
  creator_type: string;
  parent_issue_id: string | null;
  project_id: string;
  workspace_id: string;
  position: number;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface MulticaIssueListResponse {
  items: MulticaIssue[];
  total: number;
}

export interface MulticaAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface MulticaAgentListResponse {
  items: MulticaAgent[];
  total: number;
}

export interface MulticaComment {
  id: string;
  issue_id: string;
  content: string;
  author_id: string;
  author_type: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MulticaUsageSummary {
  period: { from: string; to: string };
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  total_tokens: { input: number; output: number } | null;
  estimated_cost: number | null;
  agent_breakdown: MulticaAgentUsage[];
  model_breakdown: MulticaModelUsage[];
  daily_trend: MulticaDailyUsage[];
  data_available: boolean;
}

export interface MulticaAgentUsage {
  agent_id: string;
  agent_name: string;
  run_count: number;
  success_rate: number;
  total_tokens: { input: number; output: number } | null;
  estimated_cost: number | null;
}

export interface MulticaModelUsage {
  model: string;
  run_count: number;
  total_tokens: { input: number; output: number } | null;
  estimated_cost: number | null;
}

export interface MulticaDailyUsage {
  date: string;
  run_count: number;
  cost: number | null;
}

export interface MulticaCreateIssuePayload {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  assignee_id?: string;
  parent_issue_id?: string;
  project_id?: string;
  due_date?: string;
  start_date?: string;
}

export interface MulticaIssueFilters {
  workspace_id?: string;
  status?: string;
  priority?: string;
  project_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MulticaUsagePeriod {
  from: string;
  to: string;
}
