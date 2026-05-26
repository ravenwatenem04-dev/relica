import type { ConnectionState } from "../../hooks/useRealtimeEvents.js";

interface LiveIndicatorProps {
  state: ConnectionState;
}

const stateStyles: Record<ConnectionState, string> = {
  connected: "bg-green-500 shadow-green-500/50",
  reconnecting: "bg-yellow-500 shadow-yellow-500/50",
  disconnected: "bg-red-500 shadow-red-500/50",
};

const stateLabels: Record<ConnectionState, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting...",
  disconnected: "Disconnected",
};

export function LiveIndicator({ state }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2" title={stateLabels[state]}>
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${stateStyles[state]}`}
      />
      <span className="text-xs text-gray-500 hidden sm:inline">
        {stateLabels[state]}
      </span>
    </div>
  );
}
