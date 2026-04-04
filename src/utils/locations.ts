// Shared location detection utilities

// Known place locations in Bali with unique colors for each
export const PLACE_LOCATIONS = {
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
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
export function findNearestPlace(lat: number, lng: number): { name: string; distance: number; emoji: string; color: string } | null {
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

// Get place info - uses manual override if set, otherwise auto-detects
export function getPlaceInfo(lat: number, lng: number, manualPlace?: string): { name: string; emoji: string; color: string } {
  // If manual place is set, use it
  if (manualPlace && PLACE_LOCATIONS[manualPlace as keyof typeof PLACE_LOCATIONS]) {
    const placeData = PLACE_LOCATIONS[manualPlace as keyof typeof PLACE_LOCATIONS];
    return {
      name: manualPlace,
      emoji: placeData.emoji,
      color: placeData.color,
    };
  }

  // Otherwise auto-detect
  const detected = findNearestPlace(lat, lng);
  if (detected) {
    return {
      name: detected.name,
      emoji: detected.emoji,
      color: detected.color,
    };
  }

  // Fallback
  return {
    name: 'Bali',
    emoji: '📍',
    color: '#6B7280',
  };
}
