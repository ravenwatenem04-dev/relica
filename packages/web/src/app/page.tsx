"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid token");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f0f1a" }}>
      <form onSubmit={handleLogin} style={{ background: "#1a1a2e", padding: "2rem", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem", color: "#fff" }}>Multica Console</h1>
        <p style={{ color: "#888", margin: "0 0 1.5rem", fontSize: "0.875rem" }}>Sign in with your Multica API token</p>

        <label style={{ display: "block", color: "#aaa", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          API Token
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your token here"
          style={{ width: "100%", padding: "0.75rem", background: "#16213e", border: "1px solid #2a2a4a", borderRadius: "8px", color: "#fff", fontSize: "1rem", boxSizing: "border-box" }}
        />

        {error && <p style={{ color: "#e05555", margin: "0.75rem 0 0", fontSize: "0.875rem" }}>{error}</p>}

        <button
          type="submit"
          disabled={!token || loading}
          style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", background: loading ? "#3a3a5a" : "#4dc8a2", color: "#0f0f1a", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 600, cursor: token ? "pointer" : "not-allowed" }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
