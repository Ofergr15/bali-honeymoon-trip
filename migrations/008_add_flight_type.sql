-- Add 'flight' to the activity type enum
-- Note: PostgreSQL doesn't have a direct ALTER TYPE ADD VALUE in transactions,
-- so we'll use a more compatible approach

-- First, verify current constraint
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

  -- Add new constraint with 'flight' type
  ALTER TABLE activities ADD CONSTRAINT activities_type_check
    CHECK (type IN ('attraction', 'restaurant', 'activity', 'beach', 'temple', 'hotel', 'flight'));
END $$;

-- Add comment
COMMENT ON COLUMN activities.type IS 'Activity type: attraction, restaurant, activity, beach, temple, hotel, or flight';
