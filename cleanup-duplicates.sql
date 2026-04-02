-- Clean up duplicate activities
-- This SQL will keep only the first occurrence of each duplicate

WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY day_id, name, location_lat, location_lng
      ORDER BY created_at ASC
    ) as row_num
  FROM activities
)
DELETE FROM activities
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Clean up duplicate hotels
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY day_id, name, location_lat, location_lng
      ORDER BY created_at ASC
    ) as row_num
  FROM hotels
)
DELETE FROM hotels
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Show remaining activities count
SELECT COUNT(*) as activities_count FROM activities;

-- Show remaining hotels count
SELECT COUNT(*) as hotels_count FROM hotels;
