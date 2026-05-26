import type { QueryClient } from "@tanstack/react-query";
import type { WorkspaceEvent } from "../../../backend/src/lib/event-store.js";

export function handleRealtimeEvent(
  queryClient: QueryClient,
  event: WorkspaceEvent
): void {
  switch (event.type) {
    case "issue.updated":
      queryClient.invalidateQueries({ queryKey: ["issues", event.entityId] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      break;

    case "issue.created":
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      break;

    case "agent.status_changed":
      queryClient.invalidateQueries({ queryKey: ["agents", event.entityId] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      break;

    case "comment.added": {
      const issueId = (event.data as Record<string, unknown>)?.issueId as
        | string
        | undefined;
      if (issueId) {
        queryClient.invalidateQueries({
          queryKey: ["issues", issueId, "comments"],
        });
      }
      break;
    }

    case "run.status_changed": {
      const runIssueId = (event.data as Record<string, unknown>)?.issueId as
        | string
        | undefined;
      const agentId = (event.data as Record<string, unknown>)?.agentId as
        | string
        | undefined;
      if (runIssueId) {
        queryClient.invalidateQueries({
          queryKey: ["issues", runIssueId, "runs"],
        });
      }
      if (agentId) {
        queryClient.invalidateQueries({
          queryKey: ["agents", agentId, "runs"],
        });
      }
      break;
    }
  }
}
