-- Add hotel-specific fields to activities table
-- This allows activities to also function as hotels when type='hotel'

-- Add check_in date field (nullable, only for hotel-type activities)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS check_in DATE;

-- Add check_out date field (nullable, only for hotel-type activities)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS check_out DATE;

-- Add booking_url field (nullable, for Booking.com or other booking links)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS booking_url TEXT;

-- Add address field if it doesn't exist (needed for hotels and activities)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS address TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_check_in ON activities(check_in) WHERE check_in IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_check_out ON activities(check_out) WHERE check_out IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Add comments explaining the new fields
COMMENT ON COLUMN activities.check_in IS 'Check-in date for hotel-type activities (format: DATE)';
COMMENT ON COLUMN activities.check_out IS 'Check-out date for hotel-type activities (format: DATE)';
COMMENT ON COLUMN activities.booking_url IS 'Booking.com or other reservation link for hotel-type activities';
COMMENT ON COLUMN activities.address IS 'Address for the activity or hotel';
