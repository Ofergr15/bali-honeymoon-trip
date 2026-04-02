-- Bali Honeymoon Trip Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Days table
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- Hotels table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  price DECIMAL(10,2),
  booking_url TEXT,
  description TEXT,
  rating DECIMAL(3,2),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  time TEXT,
  description TEXT,
  price DECIMAL(10,2),
  rating DECIMAL(3,2),
  image_url TEXT,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_days_trip_id ON days(trip_id);
CREATE INDEX idx_hotels_day_id ON hotels(day_id);
CREATE INDEX idx_activities_day_id ON activities(day_id);

-- Enable Row Level Security (we'll set policies later for multi-user)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add auth later)
CREATE POLICY "Allow all access to trips" ON trips FOR ALL USING (true);
CREATE POLICY "Allow all access to days" ON days FOR ALL USING (true);
CREATE POLICY "Allow all access to hotels" ON hotels FOR ALL USING (true);
CREATE POLICY "Allow all access to activities" ON activities FOR ALL USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to trips
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
