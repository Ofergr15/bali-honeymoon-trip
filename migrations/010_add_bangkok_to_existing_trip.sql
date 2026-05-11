-- Migration to add Bangkok days to existing trip without deleting data
-- This updates the trip structure from 25 days to 30 days

-- Step 1: Update trip metadata (dates and destination)
UPDATE trips
SET
  start_date = '2026-05-04',
  end_date = '2026-06-02',
  destination = 'Bali, Indonesia & Bangkok, Thailand'
WHERE start_date = '2026-05-06' AND end_date = '2026-05-30';

-- Step 2: Shift all existing day numbers by +1 (to make room for May 4-5 Bangkok days)
-- Update in reverse order to avoid conflicts
UPDATE days SET day_number = day_number + 1 WHERE day_number >= 1 ORDER BY day_number DESC;

-- Step 3: Insert new Bangkok days at the beginning
-- Get the trip_id first (assuming single trip)
DO $$
DECLARE
  v_trip_id UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips LIMIT 1;

  -- Insert Day 1: May 4 - Departure from Israel
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 1, '2026-05-04', 'Departure to Bangkok');

  -- Insert Day 2: May 5 - Bangkok arrival
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 2, '2026-05-05', 'Bangkok - Arrival');
END $$;

-- Step 4: Update the Bali arrival day title
UPDATE days
SET title = 'Bangkok to Bali - Canggu'
WHERE day_number = 3 AND date = '2026-05-06';

-- Step 5: Add Bangkok days at the end
DO $$
DECLARE
  v_trip_id UUID;
  v_day_27_id UUID;
BEGIN
  SELECT id INTO v_trip_id FROM trips LIMIT 1;

  -- Update day 27 (May 30) title
  UPDATE days
  SET title = 'Uluwatu to Bangkok'
  WHERE trip_id = v_trip_id AND day_number = 27;

  -- Insert Day 28: May 31 - Bangkok
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 28, '2026-05-31', 'Bangkok');

  -- Insert Day 29: June 1 - Bangkok departure
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 29, '2026-06-01', 'Bangkok - Departure Day');

  -- Insert Day 30: June 2 - Israel arrival
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 30, '2026-06-02', 'Arrival in Israel');
END $$;

-- Verify the migration
SELECT
  'Migration complete!' as status,
  COUNT(*) as total_days,
  MIN(date) as start_date,
  MAX(date) as end_date
FROM days
WHERE trip_id = (SELECT id FROM trips LIMIT 1);
