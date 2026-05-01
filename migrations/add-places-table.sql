-- Migration: Add places table to store trip route configuration
-- This table stores the ordered list of places for each trip

CREATE TABLE IF NOT EXISTS trip_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,
  place_emoji TEXT NOT NULL DEFAULT '📍',
  place_color TEXT NOT NULL DEFAULT '#06B6D4',
  days_count INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trip_places_trip_id ON trip_places(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_places_order ON trip_places(trip_id, display_order);

-- Enable Row Level Security
ALTER TABLE trip_places ENABLE ROW LEVEL SECURITY;

-- Allow all access (update with proper auth policies later)
CREATE POLICY "Allow all access to trip_places" ON trip_places FOR ALL USING (true);

-- Add unique constraint to prevent duplicate place orders
ALTER TABLE trip_places ADD CONSTRAINT unique_trip_place_order UNIQUE (trip_id, display_order);
