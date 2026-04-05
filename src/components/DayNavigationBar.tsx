import React, { useState } from 'react';
import type { DayItinerary } from '../types/trip';
import { ChevronDown, Check } from 'lucide-react';

interface DayNavigationBarProps {
  days: DayItinerary[];
  selectedDay: number | null;
  selectedPlace: string | null;
  onDaySelect: (day: number | null) => void;
  onPlaceSelect: (place: string | null) => void;
}

interface PlaceGroup {
  placeName: string;
  days: DayItinerary[];
  startDate: string;
  endDate: string;
}

// Extract place name from hotel name or title
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
  if (day.title.includes('Denpasar') || day.title.includes('Airport') || day.title.includes('Departure')) return 'Uluwatu';
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

// Group consecutive days by place
function groupDaysByPlace(days: DayItinerary[]): PlaceGroup[] {
  const groups: PlaceGroup[] = [];
  let currentPlace = '';
  let currentDays: DayItinerary[] = [];

  days.forEach((day, index) => {
    const place = getPlaceName(day);

    if (place !== currentPlace && currentDays.length > 0) {
      groups.push({
        placeName: currentPlace,
        days: currentDays,
        startDate: currentDays[0].date,
        endDate: currentDays[currentDays.length - 1].date,
      });
      currentDays = [];
    }

    currentPlace = place;
    currentDays.push(day);

    if (index === days.length - 1) {
      groups.push({
        placeName: currentPlace,
        days: currentDays,
        startDate: currentDays[0].date,
        endDate: currentDays[currentDays.length - 1].date,
      });
    }
  });

  return groups;
}

export default function DayNavigationBar({ days, selectedDay, selectedPlace, onDaySelect, onPlaceSelect }: DayNavigationBarProps) {
  const [expandedPlace, setExpandedPlace] = useState<string | null>(null);

  const placeGroups = groupDaysByPlace(days);

  const handlePlaceClick = (placeName: string) => {
    console.log('🔘 DayNavigationBar: Place button clicked:', placeName);
    // Always trigger place selection (this will zoom the map and show pins)
    onPlaceSelect(placeName);

    // Don't auto-open dropdown - user can click chevron if they want to see days
    setExpandedPlace(null);
  };

  const handleChevronClick = (e: React.MouseEvent, placeName: string) => {
    e.stopPropagation(); // Prevent place button click
    // Toggle dropdown
    if (expandedPlace === placeName) {
      setExpandedPlace(null);
    } else {
      setExpandedPlace(placeName);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollBehavior: 'auto' }}>
      {/* View All Button */}
      <button
        onClick={() => {
          onDaySelect(null);
          onPlaceSelect(null);
          setExpandedPlace(null);
        }}
        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
          selectedDay === null && selectedPlace === null
            ? 'bg-travel-teal text-white shadow-premium-sm'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
        }`}
      >
        View All
      </button>

      {/* Place Pills */}
      {placeGroups.map((group, index) => {
        const isExpanded = expandedPlace === group.placeName;
        const isPlaceSelected = selectedPlace === group.placeName || group.days.some(d => d.day === selectedDay);

        // Determine transportation and travel time to this place
        const getTransportInfo = (placeName: string, prevPlaceName: string | null) => {
          if (!prevPlaceName) return null;

          const routes: Record<string, { icon: string; time: string }> = {
            'Canggu→Ubud': { icon: '🚗', time: '1.5h' },
            'Ubud→Munduk': { icon: '🚗', time: '2.5h' },
            'Munduk→Sidemen': { icon: '🚗', time: '2h' },
            'Sidemen→Gili Trawangan': { icon: '⛴️', time: '3.5h' },
            'Gili Trawangan→Gili Air': { icon: '⛴️', time: '15m' },
            'Gili Air→Nusa Penida': { icon: '⛴️', time: '2h' },
            'Nusa Penida→Uluwatu': { icon: '⛴️', time: '2.5h' },
          };

          const routeKey = `${prevPlaceName}→${placeName}`;
          return routes[routeKey] || { icon: '🚗', time: '~2h' };
        };

        const prevPlace = index > 0 ? placeGroups[index - 1].placeName : null;
        const transportInfo = getTransportInfo(group.placeName, prevPlace);

        return (
          <React.Fragment key={group.placeName}>
            {/* Transportation Icon with Time */}
            {transportInfo && (
              <div className="flex flex-col items-center justify-center flex-shrink-0 px-2">
                <span className="text-base opacity-60">{transportInfo.icon}</span>
                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">{transportInfo.time}</span>
              </div>
            )}

            <div className="relative flex-shrink-0">
            {/* Place Button */}
            <button
              onClick={() => handlePlaceClick(group.placeName)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                isPlaceSelected
                  ? 'bg-travel-teal text-white border-travel-teal shadow-premium-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{getPlaceEmoji(group.placeName)}</span>
                <span className="whitespace-nowrap">{group.placeName}</span>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  isPlaceSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {group.days.length}d
                </span>
                <span
                  onClick={(e) => handleChevronClick(e, group.placeName)}
                  className="cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isExpanded && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-premium-lg border border-gray-100 z-50 min-w-[240px] py-2 animate-slide-up">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group.placeName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateRange(group.startDate, group.endDate)}</p>
                </div>
                <div className="py-1">
                  {group.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => {
                        onDaySelect(day.day);
                        setExpandedPlace(null);
                      }}
                      className={`w-full px-3 py-2.5 text-left transition-colors flex items-center justify-between ${
                        selectedDay === day.day
                          ? 'bg-gray-50 text-travel-teal'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">Day {day.day}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      {selectedDay === day.day && (
                        <Check className="w-4 h-4 text-travel-teal" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
