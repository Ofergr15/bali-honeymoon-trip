-- Add place column to activities table for manual location override
-- This allows users to manually correct the AI-detected location

ALTER TABLE activities ADD COLUMN IF NOT EXISTS place TEXT;

-- Create index for faster filtering by place
CREATE INDEX IF NOT EXISTS idx_activities_place ON activities(place) WHERE place IS NOT NULL;

-- Add comment
COMMENT ON COLUMN activities.place IS 'Manual location override (e.g., "Sidemen", "Ubud"). If NULL, location is auto-detected from GPS coordinates.';

-- Success message
SELECT 'SUCCESS: Added place column to activities table for manual location override' as status;
