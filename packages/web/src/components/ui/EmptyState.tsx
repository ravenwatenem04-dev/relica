"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = "\u{1F916}", title, subtitle }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{icon}</span>
      <p style={{ color: "#aaa", margin: 0, fontSize: "1rem" }}>{title}</p>
      {subtitle && (
        <p style={{ color: "#666", margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
