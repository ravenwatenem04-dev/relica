"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assigneeId: string | null;
  projectId: string | null;
  updatedAt: string;
}

export default function IssuesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["issues", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/issues?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const statuses = ["", "todo", "in_progress", "in_review", "done", "blocked"];

  return (
    <div>
      <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Issues</h2>
      <div style={{ marginBottom: "1rem" }}>
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            style={{
              background: statusFilter === s ? "#4dc8a2" : "#1a1a2e",
              color: statusFilter === s ? "#0f0f1a" : "#aaa",
              border: "1px solid #2a2a4a", borderRadius: "6px", padding: "0.35rem 0.75rem", marginRight: "0.5rem", marginBottom: "0.5rem", cursor: "pointer", fontSize: "0.8rem",
            }}>
            {s || "All"}
          </button>
        ))}
      </div>
      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}
      {error && <p style={{ color: "#e05555" }}>Failed to load issues.</p>}
      {data && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#888", fontSize: "0.8rem", textAlign: "left", borderBottom: "1px solid #2a2a4a" }}>
                <th style={{ padding: "0.5rem" }}>Status</th>
                <th style={{ padding: "0.5rem" }}>Title</th>
                <th style={{ padding: "0.5rem" }}>Priority</th>
                <th style={{ padding: "0.5rem" }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {(data.issues || []).map((i: Issue) => (
                <tr key={i.id} style={{ borderBottom: "1px solid #2a2a4a" }}>
                  <td style={{ padding: "0.5rem" }}><StatusBadge status={i.status} /></td>
                  <td style={{ padding: "0.5rem", color: "#fff" }}>{i.title}</td>
                  <td style={{ padding: "0.5rem", color: "#aaa", fontSize: "0.85rem" }}>{i.priority || "--"}</td>
                  <td style={{ padding: "0.5rem", color: "#888", fontSize: "0.8rem" }}>{new Date(i.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.issues?.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "1rem", color: "#888", textAlign: "center" }}>No issues found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { todo: "#555", in_progress: "#4dc8a2", in_review: "#c89b4d", done: "#888", blocked: "#e05555" };
  return <span style={{ background: colors[status] || "#555", color: "#fff", padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}>{status}</span>;
}
