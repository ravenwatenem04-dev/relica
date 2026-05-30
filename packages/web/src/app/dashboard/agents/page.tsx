"use client";

import { useQuery } from "@tanstack/react-query";

interface Agent {
  id: string;
  displayName: string;
  status: string;
  model: string;
  currentTask: { id: string; title: string } | null;
  capabilities: string[];
}

export default function AgentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div>
      <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Agents</h2>
      {isLoading && <p style={{ color: "#888" }}>Loading agents...</p>}
      {error && <p style={{ color: "#e05555" }}>Failed to load agents.</p>}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {(data.agents || []).map((a: Agent) => (
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
          ))}
          {data.agents?.length === 0 && <p style={{ color: "#888" }}>No agents found.</p>}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = { running: "#4dc8a2", available: "#888", blocked: "#e05555", disabled: "#555" };
  return <span style={{ width: 10, height: 10, borderRadius: "50%", background: colors[status] || "#555", display: "inline-block", flexShrink: 0 }} />;
}
