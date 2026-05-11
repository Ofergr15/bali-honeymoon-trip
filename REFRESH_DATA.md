# How to Refresh Trip Data

The trip data has been updated to include Bangkok, but your browser is showing cached data.

## Quick Fix - Clear Browser Cache

1. Open browser console (F12 or Cmd+Option+I)
2. Run this command:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Or manually in Application tab:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "Local Storage" → select your domain
4. Delete these keys:
   - `bali-trip-data`
   - `bali-trip-data-version`
   - `bali-trip-id`
5. Refresh the page (Cmd+R or F5)

## If using Supabase:
The app will automatically detect the new structure on next load. The database trip will need to be recreated with the new 30-day structure including Bangkok.

You can use the "Cleanup DB" button (visible only to super users) to reset if needed.
