-- Drop hotels table - hotels are now activities with type='hotel'
-- Run this AFTER running migration 004
-- WARNING: This drops the hotels table. Backup first if you have important hotel data!

-- Optional: Export existing hotels before dropping (uncomment to use)
-- SELECT * FROM hotels;

-- Drop the hotels table
-- Hotels should now be added as activities with type='hotel'
DROP TABLE IF EXISTS hotels CASCADE;

-- Update comment on activities type column
COMMENT ON COLUMN activities.type IS 'Activity type: attraction, restaurant, activity, beach, temple, or hotel';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Hotels table dropped. Hotels should now be added as activities with type=hotel';
  RAISE NOTICE 'To add a hotel: Insert into activities table with type=hotel and check_in/check_out/booking_url filled';
END $$;
