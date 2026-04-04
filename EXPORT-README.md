# Bali Honeymoon Trip Planner - Export Package

## 🎯 Project Overview
Professional trip planning application built with React 19, TypeScript, Google Maps API, and Supabase.

**Live Site:** https://bali-honeymoon-trip.vercel.app

## 📦 What's Included
- Full React + TypeScript + Vite source code
- Tailwind CSS styling
- Google Maps integration with custom markers & animations
- Supabase database integration (PostgreSQL)
- Vercel deployment configuration

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+
- npm or yarn
- Google Maps API Key
- Supabase account & project

### 2. Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Environment Variables
Create a `.env` file in the root directory:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create days table
CREATE TABLE days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL
);

-- Create activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  time TEXT,
  description TEXT,
  price TEXT,
  rating DOUBLE PRECISION,
  image_url TEXT,
  google_maps_url TEXT
);

-- Create hotels table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  day_id UUID REFERENCES days(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  price TEXT,
  booking_url TEXT,
  description TEXT,
  rating DOUBLE PRECISION,
  image_url TEXT
);

-- Create places table
CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  days_count INTEGER,
  display_order INTEGER
);
```

## 📁 Project Structure
```
src/
├── components/         # React components
│   ├── Map.tsx        # Google Maps with markers & animations
│   ├── DayItinerary.tsx
│   ├── AddPlaceForm.tsx
│   ├── EditPlaceForm.tsx
│   ├── DetailsPanel.tsx
│   ├── BookmarksPanel.tsx
│   ├── ColorLegend.tsx
│   └── PlaceChip.tsx
├── lib/
│   └── supabase.ts    # Supabase client config
├── services/
│   └── tripService.ts # Database operations
├── types/
│   └── trip.ts        # TypeScript types
├── utils/
│   └── colors.ts      # Color utilities
├── App.tsx            # Main application
└── main.tsx           # Entry point
```

## 🛠️ Available Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Vercel (Current Hosting)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard or via CLI:
```bash
vercel env add VITE_GOOGLE_MAPS_API_KEY
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 🔑 Key Features

### Map System
- **Atomic camera movement** using `map.moveCamera()` for smooth animations
- **GPU-accelerated** pan and zoom
- **Drag interruption** to prevent animation conflicts
- **Custom markers** with color-coding by activity type
- **Location chips** for quick navigation
- **Bookmarks panel** for unscheduled activities

### Database
- **Trip management** with days and activities
- **Bookmarks system** - activities with `day_id = NULL`
- **Real-time sync** with Supabase
- **Duplicate detection** for activities and hotels

### UI/UX
- **Responsive design** with Tailwind CSS
- **Floating panels** for details and bookmarks
- **Premium shadows** and animations
- **Color-coded** by location (Canggu, Ubud, Munduk, etc.)

## ⚠️ Known Issues

### Map Navigation
The map animation system is currently being optimized. Current behavior:
- Clicking a location triggers `moveCamera()` animation
- Manual dragging during animation should interrupt it via `dragstart` listener
- If "snap-back" occurs, check browser console for animation logs

**Debug logs to look for:**
- `🎥 Animation triggered from:` - animation started
- `🛑 User dragging - interrupting animation` - drag detected

## 🔧 Troubleshooting

**Build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
- Check `tsconfig.app.json` - `"strict": false` for flexible compilation
- Run `npm run build` to see all errors

**Map not loading:**
- Verify Google Maps API key in `.env`
- Check browser console for errors
- Enable "Maps JavaScript API" in Google Cloud Console

**Database connection:**
- Verify Supabase URL and anon key
- Check RLS (Row Level Security) policies if data not loading

## 📞 Support

**Database Schema:** See `src/lib/supabase.ts` for type definitions
**API Documentation:** See `src/services/tripService.ts` for all operations

## 🎨 Customization

**Colors:** Edit `src/utils/colors.ts`
**Locations:** Modify `locations` array in `src/components/Map.tsx`
**Styles:** Edit `src/index.css` and Tailwind config

---

**Export Date:** April 4, 2026
**Version:** 1.0.0
**Framework:** React 19 + Vite + TypeScript
