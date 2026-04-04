import React from 'react';

interface MapDebugPanelProps {
  isUserInteracting: boolean;
  lastAnimatedId: string | null;
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number | null;
  lastAnimationAttempt: {
    source: string;
    timestamp: number;
    blocked: boolean;
  } | null;
}

export default function MapDebugPanel({
  isUserInteracting,
  lastAnimatedId,
  mapCenter,
  mapZoom,
  lastAnimationAttempt,
}: MapDebugPanelProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-20 left-4 z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-mono"
      >
        Show Debug 🐛
      </button>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-sm text-xs font-mono">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🐛 Map Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {/* User Interaction Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isUserInteracting ? 'bg-red-500 animate-pulse' : 'bg-green-500'
            }`}
          />
          <span>
            User Interacting:{' '}
            <span className={isUserInteracting ? 'text-red-400' : 'text-green-400'}>
              {isUserInteracting ? 'YES (BLOCKED)' : 'NO'}
            </span>
          </span>
        </div>

        {/* Last Animated ID */}
        <div>
          <span className="text-gray-400">Last Animated ID:</span>
          <br />
          <span className="text-cyan-400">{lastAnimatedId || 'None'}</span>
        </div>

        {/* Map Position */}
        <div>
          <span className="text-gray-400">Map Center:</span>
          <br />
          {mapCenter ? (
            <span className="text-yellow-400">
              {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
            </span>
          ) : (
            <span className="text-gray-500">Unknown</span>
          )}
        </div>

        {/* Zoom Level */}
        <div>
          <span className="text-gray-400">Zoom Level:</span>{' '}
          <span className="text-yellow-400">{mapZoom ? mapZoom.toFixed(1) : 'Unknown'}</span>
        </div>

        {/* Last Animation Attempt */}
        {lastAnimationAttempt && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <span className="text-gray-400">Last Animation Attempt:</span>
            <br />
            <span className={lastAnimationAttempt.blocked ? 'text-red-400' : 'text-green-400'}>
              {lastAnimationAttempt.blocked ? '🚫 BLOCKED' : '✅ SUCCESS'}
            </span>
            <br />
            <span className="text-gray-500">
              Source: {lastAnimationAttempt.source}
            </span>
            <br />
            <span className="text-gray-500">
              {new Date(lastAnimationAttempt.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400">
          <div className="text-[10px]">
            Click locations to test zoom. If "User Interacting" shows YES when you're NOT dragging,
            that's the bug!
          </div>
        </div>
      </div>
    </div>
  );
}
