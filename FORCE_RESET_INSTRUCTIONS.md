# Force Reset Cache - Fix Wrong Order

## Quick Fix (Browser Console)

1. **Open browser console:**
   - Chrome/Edge: Press `F12` or `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
   - Firefox: Press `F12` or `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows)

2. **Paste this code and press Enter:**

```javascript
// Clear ALL cache
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});
console.log('✅ Cache cleared! Now refresh the page (Cmd+Shift+R)');
```

3. **Hard refresh:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

## Alternative: Manual Clear

1. Open DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear storage" or "Clear Site Data"
4. Check ALL boxes
5. Click "Clear site data"
6. Hard refresh the page

## If Still Wrong

The database has saved the wrong order. We need to:
1. Delete the trip from Supabase
2. Let it reload fresh from code

Or I can add a "Reset Trip Data" button in the app.
