export interface EnvConfig {
  MULTICA_API_URL: string;
  MULTICA_API_TOKEN: string;
  REDIS_URL: string;
  SESSION_SECRET: string;
  PORT: number;
  POLL_INTERVAL_MS: number;
}

export function loadConfig(): EnvConfig {
  const port = parseInt(process.env["PORT"] ?? "3001", 10);
  if (isNaN(port)) throw new Error("PORT must be a number");

  const pollInterval = parseInt(process.env["POLL_INTERVAL_MS"] ?? "5000", 10);
  if (isNaN(pollInterval)) throw new Error("POLL_INTERVAL_MS must be a number");

  const baseUrl = process.env["MULTICA_API_URL"];
  if (!baseUrl) throw new Error("MULTICA_API_URL is required");

  const sessionSecret = process.env["SESSION_SECRET"];
  if (!sessionSecret) throw new Error("SESSION_SECRET is required");

  return {
    MULTICA_API_URL: baseUrl,
    MULTICA_API_TOKEN: process.env["MULTICA_API_TOKEN"] ?? "",
    REDIS_URL: process.env["REDIS_URL"] ?? "redis://localhost:6379",
    SESSION_SECRET: sessionSecret,
    PORT: port,
    POLL_INTERVAL_MS: Math.max(2000, Math.min(30000, pollInterval)),
  };
}

export const config = loadConfig();
