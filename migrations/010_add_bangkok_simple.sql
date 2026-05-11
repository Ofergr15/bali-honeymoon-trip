-- Simple migration to add Bangkok days
-- Run this in Supabase SQL Editor

-- 1. First, temporarily disable the unique constraint by updating days in reverse order
UPDATE days SET day_number = day_number + 100 WHERE trip_id = (SELECT id FROM trips LIMIT 1);

-- 2. Now shift them to final positions (+2 from original)
UPDATE days SET day_number = day_number - 98 WHERE trip_id = (SELECT id FROM trips LIMIT 1);

-- 3. Insert Day 1: May 4
INSERT INTO days (trip_id, day_number, date, title)
SELECT id, 1, '2026-05-04', 'Departure to Bangkok' FROM trips LIMIT 1;

-- 4. Insert Day 2: May 5
INSERT INTO days (trip_id, day_number, date, title)
SELECT id, 2, '2026-05-05', 'Bangkok - Arrival' FROM trips LIMIT 1;

-- 5. Update trip metadata
UPDATE trips SET
  start_date = '2026-05-04',
  end_date = '2026-06-02',
  destination = 'Bali, Indonesia & Bangkok, Thailand'
WHERE id = (SELECT id FROM trips LIMIT 1);

-- 6. Update Bali arrival day title
UPDATE days SET title = 'Bangkok to Bali - Canggu'
WHERE day_number = 3 AND date = '2026-05-06';

-- 7. Update Bali departure day title
UPDATE days SET title = 'Uluwatu to Bangkok'
WHERE day_number = 27;

-- 8. Add Bangkok at end - Day 28
INSERT INTO days (trip_id, day_number, date, title)
SELECT id, 28, '2026-05-31', 'Bangkok' FROM trips LIMIT 1;

-- 9. Add Bangkok departure - Day 29
INSERT INTO days (trip_id, day_number, date, title)
SELECT id, 29, '2026-06-01', 'Bangkok - Departure Day' FROM trips LIMIT 1;

-- 10. Add Israel arrival - Day 30
INSERT INTO days (trip_id, day_number, date, title)
SELECT id, 30, '2026-06-02', 'Arrival in Israel' FROM trips LIMIT 1;

-- Verify
SELECT COUNT(*) as total_days, MIN(date) as start_date, MAX(date) as end_date
FROM days WHERE trip_id = (SELECT id FROM trips LIMIT 1);
