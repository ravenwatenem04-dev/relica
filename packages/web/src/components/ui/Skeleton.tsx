"use client";

import { type CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "6px", style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "#262638",
        animation: "skeleton-pulse 1.5s infinite ease-in-out",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ height = "60px" }: { height?: string | number }) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid #2a2a4a",
      }}
    >
      <Skeleton height={height} />
    </div>
  );
}

export function SkeletonRow({ height = "40px" }: { height?: string | number }) {
  return (
    <div style={{ borderBottom: "1px solid #2a2a4a", padding: "0.5rem 0" }}>
      <Skeleton height={height} />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div
      style={{
        background: "#1a1a2e",
        padding: "1.25rem",
        borderRadius: "10px",
        border: "1px solid #2a2a4a",
      }}
    >
      <Skeleton width="60%" height="0.8rem" style={{ marginBottom: "0.5rem" }} />
      <Skeleton width="40%" height="1.25rem" />
    </div>
  );
}

function SkeletonStyles() {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `
    }} />
  );
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkeletonStyles />
      {children}
    </>
  );
}
