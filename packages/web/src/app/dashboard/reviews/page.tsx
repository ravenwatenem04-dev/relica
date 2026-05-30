"use client";

import { useQuery } from "@tanstack/react-query";
import { SkeletonCard, SkeletonPage } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  assigneeId: string | null;
  updatedAt: string;
}

export default function ReviewsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <SkeletonPage>
      <div>
        <h2 style={{ color: "#fff", margin: "0 0 1rem" }}>Needs Review</h2>
        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <SkeletonCard height="48px" />
            <SkeletonCard height="48px" />
          </div>
        )}
        {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}
        {data && (!data.issues || data.issues.length === 0) && (
          <EmptyState icon="💬" title="No reviews pending" subtitle="Issues awaiting review will appear here." />
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
    </SkeletonPage>
  );
}
