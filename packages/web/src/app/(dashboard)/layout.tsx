"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/agents", label: "Agents" },
    { href: "/dashboard/issues", label: "Issues" },
    { href: "/dashboard/reviews", label: "Reviews" },
    { href: "/dashboard/usage", label: "Usage" },
  ];

  const linkStyle = (href: string): React.CSSProperties => ({
    color: pathname === href ? "#fff" : "#aaa",
    textDecoration: "none",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    background: pathname === href ? "#1a1a2e" : "transparent",
    display: "block",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f1a" }}>
      <nav style={{
        width: "220px", background: "#12122a", padding: "1.5rem 1rem",
        borderRight: "1px solid #2a2a4a", display: "flex", flexDirection: "column",
      }}>
        <h2 style={{ color: "#4dc8a2", margin: "0 0 2rem", fontSize: "1.1rem" }}>Multica Console</h2>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ ...linkStyle(item.href), marginBottom: "0.25rem" }}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1rem", background: "#12122a", borderBottom: "1px solid #2a2a4a",
        }}>
          <span style={{ color: "#4dc8a2", fontWeight: 600, fontSize: "0.95rem" }}>Multica Console</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none", border: "none", color: "#aaa", fontSize: "1.5rem",
              cursor: "pointer", padding: "0.25rem", lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </header>

        {menuOpen && (
          <div style={{ background: "#12122a", borderBottom: "1px solid #2a2a4a", padding: "0.5rem 1rem" }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={linkStyle(item.href)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
          <p style={{ margin: "0 0 1.5rem", color: "#aaa", fontSize: "0.9rem" }}>
            Welcome, {me?.name || me?.email || "User"}.
          </p>
          {children}
        </main>
      </div>

      <style>{`
        header { display: none !important; }
        @media (max-width: 640px) {
          nav { display: none !important; }
          header { display: flex !important; }
          main { padding: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
