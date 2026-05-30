"use client";

import { useQuery } from "@tanstack/react-query";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assigneeId: string | null;
  updatedAt: string;
}

export default function ReviewsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div>
      <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Needs Review</h2>
      {isLoading && <p style={{ color: "#888" }}>Loading...</p>}
      {error && <p style={{ color: "#e05555" }}>Failed to load.</p>}
      {data && (!data.issues || data.issues.length === 0) && (
        <p style={{ color: "#888" }}>No issues waiting for review.</p>
      )}
      {data && data.issues?.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.issues.map((i: Issue) => (
            <div key={i.id} style={{ background: "#1a1a2e", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #2a2a4a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#fff" }}>{i.title}</span>
              <span style={{ color: "#888", fontSize: "0.8rem" }}>{i.priority || "--"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
