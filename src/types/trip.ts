export interface Location {
  lat: number;
  lng: number;
}

export interface Hotel {
  id: string;
  name: string;
  location: Location;
  address: string;
  googleMapsUrl?: string;
  phone?: string;
  rating?: number;
  imageUrl?: string;
  bookingUrl?: string;
  price?: string;
  checkIn: string;
  checkOut: string;
  description?: string;
}

export interface OpeningHours {
  is24Hours?: boolean;
  periods?: Array<{
    day: number; // 0-6 (Sunday-Saturday)
    open: string; // e.g., "09:00"
    close: string; // e.g., "22:00"
  }>;
  weekdayText?: string[]; // e.g., ["Monday: 9:00 AM – 10:00 PM", ...]
}

export interface Activity {
  id: string;
  day?: number; // Optional - null means it's a bookmark not assigned to a day
  type: 'attraction' | 'restaurant' | 'activity' | 'beach' | 'temple' | 'hotel';
  name: string;
  location: Location;
  address?: string;
  googleMapsUrl?: string;
  time: string;
  duration?: string;
  description: string;
  price?: string;
  rating?: number;
  imageUrl?: string;
  openingHours?: OpeningHours;
  place?: string; // Manual override for location (e.g., "Sidemen", "Ubud") - overrides AI detection
  // Hotel-specific fields (when type is 'hotel')
  pricePerNight?: number; // Price per night in USD for hotels
  checkIn?: string;
  checkOut?: string;
  bookingUrl?: string;
}

export interface DayExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
}

export interface DayItinerary {
  day: number;
  date: string;
  title: string;
  hotel?: Hotel;
  activities: Activity[];
  expenses?: DayExpense[];
  notes?: string;
}

export interface TripData {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DayItinerary[];
  unassignedActivities?: Activity[]; // Bookmarks not assigned to a specific day
}
