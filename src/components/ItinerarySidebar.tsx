import React from 'react';
import type { DayItinerary, Activity, Hotel } from '../types/trip';
import { Calendar, MapPin, Hotel as HotelIcon, UtensilsCrossed, Landmark, X } from 'lucide-react';

interface ItinerarySidebarProps {
  days: DayItinerary[];
  selectedDay: number | null;
  selectedPlace: string | null;
  onDaySelect: (day: number | null) => void;
  onClose?: () => void;
  onActivityClick?: (item: Activity | Hotel) => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'restaurant':
      return <UtensilsCrossed className="w-4 h-4" />;
    case 'temple':
    case 'attraction':
      return <Landmark className="w-4 h-4" />;
    case 'beach':
    case 'activity':
      return <MapPin className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    hotel: 'bg-blue-50 text-blue-600',
    attraction: 'bg-orange-50 text-orange-600',
    restaurant: 'bg-red-50 text-red-600',
    beach: 'bg-cyan-50 text-cyan-600',
    temple: 'bg-purple-50 text-purple-600',
    activity: 'bg-green-50 text-green-600',
  };
  return colors[type] || 'bg-gray-50 text-gray-600';
};

// Helper function to get place name from day
function getPlaceName(day: DayItinerary): string {
  if (day.hotel) {
    const name = day.hotel.name;
    if (name.includes('Canggu')) return 'Canggu';
    if (name.includes('Ubud') || name.includes('Sayan')) return 'Ubud';
    if (name.includes('Munduk')) return 'Munduk';
    if (name.includes('Sidemen') || name.includes('Samanvaya')) return 'Sidemen';
    if (name.includes('Gili Trawangan') || name.includes('Almarik')) return 'Gili Trawangan';
    if (name.includes('Gili Air')) return 'Gili Air';
    if (name.includes('Nusa Penida') || name.includes('Warnakali')) return 'Nusa Penida';
    if (name.includes('Uluwatu') || name.includes('Bulgari')) return 'Uluwatu';
  }
  if (day.title.includes('Canggu')) return 'Canggu';
  if (day.title.includes('Ubud')) return 'Ubud';
  if (day.title.includes('Munduk')) return 'Munduk';
  if (day.title.includes('Sidemen')) return 'Sidemen';
  if (day.title.includes('Gili Trawangan')) return 'Gili Trawangan';
  if (day.title.includes('Gili Air')) return 'Gili Air';
  if (day.title.includes('Nusa Penida')) return 'Nusa Penida';
  if (day.title.includes('Uluwatu')) return 'Uluwatu';
  return 'Other';
}

// Get emoji for each place
function getPlaceEmoji(placeName: string): string {
  const emojiMap: Record<string, string> = {
    'Canggu': '🏖️',
    'Ubud': '🌿',
    'Munduk': '🏔️',
    'Sidemen': '🌾',
    'Gili Trawangan': '🏝️',
    'Gili Air': '🌊',
    'Nusa Penida': '⛰️',
    'Uluwatu': '🌅',
  };
  return emojiMap[placeName] || '📍';
}

export default function ItinerarySidebar({ days, selectedDay, selectedPlace, onDaySelect, onClose, onActivityClick }: ItinerarySidebarProps) {
  // Filter days by selected place
  const filteredDays = selectedPlace
    ? days.filter(day => getPlaceName(day) === selectedPlace)
    : days;

  // Get place color
  const getPlaceColor = (placeName: string): string => {
    const colors: Record<string, string> = {
      'Canggu': '#06B6D4',
      'Ubud': '#10B981',
      'Munduk': '#8B4513',
      'Sidemen': '#84CC16',
      'Gili Trawangan': '#3B82F6',
      'Gili Air': '#60A5FA',
      'Nusa Penida': '#1D4ED8',
      'Uluwatu': '#F97316',
    };
    return colors[placeName] || '#6B7280';
  };
  return (
    <div className="h-full overflow-y-auto bg-white rounded-xl shadow-premium-lg border border-gray-100">
      <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedPlace ? (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
                  style={{
                    backgroundColor: `${getPlaceColor(selectedPlace)}20`,
                    color: getPlaceColor(selectedPlace),
                    border: `2px solid ${getPlaceColor(selectedPlace)}40`
                  }}
                >
                  <span className="text-base">{getPlaceEmoji(selectedPlace)}</span>
                  <span>{selectedPlace}</span>
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
              )}
              <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 rounded-full text-gray-600">
                {filteredDays.length} day{filteredDays.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 flex-shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {filteredDays.map((day, index) => {
          const currentPlace = getPlaceName(day);
          const previousPlace = index > 0 ? getPlaceName(filteredDays[index - 1]) : null;
          const isPlaceChange = previousPlace && currentPlace !== previousPlace;
          const placeColor = getPlaceColor(currentPlace);

          return (
            <React.Fragment key={day.day}>
              {/* Place Change Divider */}
              {isPlaceChange && (() => {
                // Determine transportation and time
                const routes: Record<string, { icon: string; time: string }> = {
                  'Canggu→Ubud': { icon: '🚗', time: '1.5h' },
                  'Ubud→Munduk': { icon: '🚗', time: '2.5h' },
                  'Munduk→Sidemen': { icon: '🚗', time: '2h' },
                  'Sidemen→Gili Trawangan': { icon: '⛴️', time: '3.5h' },
                  'Gili Trawangan→Gili Air': { icon: '⛴️', time: '15m' },
                  'Gili Air→Nusa Penida': { icon: '⛴️', time: '2h' },
                  'Nusa Penida→Uluwatu': { icon: '⛴️', time: '2.5h' },
                };

                const routeKey = `${previousPlace}→${currentPlace}`;
                const transport = routes[routeKey] || { icon: '🚗', time: '~2h' };

                return (
                  <div className="flex items-center gap-3 py-3 px-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <div
                      className="flex items-center gap-2 text-xs font-semibold text-white px-3 py-1.5 rounded-full shadow-sm"
                      style={{ backgroundColor: placeColor }}
                    >
                      <span>{transport.icon}</span>
                      <span>{transport.time}</span>
                      <span>→ {currentPlace}</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                );
              })()}

              {/* Day Card */}
              <div
            className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 bg-white border-l-4 ${
              selectedDay === day.day
                ? 'border-l-travel-teal shadow-premium-sm border-r border-t border-b border-gray-200'
                : 'hover:border-l-gray-400 hover:shadow-premium-sm border-r border-t border-b border-gray-100'
            }`}
            style={{
              borderLeftColor: selectedDay === day.day ? placeColor : 'transparent'
            }}
            onClick={() => onDaySelect(day.day)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                    selectedDay === day.day ? 'bg-travel-teal' : 'bg-gray-100'
                  }`}>
                    <Calendar className={`w-4 h-4 ${
                      selectedDay === day.day ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${
                      selectedDay === day.day ? 'text-travel-teal' : 'text-gray-900'
                    }`}>
                      Day {day.day}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Place Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold mb-3 shadow-sm"
                style={{
                  backgroundColor: `${placeColor}20`,
                  color: placeColor,
                  border: `2px solid ${placeColor}40`
                }}
              >
                <span className="text-sm">{getPlaceEmoji(currentPlace)}</span>
                <span>{currentPlace}</span>
              </div>

              <h3 className="text-sm font-medium text-gray-900 mb-3">{day.title}</h3>

              {day.hotel && (
                <div
                  className="flex items-start gap-2.5 mb-3 pb-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivityClick?.(day.hotel!);
                  }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-50 flex-shrink-0 mt-0.5">
                    <HotelIcon className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 leading-relaxed">
                      {day.hotel.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {day.hotel.address.split(',')[0]}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {day.activities.slice(0, 3).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActivityClick?.(activity);
                    }}
                  >
                    <div className={`flex items-center justify-center w-6 h-6 rounded flex-shrink-0 mt-0.5 ${getTypeColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate leading-relaxed">
                        {activity.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {day.activities.length > 3 && (
                  <p className="text-xs text-gray-500 pl-8 pt-1">
                    +{day.activities.length - 3} more activities
                  </p>
                )}
              </div>
            </div>
          </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
