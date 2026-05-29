"use client";

import { useQuery } from "@tanstack/react-query";

export default function AgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem" }}>Agents</h1>
      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}
      {agents?.agents?.length === 0 && (
        <p style={{ color: "#888" }}>No agents found.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {agents?.agents?.map((agent: any) => (
          <div
            key={agent.id}
            style={{
              background: "#1a1a2e",
              border: "1px solid #2a2a4a",
              borderRadius: "10px",
              padding: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <strong style={{ color: "#fff" }}>{agent.displayName}</strong>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  background:
                    agent.status === "running" ? "#1a3a2a" :
                    agent.status === "available" ? "#1a2a3a" : "#2a2a2a",
                  color:
                    agent.status === "running" ? "#4dc8a2" :
                    agent.status === "available" ? "#4d8fc8" : "#888",
                }}
              >
                {agent.status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#aaa" }}>{agent.model}</p>
            {agent.currentTask && (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#4dc8a2" }}>
                Current: {agent.currentTask.title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
