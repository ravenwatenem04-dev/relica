"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const { data: me, isError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
  });

  useEffect(() => {
    if (isError) router.push("/");
  }, [isError, router]);

  if (!me) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f0f1a", color: "#888" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a" }}>
      <aside style={{ width: "220px", background: "#12122a", padding: "1.5rem 1rem", borderRight: "1px solid #2a2a4a" }}>
        <h2 style={{ color: "#4dc8a2", margin: "0 0 2rem", fontSize: "1.1rem" }}>Multica Console</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="/dashboard" style={navStyle}>Dashboard</Link>
          <Link href="/dashboard/agents" style={navStyle}>Agents</Link>
          <Link href="/dashboard/issues" style={navStyle}>Issues</Link>
          <Link href="/dashboard/reviews" style={navStyle}>Reviews</Link>
          <Link href="/dashboard/usage" style={navStyle}>Usage</Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "2rem" }}>
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.75rem" }}>Dashboard</h1>
        <p style={{ color: "#aaa" }}>Welcome, {me?.name || me?.email || "User"}.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginTop: "2rem" }}>
          <Link href="/dashboard/agents" style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Agents</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
          </Link>
          <Link href="/dashboard/issues" style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Issues</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
          </Link>
          <Link href="/dashboard/reviews" style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Needs Review</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
          </Link>
          <Link href="/dashboard/usage" style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>Usage</h3>
            <p style={{ fontSize: "1.5rem", margin: "0.5rem 0 0", color: "#fff" }}>--</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  color: "#aaa",
  textDecoration: "none",
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  fontSize: "0.9rem",
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a2e",
  padding: "1.25rem",
  borderRadius: "10px",
  textDecoration: "none",
  border: "1px solid #2a2a4a",
};
