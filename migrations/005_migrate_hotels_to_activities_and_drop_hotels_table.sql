-- Migrate existing hotels to activities table and drop hotels table
-- Run this AFTER running migration 004

-- Step 1: Migrate existing hotels to activities
-- This converts all hotels to activities with type='hotel'
INSERT INTO activities (
  id,
  day,
  type,
  name,
  location,
  address,
  google_maps_url,
  time,
  duration,
  description,
  price,
  rating,
  image_url,
  opening_hours,
  check_in,
  check_out,
  booking_url,
  created_at,
  updated_at
)
SELECT
  h.id,
  NULL as day, -- Hotels don't have a specific day assignment
  'hotel'::text as type,
  h.name,
  h.location,
  h.address,
  h.google_maps_url,
  ''::text as time, -- Hotels don't have a specific time
  NULL as duration,
  h.description,
  h.price,
  h.rating,
  h.image_url,
  NULL as opening_hours,
  h.check_in,
  h.check_out,
  h.booking_url,
  h.created_at,
  h.updated_at
FROM hotels h
WHERE NOT EXISTS (
  -- Avoid duplicates if migration is run multiple times
  SELECT 1 FROM activities a WHERE a.id = h.id
);

-- Step 2: Update days table to reference activities instead of hotels
-- (If your days table has a hotel_id column, this removes that reference)
-- Note: Days table structure varies, adjust as needed
-- ALTER TABLE days DROP COLUMN IF EXISTS hotel_id;

-- Step 3: Drop the hotels table
DROP TABLE IF EXISTS hotels CASCADE;

-- Step 4: Add comment
COMMENT ON COLUMN activities.type IS 'Activity type: attraction, restaurant, activity, beach, temple, or hotel';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Hotels moved to activities table with type=hotel';
END $$;
