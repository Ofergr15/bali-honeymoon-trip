# Supabase Setup Guide - 5 Minutes ⚡

## Step 1: Create Supabase Project (2 minutes)

1. **Go to** https://supabase.com
2. **Click** "Start your project"
3. **Sign in** with GitHub (easiest)
4. **Click** "New Project"
5. **Fill in:**
   - **Name:** `bali-honeymoon-trip`
   - **Database Password:** (generate strong password - SAVE THIS!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free
6. **Click** "Create new project"
7. **Wait ~2 minutes** for database to provision (grab coffee ☕)

## Step 2: Run Database Schema (1 minute)

1. **In Supabase Dashboard**, click **"SQL Editor"** (left sidebar)
2. **Click** "New query"
3. **Copy** the entire contents of `supabase-schema.sql` file
4. **Paste** into the SQL editor
5. **Click** "Run" (or press Cmd+Enter)
6. **You should see:** "Success. No rows returned"

## Step 3: Get API Credentials (30 seconds)

1. **In Supabase Dashboard**, click **"Settings"** (left sidebar, bottom)
2. **Click** "API" (in Settings submenu)
3. **Copy** these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

## Step 4: Add to .env File (30 seconds)

1. **Open** `.env` file in your project
2. **Paste** the values:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_long_anon_key_here
```
3. **Save** the file

## Step 5: Initialize Your Trip Data (1 minute)

The app will automatically create your trip in the database on first load.

**Restart your dev server:**
```bash
npm run dev
```

## ✅ You're Done!

Your app now:
- ✅ Saves to real database
- ✅ Persists across devices
- ✅ Ready for multi-user (when we add auth)
- ✅ Can add places and they'll be saved permanently

## Verify It's Working

1. **Open browser console** (F12)
2. **Look for:** `✅ Trip created with ID: ...`
3. **Go to Supabase Dashboard** → **Table Editor**
4. **You should see** your trip data in the tables!

## Next Steps

- Add activities → They save to database automatically
- Add hotels → Saved permanently
- Share the trip ID with someone → They can view your trip
- Later: Add authentication so each user has their own trips

---

## Troubleshooting

**Error: "Invalid API key"**
- Check you copied the **anon public** key, not the **service_role** key
- Make sure there are no extra spaces in `.env`

**Error: "relation does not exist"**
- Run the SQL schema again in SQL Editor
- Check for any error messages when running the schema

**No data showing up?**
- Open browser console and check for errors
- Verify environment variables are loaded (restart dev server)

---

Need help? Check the Supabase docs: https://supabase.com/docs
