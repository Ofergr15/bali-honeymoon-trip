import { useState } from 'react';
import { X, Bookmark, MapPin, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { Activity } from '../types/trip';
import { getActivityTypeColor } from '../utils/colors';

// Known place locations in Bali with unique colors for each
const PLACE_LOCATIONS = {
  'Canggu': { lat: -8.6489, lng: 115.1328, emoji: '🏖️', color: '#06B6D4' }, // cyan
  'Ubud': { lat: -8.5069, lng: 115.2625, emoji: '🌿', color: '#10B981' }, // green
  'Munduk': { lat: -8.2661, lng: 115.0717, emoji: '🏔️', color: '#8B4513' }, // brown
  'Sidemen': { lat: -8.4833, lng: 115.4167, emoji: '🌾', color: '#84CC16' }, // lime
  'Gili Trawangan': { lat: -8.3500, lng: 116.0417, emoji: '🏝️', color: '#3B82F6' }, // blue
  'Gili Air': { lat: -8.3614, lng: 116.0861, emoji: '🌊', color: '#60A5FA' }, // light blue
  'Nusa Penida': { lat: -8.7292, lng: 115.5431, emoji: '⛰️', color: '#1D4ED8' }, // dark blue
  'Uluwatu': { lat: -8.8286, lng: 115.1036, emoji: '🌅', color: '#F97316' }, // orange
  'Seminyak': { lat: -8.6920, lng: 115.1737, emoji: '🌴', color: '#EC4899' }, // pink
};

// Calculate distance between two GPS coordinates (in km)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find the nearest place to given coordinates
function findNearestPlace(lat: number, lng: number): { name: string; distance: number; emoji: string; color: string } | null {
  let nearest: { name: string; distance: number; emoji: string; color: string } | null = null;
  let minDistance = Infinity;

  for (const [placeName, placeCoords] of Object.entries(PLACE_LOCATIONS)) {
    const distance = calculateDistance(lat, lng, placeCoords.lat, placeCoords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = { name: placeName, distance, emoji: placeCoords.emoji, color: placeCoords.color };
    }
  }

  return nearest;
}

interface BookmarksPanelProps {
  bookmarks: Activity[];
  onClose: () => void;
  onBookmarkClick: (activity: Activity) => void;
}

export default function BookmarksPanel({ bookmarks, onClose, onBookmarkClick }: BookmarksPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<Activity['type'] | 'all'>('all');
  const [filterLocation, setFilterLocation] = useState<string | 'all'>('all');

  // Add nearest place info to each bookmark
  const bookmarksWithLocation = bookmarks.map(bookmark => {
    const nearestPlace = findNearestPlace(bookmark.location.lat, bookmark.location.lng);
    return {
      ...bookmark,
      nearestPlace: nearestPlace?.name || 'Unknown',
      nearestPlaceEmoji: nearestPlace?.emoji || '📍',
      nearestPlaceColor: nearestPlace?.color || '#6B7280',
      distanceKm: nearestPlace?.distance || 0
    };
  });

  // Filter bookmarks based on selected type and location
  let filteredBookmarks = bookmarksWithLocation;

  if (filterType !== 'all') {
    filteredBookmarks = filteredBookmarks.filter(b => b.type === filterType);
  }

  if (filterLocation !== 'all') {
    filteredBookmarks = filteredBookmarks.filter(b => b.nearestPlace === filterLocation);
  }

  // Count bookmarks by type
  const typeCounts = {
    all: bookmarks.length,
    hotel: bookmarks.filter(b => b.type === 'hotel').length,
    restaurant: bookmarks.filter(b => b.type === 'restaurant').length,
    beach: bookmarks.filter(b => b.type === 'beach').length,
    temple: bookmarks.filter(b => b.type === 'temple').length,
    attraction: bookmarks.filter(b => b.type === 'attraction').length,
    activity: bookmarks.filter(b => b.type === 'activity').length,
  };

  // Count bookmarks by location
  const locationCounts: Record<string, number> = {};
  bookmarksWithLocation.forEach(b => {
    locationCounts[b.nearestPlace] = (locationCounts[b.nearestPlace] || 0) + 1;
  });

  // Check if any filters are active
  const hasActiveFilters = filterType !== 'all' || filterLocation !== 'all';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-yellow-50 to-amber-50 border-b-2 border-yellow-200 px-6 py-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-400 shadow-sm">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bookmarks</h2>
                <p className="text-sm text-gray-600">Places saved for later</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bookmarks.length > 0 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                    showFilters || hasActiveFilters
                      ? 'bg-yellow-400 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-yellow-300 hover:bg-yellow-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <span className="bg-white text-yellow-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {(filterType !== 'all' ? 1 : 0) + (filterLocation !== 'all' ? 1 : 0)}
                    </span>
                  )}
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-300"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        {bookmarks.length > 0 && showFilters && (
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            {/* Location Filter */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                📍 Filter by location
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterLocation('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterLocation === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  All Locations
                </button>
                {Object.entries(locationCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([location, count]) => {
                    const placeInfo = PLACE_LOCATIONS[location as keyof typeof PLACE_LOCATIONS];
                    return (
                      <button
                        key={location}
                        onClick={() => setFilterLocation(location)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filterLocation === location
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {placeInfo?.emoji || '📍'} {location} ({count})
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Type Filter */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              🏷️ Filter by type
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === 'all'
                    ? 'bg-travel-teal text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                All ({typeCounts.all})
              </button>
              {typeCounts.hotel > 0 && (
                <button
                  onClick={() => setFilterType('hotel')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'hotel'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🏨 Hotels ({typeCounts.hotel})
                </button>
              )}
              {typeCounts.restaurant > 0 && (
                <button
                  onClick={() => setFilterType('restaurant')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'restaurant'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🍽️ Restaurants ({typeCounts.restaurant})
                </button>
              )}
              {typeCounts.beach > 0 && (
                <button
                  onClick={() => setFilterType('beach')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'beach'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🏖️ Beaches ({typeCounts.beach})
                </button>
              )}
              {typeCounts.temple > 0 && (
                <button
                  onClick={() => setFilterType('temple')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'temple'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ⛩️ Temples ({typeCounts.temple})
                </button>
              )}
              {typeCounts.attraction > 0 && (
                <button
                  onClick={() => setFilterType('attraction')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'attraction'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  📍 Attractions ({typeCounts.attraction})
                </button>
              )}
              {typeCounts.activity > 0 && (
                <button
                  onClick={() => setFilterType('activity')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filterType === 'activity'
                      ? 'bg-travel-teal text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🎯 Activities ({typeCounts.activity})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 mb-4">
                <Bookmark className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save places you're interested in without scheduling them to a specific day
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-900 font-medium mb-2">💡 How to add bookmarks:</p>
                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>Click "+ Add Place" button</li>
                  <li>Fill in the place details</li>
                  <li>Select "📌 No day (bookmark only)" from the Day dropdown</li>
                  <li>Click "Add Activity"</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {filteredBookmarks.length} of {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                  {(filterType !== 'all' || filterLocation !== 'all') && (
                    <span className="ml-2 text-xs text-travel-teal font-medium">
                      (filtered)
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {(filterType !== 'all' || filterLocation !== 'all') && (
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setFilterLocation('all');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear filters
                    </button>
                  )}
                  <div className="text-xs text-gray-500">
                    💡 Click to edit or assign to a day
                  </div>
                </div>
              </div>

              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-2">
                    No bookmarks match your filters
                  </p>
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterLocation('all');
                    }}
                    className="mt-2 px-4 py-2 text-sm bg-travel-teal text-white rounded-lg hover:bg-[#0c8c8c] font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredBookmarks.map((activity) => {
                  const typeInfo = getActivityTypeColor(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="bg-white border-2 border-gray-200 hover:border-yellow-400 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group"
                      onClick={() => onBookmarkClick(activity)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Image */}
                        {activity.imageUrl ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <img
                              src={activity.imageUrl}
                              alt={activity.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: `${typeInfo.color}15`,
                            }}
                          >
                            <span className="text-3xl">{typeInfo.emoji}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-travel-teal transition-colors flex-1">
                              {activity.name}
                            </h3>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold"
                                style={{
                                  backgroundColor: `${typeInfo.color}15`,
                                  color: typeInfo.color,
                                }}
                              >
                                {typeInfo.emoji} {typeInfo.name}
                              </span>
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border"
                                style={{
                                  backgroundColor: `${activity.nearestPlaceColor}15`,
                                  color: activity.nearestPlaceColor,
                                  borderColor: `${activity.nearestPlaceColor}40`,
                                }}
                              >
                                <MapPin className="w-3 h-3" />
                                {activity.nearestPlaceEmoji} {activity.nearestPlace}
                              </span>
                            </div>
                          </div>

                          {/* Rating */}
                          {activity.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm font-semibold text-gray-700">{activity.rating}</span>
                            </div>
                          )}

                          {/* Description */}
                          {activity.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {activity.description}
                            </p>
                          )}

                          {/* Address */}
                          {activity.address && (
                            <p className="text-xs text-gray-500 truncate">
                              📍 {activity.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
