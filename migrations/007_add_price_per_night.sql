-- Add price_per_night column for hotels
-- This allows per-night pricing with auto-calculated totals

ALTER TABLE activities ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10, 2);

-- Create index for price filtering/sorting
CREATE INDEX IF NOT EXISTS idx_activities_price_per_night ON activities(price_per_night) WHERE price_per_night IS NOT NULL;

-- Add comment
COMMENT ON COLUMN activities.price_per_night IS 'Price per night in USD for hotel-type activities. Total price is calculated from check-in/check-out dates.';
COMMENT ON COLUMN activities.price IS 'Price for activities (e.g., "$50 entrance fee"). For hotels, use price_per_night instead.';

-- Success message
SELECT 'SUCCESS: Added price_per_night column for hotels' as status;
