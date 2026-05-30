"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  const { data: agentsData, isLoading: agentsLoading, isError: agentsError } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: reviewsData, isLoading: reviewsLoading, isError: reviewsError } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", color: "#fff" }}>Dashboard</h1>
      <p style={{ color: "#aaa", margin: "0 0 2rem" }}>Welcome, {me?.name || me?.email || "User"}.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        <Link href="/dashboard/agents" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Agents</h3>
          <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>
            {agentsLoading ? "..." : agentsError ? "--" : (agentsData?.agents?.length ?? "--")}
          </p>
        </Link>
        <Link href="/dashboard/issues" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Issues</h3>
          <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
        </Link>
        <Link href="/dashboard/reviews" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Needs Review</h3>
          <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>
            {reviewsLoading ? "..." : reviewsError ? "--" : (reviewsData?.issues?.length ?? "--")}
          </p>
        </Link>
        <Link href="/dashboard/usage" style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Usage</h3>
          <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
        </Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#1a1a2e",
  padding: "1.25rem",
  borderRadius: "10px",
  textDecoration: "none",
  border: "1px solid #2a2a4a",
};
