import { createClient } from '@supabase/supabase-js';

// These will be set after you create your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Make it globally available for console scripts
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
}

// Database types
export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string;
          title: string;
          destination: string;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      days: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          title: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['days']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['days']['Insert']>;
      };
      hotels: {
        Row: {
          id: string;
          day_id: string;
          name: string;
          location_lat: number;
          location_lng: number;
          check_in: string;
          check_out: string;
          price: number | null;
          booking_url: string | null;
          description: string | null;
          rating: number | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hotels']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['hotels']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          day_id: string;
          name: string;
          type: string;
          location_lat: number;
          location_lng: number;
          time: string | null;
          description: string | null;
          price: number | null;
          rating: number | null;
          image_url: string | null;
          google_maps_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
      places: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          emoji: string;
          color: string;
          location_lat: number;
          location_lng: number;
          days_count: number;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['places']['Insert']>;
      };
    };
  };
}

// Place type for the app
export interface Place {
  id: string;
  name: string;
  emoji: string;
  color: string;
  lat: number;
  lng: number;
  days: number;
}
