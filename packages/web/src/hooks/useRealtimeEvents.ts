import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { handleRealtimeEvent } from "../lib/event-handler.js";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

const RECONNECT_BANNER_DELAY = 10000;
const STALE_BANNER_DELAY = 60000;
const FALLBACK_POLL_INTERVAL = 30000;

export function useRealtimeEvents(): {
  connectionState: ConnectionState;
  wasDisconnected: boolean;
  isStale: boolean;
  manualRefresh: () => void;
} {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasDisconnectedRef = useRef(false);

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (staleTimerRef.current !== null) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
    if (fallbackIntervalRef.current !== null) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current !== null) return;
    fallbackIntervalRef.current = setInterval(() => {
      queryClient.invalidateQueries();
    }, FALLBACK_POLL_INTERVAL);
  }, [queryClient]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current !== null) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionState("connected");
      setWasDisconnected(wasDisconnectedRef.current);
      setIsStale(false);
      clearTimers();
      stopFallbackPolling();
    };

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse event");
      }
    };

    es.addEventListener("issue.updated", (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse issue.updated");
      }
    });

    es.addEventListener("issue.created", (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse issue.created");
      }
    });

    es.addEventListener("agent.status_changed", (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse agent.status_changed");
      }
    });

    es.addEventListener("comment.added", (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse comment.added");
      }
    });

    es.addEventListener("run.status_changed", (msg) => {
      try {
        const event = JSON.parse(msg.data);
        handleRealtimeEvent(queryClient, event);
      } catch {
        console.warn("[useRealtimeEvents] failed to parse run.status_changed");
      }
    });

    es.onerror = () => {
      setConnectionState("reconnecting");
      wasDisconnectedRef.current = true;
      setWasDisconnected(true);

      reconnectTimerRef.current = setTimeout(() => {
        startFallbackPolling();
      }, RECONNECT_BANNER_DELAY);

      staleTimerRef.current = setTimeout(() => {
        setIsStale(true);
      }, STALE_BANNER_DELAY);
    };
  }, [queryClient, clearTimers, startFallbackPolling, stopFallbackPolling]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      clearTimers();
      stopFallbackPolling();
    };
  }, [connect, clearTimers, stopFallbackPolling]);

  const manualRefresh = useCallback(() => {
    queryClient.invalidateQueries();
    if (connectionState !== "connected") {
      connect();
    }
  }, [queryClient, connectionState, connect]);

  return { connectionState, wasDisconnected, isStale, manualRefresh };
}
