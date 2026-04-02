import { Clock, Check, X, Star } from 'lucide-react';
import type { OpeningHours } from '../types/trip';

interface OpeningHoursDisplayProps {
  openingHours?: OpeningHours;
  rating?: number;
  compact?: boolean;
  inline?: boolean;
}

function isOpenNow(openingHours: OpeningHours): { open: boolean; closingTime?: string; openingTime?: string } {
  if (openingHours.is24Hours) {
    return { open: true };
  }

  if (!openingHours.periods || openingHours.periods.length === 0) {
    return { open: false };
  }

  const now = new Date();
  // Convert to Bali timezone (UTC+8)
  const baliTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
  const currentDay = baliTime.getDay(); // 0-6
  const currentTime = baliTime.getHours() * 60 + baliTime.getMinutes(); // minutes since midnight

  // Find today's period
  const todayPeriod = openingHours.periods.find(p => p.day === currentDay);

  if (!todayPeriod) {
    // Find next opening day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      const nextPeriod = openingHours.periods.find(p => p.day === nextDay);
      if (nextPeriod) {
        return { open: false, openingTime: nextPeriod.open };
      }
    }
    return { open: false };
  }

  // Parse opening and closing times
  if (!todayPeriod.open || !todayPeriod.close) {
    return { open: false };
  }

  const openParts = todayPeriod.open.split(':');
  const closeParts = todayPeriod.close.split(':');

  if (openParts.length < 2 || closeParts.length < 2) {
    return { open: false };
  }

  const [openHour, openMin] = openParts.map(Number);
  const [closeHour, closeMin] = closeParts.map(Number);

  if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
    return { open: false };
  }

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle places that close after midnight
  if (closeTime < openTime) {
    // Open past midnight
    const isOpen = currentTime >= openTime || currentTime < closeTime;
    return { open: isOpen, closingTime: isOpen ? todayPeriod.close : undefined, openingTime: !isOpen ? todayPeriod.open : undefined };
  } else {
    const isOpen = currentTime >= openTime && currentTime < closeTime;
    return { open: isOpen, closingTime: isOpen ? todayPeriod.close : undefined, openingTime: !isOpen ? todayPeriod.open : undefined };
  }
}

export default function OpeningHoursDisplay({ openingHours, rating, compact = false, inline = false }: OpeningHoursDisplayProps) {
  if (!openingHours) return null;

  let status;
  try {
    status = isOpenNow(openingHours);
  } catch (error) {
    console.error('Error checking open status:', error);
    return null;
  }

  // Inline mode: status and rating on SAME LINE (horizontal)
  if (inline && compact) {
    return (
      <>
        {openingHours.is24Hours ? (
          <div className="flex items-center gap-1 bg-green-50 border border-green-400 px-2 py-1 rounded-lg whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span className="font-bold text-green-700 text-xs">Open 24/7</span>
          </div>
        ) : (
          status && status.open ? (
            <div className="flex items-center gap-1 bg-green-50 border border-green-400 px-2 py-1 rounded-lg whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="font-bold text-green-700 text-xs">
                Open • {status.closingTime || 'late'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-red-50 border border-red-400 px-2 py-1 rounded-lg whitespace-nowrap">
              <X className="w-3.5 h-3.5 text-red-600" />
              <span className="font-bold text-red-700 text-xs">
                {status && status.openingTime ? `Opens ${status.openingTime}` : 'Closed'}
              </span>
            </div>
          )
        )}
        {rating && (
          <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-2 py-1 rounded-lg">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-yellow-700 font-bold text-xs">{rating}</span>
          </div>
        )}
      </>
    );
  }

  // Compact mode: only show status line
  if (compact) {
    return (
      <div className="mb-2">
        {openingHours.is24Hours ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-50 border border-green-400">
            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-green-700 text-xs">Open 24/7</span>
            </div>
            {rating && (
              <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-1.5 py-0.5 rounded">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-yellow-700 font-bold text-xs">{rating}</span>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
            status && status.open
              ? 'bg-green-50 border border-green-400'
              : 'bg-red-50 border border-red-400'
          }`}>
            {status && status.open ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-green-700 text-xs">Open</span>
                  {status.closingTime && (
                    <span className="text-xs text-green-600 ml-1">
                      • Closes at {status.closingTime}
                    </span>
                  )}
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-yellow-700 font-bold text-xs">{rating}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-red-700 text-xs">Closed</span>
                  {status && status.openingTime && (
                    <span className="text-xs text-red-600 ml-1">
                      • Opens at {status.openingTime}
                    </span>
                  )}
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-yellow-700 font-bold text-xs">{rating}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode (unused now, but kept for potential future use)
  return (
    <div className="space-y-2 mb-2">
      {/* 24 Hours Badge */}
      {openingHours.is24Hours && (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-bold text-xs">Open 24/7</span>
            {rating && (
              <div className="ml-auto flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded">
                <Star className="w-3 h-3 fill-white text-white" />
                <span className="text-white font-bold text-xs">{rating}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Regular Hours */}
      {!openingHours.is24Hours && openingHours.weekdayText && Array.isArray(openingHours.weekdayText) && openingHours.weekdayText.length > 0 && (
        <>
          {/* Open/Closed Status - Compact with Rating */}
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
            status && status.open
              ? 'bg-green-50 border border-green-400'
              : 'bg-red-50 border border-red-400'
          }`}>
            {status && status.open ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-green-700 text-xs">Open</span>
                  {status.closingTime && (
                    <span className="text-xs text-green-600 ml-1">
                      • Closes at {status.closingTime}
                    </span>
                  )}
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-yellow-700 font-bold text-xs">{rating}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-red-700 text-xs">Closed</span>
                  {status && status.openingTime && (
                    <span className="text-xs text-red-600 ml-1">
                      • Opens at {status.openingTime}
                    </span>
                  )}
                </div>
                {rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-1.5 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-yellow-700 font-bold text-xs">{rating}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Opening Hours List - Compact */}
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <h4 className="font-semibold text-xs text-gray-700">Hours</h4>
            </div>
            <div className="space-y-0.5">
              {openingHours.weekdayText.map((text, idx) => {
                // Parse the text - handle both English and other locales
                const parts = text.split(': ');
                const hours = parts.length > 1 ? parts.slice(1).join(': ') : 'Closed';

                // Use the index to get the correct English day name
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const day = dayNames[idx % 7];

                const todayName = new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar', weekday: 'long' });
                const isToday = todayName === fullDayNames[idx % 7];

                return (
                  <div
                    key={idx}
                    className={`flex justify-between text-xs ${
                      isToday ? 'font-bold text-travel-teal' : 'text-gray-600'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isToday && <span className="text-xs">▶</span>}
                      {day}
                    </span>
                    <span className={`text-right text-xs ${isToday ? 'text-travel-teal font-bold' : 'text-gray-600'}`}>
                      {hours || 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
