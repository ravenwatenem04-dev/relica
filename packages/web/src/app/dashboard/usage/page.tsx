"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function UsagePage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, error } = useQuery({
    queryKey: ["usage", period],
    queryFn: async () => {
      const res = await fetch(`/api/usage/summary?period=${period}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div>
      <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Usage Analytics</h2>
      <div style={{ marginBottom: "1rem" }}>
        {["7d", "30d", "90d"].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{
              background: period === p ? "#4dc8a2" : "#1a1a2e",
              color: period === p ? "#0f0f1a" : "#aaa",
              border: "1px solid #2a2a4a", borderRadius: "6px", padding: "0.35rem 0.75rem", marginRight: "0.5rem", cursor: "pointer", fontSize: "0.8rem",
            }}>
            {p}
          </button>
        ))}
      </div>
      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}
      {error && <p style={{ color: "#e05555" }}>Failed to load usage data.</p>}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          <StatCard label="Total Runs" value={data.totalRuns} />
          <StatCard label="Successful" value={data.successfulRuns} />
          <StatCard label="Failed" value={data.failedRuns} />
          <StatCard label="Est. Cost" value={data.estimatedCost != null ? `$${data.estimatedCost.toFixed(2)}` : "N/A"} />
          <StatCard label="Input Tokens" value={data.totalTokens?.input?.toLocaleString() || "N/A"} />
          <StatCard label="Output Tokens" value={data.totalTokens?.output?.toLocaleString() || "N/A"} />
        </div>
      )}
      {data && data.agentBreakdown?.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "#ccc", margin: "0 0 0.75rem" }}>Top Agents</h3>
          {data.agentBreakdown.slice(0, 5).map((a: any) => (
            <div key={a.agentId} style={{ background: "#1a1a2e", padding: "0.5rem 1rem", borderRadius: "6px", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#fff" }}>{a.agentName}</span>
              <span style={{ color: "#888" }}>{a.runCount} runs</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#1a1a2e", padding: "1.25rem", borderRadius: "10px", border: "1px solid #2a2a4a" }}>
      <p style={{ color: "#888", margin: 0, fontSize: "0.8rem" }}>{label}</p>
      <p style={{ color: "#fff", margin: "0.5rem 0 0", fontSize: "1.25rem" }}>{value}</p>
    </div>
  );
}
