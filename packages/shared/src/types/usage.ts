export interface WorkspaceUsageSummary {
  period: { from: string; to: string };
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalTokens: { input: number; output: number } | null;
  estimatedCost: number | null;
  agentBreakdown: AgentUsage[];
  modelBreakdown: ModelUsage[];
  dailyTrend: DailyUsage[];
  dataAvailable: boolean;
}

export interface AgentUsage {
  agentId: string;
  agentName: string;
  runCount: number;
  successRate: number;
  totalTokens: { input: number; output: number } | null;
  estimatedCost: number | null;
}

export interface ModelUsage {
  model: string;
  runCount: number;
  totalTokens: { input: number; output: number } | null;
  estimatedCost: number | null;
}

export interface DailyUsage {
  date: string;
  runCount: number;
  cost: number | null;
}
