# Run Bangkok Migration

This migration adds Bangkok to your existing trip WITHOUT deleting any activities, hotels, or bookmarks.

## What it does:
- ✅ Keeps all your existing data (activities, hotels, bookmarks)
- ✅ Shifts existing day numbers by +1
- ✅ Adds Bangkok days (May 4-5 at start, May 31-June 2 at end)
- ✅ Updates trip from 25 to 30 days
- ✅ Updates dates: May 4 - June 2
- ✅ Updates destination to include Bangkok

## How to run:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire content of `migrations/010_add_bangkok_to_existing_trip.sql`
6. Paste it into the SQL editor
7. Click **Run** (or press Cmd+Enter)

## Verify:
After running, you should see:
```
status: "Migration complete!"
total_days: 30
start_date: 2026-05-04
end_date: 2026-06-02
```

Then refresh your app and Bangkok should appear! 🇹🇭
