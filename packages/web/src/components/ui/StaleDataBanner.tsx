interface StaleDataBannerProps {
  isStale: boolean;
  wasDisconnected: boolean;
  onRefresh: () => void;
}

export function StaleDataBanner({
  isStale,
  wasDisconnected,
  onRefresh,
}: StaleDataBannerProps) {
  if (wasDisconnected && !isStale) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 flex items-center justify-between">
        <span>Live updates paused. Reconnecting...</span>
      </div>
    );
  }

  if (isStale) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-50 border-b border-orange-200 px-4 py-2 text-sm text-orange-800 flex items-center justify-between">
        <span>Data may be stale.</span>
        <button
          onClick={onRefresh}
          className="ml-4 px-3 py-1 bg-orange-200 hover:bg-orange-300 rounded text-orange-900 font-medium transition-colors"
        >
          Click to refresh
        </button>
      </div>
    );
  }

  return null;
}
