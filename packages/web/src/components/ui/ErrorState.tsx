"use client";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        border: "1px solid #2a2a4a",
        borderLeft: "4px solid #e05555",
        borderRadius: "8px",
        padding: "1rem 1rem 1rem 1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <p style={{ color: "#e05555", margin: 0, fontSize: "0.9rem", flex: 1 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          background: "#e05555",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "0.4rem 0.9rem",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Retry
      </button>
    </div>
  );
}
