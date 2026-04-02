-- Make day_id optional for activities and hotels
-- This allows places to exist without being assigned to a specific day

ALTER TABLE activities ALTER COLUMN day_id DROP NOT NULL;
ALTER TABLE hotels ALTER COLUMN day_id DROP NOT NULL;

-- Create indexes for unassigned items
CREATE INDEX idx_activities_unassigned ON activities(trip_id) WHERE day_id IS NULL;
CREATE INDEX idx_hotels_unassigned ON hotels(trip_id) WHERE day_id IS NULL;

-- Add trip_id column to activities and hotels so they can exist without a day
ALTER TABLE activities ADD COLUMN trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;
ALTER TABLE hotels ADD COLUMN trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Update existing activities and hotels to have trip_id
UPDATE activities
SET trip_id = (
  SELECT trip_id FROM days WHERE days.id = activities.day_id
);

UPDATE hotels
SET trip_id = (
  SELECT trip_id FROM days WHERE days.id = hotels.day_id
);

-- Make trip_id NOT NULL now that all rows have values
ALTER TABLE activities ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE hotels ALTER COLUMN trip_id SET NOT NULL;

-- Create indexes for trip_id
CREATE INDEX idx_activities_trip_id ON activities(trip_id);
CREATE INDEX idx_hotels_trip_id ON hotels(trip_id);
