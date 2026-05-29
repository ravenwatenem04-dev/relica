"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function UsagePage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery({
    queryKey: ["usage", period],
    queryFn: async () => {
      const res = await fetch(`/api/usage/summary?period=${period}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Usage</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #2a2a4a",
            borderRadius: "6px", padding: "0.4rem 0.6rem", fontSize: "0.85rem",
          }}
        >
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
        </select>
      </div>

      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}

      {data && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem", marginBottom: "1.5rem",
          }}>
            <MetricCard label="Total Runs" value={data.totalRuns} />
            <MetricCard label="Successful" value={data.successfulRuns} />
            <MetricCard label="Failed" value={data.failedRuns} />
            {data.estimatedCost != null && (
              <MetricCard label="Est. Cost" value={`$${data.estimatedCost.toFixed(2)}`} />
            )}
          </div>

          {data.agentBreakdown?.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.75rem", color: "#ccc" }}>Top Agents</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.agentBreakdown.map((agent: any) => (
                  <div
                    key={agent.agentId}
                    style={{
                      background: "#1a1a2e", border: "1px solid #2a2a4a",
                      borderRadius: "8px", padding: "0.75rem 1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#fff", fontWeight: 500 }}>{agent.agentName}</span>
                      <span style={{ color: "#aaa", fontSize: "0.85rem" }}>
                        {agent.runCount} runs · {Math.round(agent.successRate * 100)}%
                      </span>
                    </div>
                    {agent.estimatedCost != null && (
                      <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.25rem" }}>
                        ${agent.estimatedCost.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: "10px",
      padding: "1rem", textAlign: "center",
    }}>
      <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "0.25rem", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff" }}>{value}</div>
    </div>
  );
}
