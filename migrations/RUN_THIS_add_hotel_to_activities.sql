-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- This adds hotel support to activities table

-- Step 1: Add hotel-specific columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS check_in DATE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS check_out DATE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS booking_url TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS address TEXT;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_check_in ON activities(check_in) WHERE check_in IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_check_out ON activities(check_out) WHERE check_out IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Step 3: Add comments
COMMENT ON COLUMN activities.check_in IS 'Check-in date for hotel-type activities';
COMMENT ON COLUMN activities.check_out IS 'Check-out date for hotel-type activities';
COMMENT ON COLUMN activities.booking_url IS 'Booking.com or other reservation link';
COMMENT ON COLUMN activities.address IS 'Address for the activity or hotel';
COMMENT ON COLUMN activities.type IS 'Activity type: attraction, restaurant, activity, beach, temple, or hotel';

-- Success message
SELECT 'SUCCESS: Activities table now supports hotels with type=hotel' as status;
