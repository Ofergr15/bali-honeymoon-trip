-- Add Places/Regions table for main trip locations

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  days_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, name)
);

-- Index for performance
CREATE INDEX idx_places_trip_id ON places(trip_id);
CREATE INDEX idx_places_order ON places(trip_id, display_order);

-- Enable Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- Allow all access for now (we'll add auth later)
CREATE POLICY "Allow all access to places" ON places FOR ALL USING (true);

-- Insert default Bali places for existing trips
-- This will populate places for any trips already in the database
INSERT INTO places (trip_id, name, emoji, color, location_lat, location_lng, days_count, display_order)
SELECT
  t.id as trip_id,
  p.name,
  p.emoji,
  p.color,
  p.location_lat,
  p.location_lng,
  p.days_count,
  p.display_order
FROM trips t
CROSS JOIN (
  VALUES
    ('Canggu', '🏖️', '#06B6D4', -8.6489, 115.1328, 3, 1),
    ('Ubud', '🌿', '#10B981', -8.5069, 115.2625, 3, 2),
    ('Munduk', '🏔️', '#8B4513', -8.2661, 115.0717, 3, 3),
    ('Sidemen', '🌾', '#84CC16', -8.4833, 115.4167, 2, 4),
    ('Gili Trawangan', '🏝️', '#3B82F6', -8.3500, 116.0417, 2, 5),
    ('Gili Air', '🌊', '#60A5FA', -8.3614, 116.0861, 2, 6),
    ('Nusa Penida', '⛰️', '#1D4ED8', -8.7292, 115.5431, 1, 7),
    ('Uluwatu', '🌅', '#F97316', -8.8286, 115.1036, 8, 8)
) AS p(name, emoji, color, location_lat, location_lng, days_count, display_order)
ON CONFLICT (trip_id, name) DO NOTHING;

-- Show the places that were created
SELECT t.title, p.name, p.emoji, p.days_count
FROM places p
JOIN trips t ON t.id = p.trip_id
ORDER BY p.display_order;
