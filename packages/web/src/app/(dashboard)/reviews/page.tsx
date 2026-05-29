"use client";

import { useQuery } from "@tanstack/react-query";

export default function ReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/issues?status=in_review&limit=50");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const issues = data?.issues ?? [];

  async function approve(id: string) {
    await fetch(`/api/issues/${id}/review/approve`, { method: "POST" });
  }

  async function requestChanges(id: string) {
    await fetch(`/api/issues/${id}/review/request-changes`, { method: "POST" });
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.5rem" }}>Needs Review</h1>
      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}
      {issues.length === 0 && !isLoading && (
        <p style={{ color: "#888" }}>No issues in review.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {issues.map((issue: any) => (
          <div
            key={issue.id}
            style={{
              background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: "10px", padding: "1rem",
            }}
          >
            <div style={{ fontWeight: 500, color: "#fff", marginBottom: "0.25rem" }}>
              {issue.title}
            </div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#888" }}>
              {issue.description?.slice(0, 200) || "No description"}
            </p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => approve(issue.id)}
                style={{
                  padding: "0.4rem 1rem", background: "#1a3a2a", color: "#4dc8a2",
                  border: "1px solid #4dc8a2", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                Approve
              </button>
              <button
                onClick={() => requestChanges(issue.id)}
                style={{
                  padding: "0.4rem 1rem", background: "#3a1a1a", color: "#e05555",
                  border: "1px solid #e05555", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem",
                }}
              >
                Request Changes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
