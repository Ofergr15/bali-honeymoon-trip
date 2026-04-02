import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ACTIVITY_COLORS, AREA_COLORS } from '../utils/colors';

export default function ColorLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-6 z-10">
      <div className="bg-white rounded-xl shadow-premium-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900 text-sm">Color Guide</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Content */}
        {isOpen && (
          <div className="px-4 pb-4 max-h-96 overflow-y-auto">
            {/* Activity Types */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Activity Types
              </h4>
              <div className="space-y-2">
                {Object.entries(ACTIVITY_COLORS).map(([key, info]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{
                        backgroundColor: info.color,
                        borderColor: info.color
                      }}
                    />
                    <span className="text-sm">{info.emoji}</span>
                    <span className="text-sm text-gray-700">{info.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3" />

            {/* Geographic Areas */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Geographic Areas
              </h4>
              <div className="space-y-2">
                {Object.entries(AREA_COLORS)
                  .filter(([key]) => key !== 'Bali') // Exclude default
                  .map(([key, info]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border-2"
                        style={{
                          backgroundColor: `${info.color}30`,
                          borderColor: info.color
                        }}
                      />
                      <span className="text-sm">{info.emoji}</span>
                      <span className="text-sm text-gray-700">{info.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Info */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                💡 <strong>Tip:</strong> Click any marker to see details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
