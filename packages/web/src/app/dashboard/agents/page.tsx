"use client";

import { useQuery } from "@tanstack/react-query";
import { SkeletonCard, SkeletonPage } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";

interface Agent {
  id: string;
  displayName: string;
  status: string;
  model: string;
  currentTask: { id: string; title: string } | null;
  capabilities: string[];
}

export default function AgentsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <SkeletonPage>
      <div>
        <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Agents</h2>
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
        {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
        {data && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data.agents?.length > 0 ? (
              (data.agents as Agent[]).map((a: Agent) => (
                <div key={a.id} style={{ background: "#1a1a2e", padding: "1rem", borderRadius: "8px", border: "1px solid #2a2a4a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <StatusDot status={a.status} />
                    <strong style={{ color: "#fff" }}>{a.displayName}</strong>
                    <span style={{ color: "#888", fontSize: "0.8rem" }}>{a.model}</span>
                  </div>
                  {a.currentTask && (
                    <p style={{ color: "#aaa", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                      Current: {a.currentTask.title}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <EmptyState icon="🤖" title="No agents found" subtitle="Agents will appear here once they are created." />
            )}
          </div>
        )}
      </div>
    </SkeletonPage>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { running: "#4dc8a2", available: "#888", blocked: "#e05555", disabled: "#555" };
  return <span style={{ width: 10, height: 10, borderRadius: "50%", background: colors[status] || "#555", display: "inline-block", flexShrink: 0 }} />;
}
