-- Step 1: Check for orphaned activities (activities with invalid day_id)
-- This will show you any problematic records
SELECT a.id, a.name, a.day_id
FROM activities a
LEFT JOIN days d ON a.day_id = d.id
WHERE d.id IS NULL;

-- Step 2: Delete orphaned activities (activities with invalid day_id)
-- IMPORTANT: Review the results from Step 1 before running this!
DELETE FROM activities
WHERE day_id NOT IN (SELECT id FROM days);

-- Step 3: Now make day_id optional
ALTER TABLE activities ALTER COLUMN day_id DROP NOT NULL;
ALTER TABLE hotels ALTER COLUMN day_id DROP NOT NULL;

-- Step 4: Add trip_id column (nullable at first)
ALTER TABLE activities ADD COLUMN trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;
ALTER TABLE hotels ADD COLUMN trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Step 5: Update existing activities to have trip_id
UPDATE activities
SET trip_id = (
  SELECT trip_id FROM days WHERE days.id = activities.day_id
)
WHERE day_id IS NOT NULL;

UPDATE hotels
SET trip_id = (
  SELECT trip_id FROM days WHERE days.id = hotels.day_id
)
WHERE day_id IS NOT NULL;

-- Step 6: For any remaining NULL trip_id, set to the first trip (fallback)
UPDATE activities
SET trip_id = (SELECT id FROM trips LIMIT 1)
WHERE trip_id IS NULL;

UPDATE hotels
SET trip_id = (SELECT id FROM trips LIMIT 1)
WHERE trip_id IS NULL;

-- Step 7: Now make trip_id NOT NULL
ALTER TABLE activities ALTER COLUMN trip_id SET NOT NULL;
ALTER TABLE hotels ALTER COLUMN trip_id SET NOT NULL;

-- Step 8: Create indexes for better performance
CREATE INDEX idx_activities_unassigned ON activities(trip_id) WHERE day_id IS NULL;
CREATE INDEX idx_hotels_unassigned ON hotels(trip_id) WHERE day_id IS NULL;
CREATE INDEX idx_activities_trip_id ON activities(trip_id);
CREATE INDEX idx_hotels_trip_id ON hotels(trip_id);
