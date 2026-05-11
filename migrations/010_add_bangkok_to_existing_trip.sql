-- Migration to add Bangkok days to existing trip without deleting data
-- This updates the trip structure from 25 days to 30 days

DO $$
DECLARE
  v_trip_id UUID;
  v_day_record RECORD;
BEGIN
  -- Get the trip_id (assuming single trip)
  SELECT id INTO v_trip_id FROM trips LIMIT 1;

  -- Step 1: Update trip metadata (dates and destination)
  UPDATE trips
  SET
    start_date = '2026-05-04'::date,
    end_date = '2026-06-02'::date,
    destination = 'Bali, Indonesia & Bangkok, Thailand'
  WHERE id = v_trip_id;

  -- Step 2: Shift all existing day numbers by +2 (to make room for 2 Bangkok days at start)
  -- Update in reverse order to avoid unique constraint violations
  FOR v_day_record IN
    SELECT id, day_number FROM days
    WHERE trip_id = v_trip_id
    ORDER BY day_number DESC
  LOOP
    UPDATE days
    SET day_number = v_day_record.day_number + 2
    WHERE id = v_day_record.id;
  END LOOP;

  -- Step 3: Insert new Bangkok days at the beginning
  -- Insert Day 1: May 4 - Departure from Israel
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 1, '2026-05-04'::date, 'Departure to Bangkok');

  -- Insert Day 2: May 5 - Bangkok arrival
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 2, '2026-05-05'::date, 'Bangkok - Arrival');

  -- Step 4: Update the Bali arrival day title (now day 3)
  UPDATE days
  SET title = 'Bangkok to Bali - Canggu'
  WHERE trip_id = v_trip_id AND day_number = 3 AND date = '2026-05-06'::date;

  -- Step 5: Update day 27 title (Bali to Bangkok)
  UPDATE days
  SET title = 'Uluwatu to Bangkok'
  WHERE trip_id = v_trip_id AND day_number = 27;

  -- Step 6: Add Bangkok days at the end
  -- Insert Day 28: May 31 - Bangkok
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 28, '2026-05-31'::date, 'Bangkok');

  -- Insert Day 29: June 1 - Bangkok departure
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 29, '2026-06-01'::date, 'Bangkok - Departure Day');

  -- Insert Day 30: June 2 - Israel arrival
  INSERT INTO days (trip_id, day_number, date, title)
  VALUES (v_trip_id, 30, '2026-06-02'::date, 'Arrival in Israel');

  -- Output verification
  RAISE NOTICE 'Migration complete!';
  RAISE NOTICE 'Total days: %', (SELECT COUNT(*) FROM days WHERE trip_id = v_trip_id);
  RAISE NOTICE 'Start date: %', (SELECT MIN(date) FROM days WHERE trip_id = v_trip_id);
  RAISE NOTICE 'End date: %', (SELECT MAX(date) FROM days WHERE trip_id = v_trip_id);
END $$;
