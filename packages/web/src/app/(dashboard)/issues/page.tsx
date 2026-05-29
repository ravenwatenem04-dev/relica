"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const statusColors: Record<string, string> = {
  todo: "#888",
  in_progress: "#4d8fc8",
  in_review: "#a855f7",
  done: "#4dc8a2",
  blocked: "#e05555",
  backlog: "#666",
  cancelled: "#555",
};

export default function IssuesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["issues", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");
      const res = await fetch(`/api/issues?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const issues = (data?.issues ?? []).filter((i: any) =>
    !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Issues</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #2a2a4a",
            borderRadius: "6px", padding: "0.4rem 0.6rem", fontSize: "0.85rem",
          }}
        >
          <option value="">All Statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <input
        type="text"
        placeholder="Search issues..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "0.6rem 0.75rem", marginBottom: "1rem", boxSizing: "border-box",
          background: "#16213e", border: "1px solid #2a2a4a", borderRadius: "8px", color: "#fff", fontSize: "0.9rem",
        }}
      />

      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {issues.map((issue: any) => (
          <div
            key={issue.id}
            style={{
              background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: "10px",
              padding: "0.85rem 1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span
                style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: statusColors[issue.status] || "#888", flexShrink: 0,
                }}
              />
              <span style={{ color: "#fff", fontWeight: 500, fontSize: "0.95rem" }}>
                {issue.title}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#888", marginLeft: "1.25rem" }}>
              <span>{issue.status.replace(/_/g, " ")}</span>
              {issue.priority && <span>· {issue.priority}</span>}
              {issue.assigneeId && <span>· {issue.assigneeId.slice(0, 8)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
