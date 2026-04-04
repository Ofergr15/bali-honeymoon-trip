# Hotel Migration Guide
## Hotels are now Activities with type='hotel'

## What Changed

### 1. TypeScript Types ✅ (Done)

**File:** `src/types/trip.ts`

```typescript
// BEFORE:
type: 'attraction' | 'restaurant' | 'activity' | 'beach' | 'temple';

// AFTER:
type: 'attraction' | 'restaurant' | 'activity' | 'beach' | 'temple' | 'hotel';

// Added to Activity interface:
checkIn?: string;
checkOut?: string;
bookingUrl?: string;
```

### 2. Database Changes 🔧 (You need to run migrations)

**Run these SQL migrations in order in Supabase:**

#### Migration 004: Add hotel fields to activities table
```bash
File: migrations/004_add_hotel_fields_to_activities.sql
```
Adds these columns to `activities` table:
- `check_in` (TEXT, nullable)
- `check_out` (TEXT, nullable)
- `booking_url` (TEXT, nullable)

#### Migration 005: Migrate hotels to activities and drop hotels table
```bash
File: migrations/005_migrate_hotels_to_activities_and_drop_hotels_table.sql
```
This migration:
1. Copies all existing hotels → activities with `type='hotel'`
2. Drops the `hotels` table

**⚠️ IMPORTANT:** Run migration 004 BEFORE migration 005!

### 3. UI Changes ✅ (Done)

**Add Place Form:**
- ✅ Removed manual hotel/activity picker
- ✅ Added '🏨 Hotel' to activity type dropdown
- ✅ AI auto-detects hotels from keywords (hotel, resort, villa, etc.)
- ✅ Shows hotel-specific fields when type='hotel':
  - Check-in date
  - Check-out date
  - Booking.com URL
- ✅ AI attempts to auto-extract check-in/out dates from place name/description

**Edit Place Form:**
- ✅ Added '🏨 Hotel' to activity type dropdown
- ✅ Shows hotel fields when type='hotel'
- ✅ Backwards compatible with old Hotel objects

## How to Run Migrations

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Navigate to SQL Editor

### Step 2: Run Migration 004
```sql
-- Copy entire contents of: migrations/004_add_hotel_fields_to_activities.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Expected result:**
```
✅ Column "check_in" added
✅ Column "check_out" added
✅ Column "booking_url" added
✅ Indexes created
```

### Step 3: Run Migration 005
```sql
-- Copy entire contents of: migrations/005_migrate_hotels_to_activities_and_drop_hotels_table.sql
-- Paste in SQL Editor
-- Click "Run"
```

**Expected result:**
```
✅ X hotels migrated to activities
✅ Hotels table dropped
✅ Migration complete
```

### Step 4: Verify Migration
```sql
-- Check if hotels were migrated
SELECT id, name, type, check_in, check_out
FROM activities
WHERE type = 'hotel';

-- Verify hotels table is gone
SELECT * FROM hotels; -- Should error: relation "hotels" does not exist
```

## Features After Migration

### ✨ What Works Now:

1. **Single Dropdown**
   - All place types in one dropdown: Restaurant, Beach, Temple, Attraction, Activity, **Hotel**

2. **Smart AI Detection**
   - Paste Google Maps link for a hotel → AI detects it's a hotel
   - Automatically sets type to '🏨 Hotel'
   - Shows hotel-specific fields

3. **Auto-Fill Hotel Dates** (Experimental)
   - If hotel name contains dates like "May 10-15"
   - AI tries to extract check-in/out dates automatically

4. **Unified Storage**
   - Everything stored in `activities` table
   - Hotels have `type='hotel'` + hotel-specific fields filled
   - Activities have other types and hotel fields are NULL

5. **Backwards Compatible**
   - Edit form still works with old Hotel objects
   - After migration, old Hotel data converted to Activity with type='hotel'

## Testing Checklist

After running migrations:

- [ ] Go to production app
- [ ] Click "Add Place"
- [ ] Paste a hotel Google Maps link
- [ ] Verify type dropdown shows '🏨 Hotel' option
- [ ] Select Hotel type
- [ ] Verify check-in/out date fields appear
- [ ] Add a test hotel
- [ ] Verify it appears in the day view
- [ ] Edit the hotel
- [ ] Verify all fields editable

## Troubleshooting

### Issue: Migration 005 fails with "column does not exist"
**Solution:** Run migration 004 first to add the columns

### Issue: Existing hotels not showing
**Solution:**
1. Check if migration 005 ran successfully
2. Query: `SELECT * FROM activities WHERE type='hotel';`
3. If empty, hotels didn't migrate. Re-run migration 005.

### Issue: Type dropdown doesn't show Hotel
**Solution:**
- Clear browser cache and refresh
- Deployment may still be in progress (check Vercel)

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- 1. Recreate hotels table
CREATE TABLE hotels (
  -- ... (use your original schema)
);

-- 2. Migrate hotels back
INSERT INTO hotels (...)
SELECT ... FROM activities WHERE type = 'hotel';

-- 3. Delete hotel activities
DELETE FROM activities WHERE type = 'hotel';

-- 4. Remove hotel columns from activities
ALTER TABLE activities DROP COLUMN check_in;
ALTER TABLE activities DROP COLUMN check_out;
ALTER TABLE activities DROP COLUMN booking_url;
```

## Summary

**Before:** Hotels and Activities were separate → Manual picker → Confusing

**After:** Hotels ARE activities with type='hotel' → One dropdown → AI auto-detects → Simple!

🎉 **Result:** Cleaner code, simpler UX, easier to maintain!
