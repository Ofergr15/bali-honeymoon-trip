// Centralized color system for the entire app

// Activity Type Colors
export const ACTIVITY_COLORS = {
  hotel: {
    color: '#3B82F6',      // Blue
    emoji: '🏨',
    name: 'Hotel'
  },
  restaurant: {
    color: '#EF4444',      // Red
    emoji: '🍴',
    name: 'Restaurant'
  },
  beach: {
    color: '#06B6D4',      // Cyan/Light Blue
    emoji: '🍹',
    name: 'Beach Club'
  },
  temple: {
    color: '#8B5CF6',      // Purple
    emoji: '⛩️',
    name: 'Temple'
  },
  attraction: {
    color: '#F59E0B',      // Orange
    emoji: '📍',
    name: 'Attraction'
  },
  activity: {
    color: '#10B981',      // Green
    emoji: '🎯',
    name: 'Activity'
  },
  flight: {
    color: '#6366F1',      // Indigo
    emoji: '✈️',
    name: 'Flight'
  }
} as const;

// Geographic Area Colors
export const AREA_COLORS = {
  'Bangkok': {
    color: '#DC2626',      // Red - Thai vibes
    emoji: '🇹🇭',
    name: 'Bangkok'
  },
  'Canggu': {
    color: '#06B6D4',      // Cyan - Beach vibes
    emoji: '🏖️',
    name: 'Canggu'
  },
  'Sidemen': {
    color: '#84CC16',      // Lime Green - Rice terraces
    emoji: '🌾',
    name: 'Sidemen'
  },
  'Ubud': {
    color: '#10B981',      // Green - Jungle/nature
    emoji: '🌿',
    name: 'Ubud'
  },
  'Uluwatu': {
    color: '#F97316',      // Orange - Sunset cliffs
    emoji: '🌅',
    name: 'Uluwatu'
  },
  'Gili Trawangan': {
    color: '#3B82F6',      // Blue - Ocean/island
    emoji: '🏝️',
    name: 'Gili Trawangan'
  },
  'Gili Air': {
    color: '#60A5FA',      // Light Blue - Ocean
    emoji: '🌊',
    name: 'Gili Air'
  },
  'Nusa Lembongan': {
    color: '#1D4ED8',      // Dark Blue - Cliffs/ocean
    emoji: '⛰️',
    name: 'Nusa Lembongan'
  },
  'Kuta': {
    color: '#D946EF',      // Fuchsia - Surf town
    emoji: '🏄',
    name: 'Kuta'
  },
  'Komodo': {
    color: '#14B8A6',      // Teal - Dragons
    emoji: '🐉',
    name: 'Komodo'
  },
  'Bali': {
    color: '#6B7280',      // Gray - Default
    emoji: '📍',
    name: 'Bali'
  }
} as const;

// Helper function to get area from coordinates
export function getAreaFromCoordinates(location: { lat: number; lng: number }) {
  const { lat, lng } = location;

  // Bangkok area
  if (lat >= 13.6 && lat <= 13.8 && lng >= 100.7 && lng <= 100.8) {
    return AREA_COLORS['Bangkok'];
  }

  // Canggu area
  if (lat >= -8.67 && lat <= -8.63 && lng >= 115.12 && lng <= 115.15) {
    return AREA_COLORS['Canggu'];
  }

  // Sidemen area
  if (lat >= -8.50 && lat <= -8.46 && lng >= 115.40 && lng <= 115.44) {
    return AREA_COLORS['Sidemen'];
  }

  // Ubud area
  if (lat >= -8.52 && lat <= -8.48 && lng >= 115.24 && lng <= 115.28) {
    return AREA_COLORS['Ubud'];
  }

  // Uluwatu area
  if (lat >= -8.84 && lat <= -8.80 && lng >= 115.08 && lng <= 115.12) {
    return AREA_COLORS['Uluwatu'];
  }

  // Gili Trawangan
  if (lat >= -8.36 && lat <= -8.34 && lng >= 116.03 && lng <= 116.05) {
    return AREA_COLORS['Gili Trawangan'];
  }

  // Gili Air
  if (lat >= -8.36 && lat <= -8.34 && lng >= 116.08 && lng <= 116.10) {
    return AREA_COLORS['Gili Air'];
  }

  // Nusa Lembongan
  if (lat >= -8.70 && lat <= -8.67 && lng >= 115.43 && lng <= 115.47) {
    return AREA_COLORS['Nusa Lembongan'];
  }

  // Kuta area
  if (lat >= -8.73 && lat <= -8.70 && lng >= 115.16 && lng <= 115.18) {
    return AREA_COLORS['Kuta'];
  }

  // Komodo (Labuan Bajo) area
  if (lat >= -8.50 && lat <= -8.47 && lng >= 119.87 && lng <= 119.91) {
    return AREA_COLORS['Komodo'];
  }

  // Default
  return AREA_COLORS['Bali'];
}

// Helper to get activity type color
export function getActivityTypeColor(type: keyof typeof ACTIVITY_COLORS) {
  return ACTIVITY_COLORS[type];
}

// Helper to get marker color (for map markers)
export function getMarkerColor(item: { type?: string }): string {
  if (!item.type) return ACTIVITY_COLORS.hotel.color;

  const type = item.type as keyof typeof ACTIVITY_COLORS;
  return ACTIVITY_COLORS[type]?.color || '#6B7280';
}
