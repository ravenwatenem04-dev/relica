"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: me, isError, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && pathname !== "/") router.push("/");
  }, [isError, router, pathname]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f0f1a", color: "#888" }}>
        Loading...
      </div>
    );
  }

  if (!me) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a" }}>
      <aside style={{ width: "220px", background: "#12122a", padding: "1.5rem 1rem", borderRight: "1px solid #2a2a4a", flexShrink: 0 }}>
        <h2 style={{ color: "#4dc8a2", margin: "0 0 2rem", fontSize: "1.1rem" }}>Multica Console</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link href="/dashboard" style={navStyle}>Dashboard</Link>
          <Link href="/dashboard/agents" style={navStyle}>Agents</Link>
          <Link href="/dashboard/issues" style={navStyle}>Issues</Link>
          <Link href="/dashboard/reviews" style={navStyle}>Reviews</Link>
          <Link href="/dashboard/usage" style={navStyle}>Usage</Link>
        </nav>
        <div style={{ position: "absolute", bottom: "1.5rem", left: "1rem", right: "1rem" }}>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }}
            style={{ width: "100%", padding: "0.5rem", background: "transparent", border: "1px solid #3a3a5a", borderRadius: "6px", color: "#888", cursor: "pointer", fontSize: "0.8rem" }}>
            Sign Out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
        {children}
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
  display: "block",
};
