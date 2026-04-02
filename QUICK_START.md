# Quick Start Guide

## Step 1: Get Your Google Maps API Key

Before you can use the map, you need a Google Maps API key (it's free for development):

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a project** (or select an existing one)
3. **Enable Maps JavaScript API**:
   - Click on "APIs & Services" → "Library"
   - Search for "Maps JavaScript API"
   - Click on it and press "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your new API key

## Step 2: Add Your API Key

Open the `.env` file in this project and add your API key:

```
VITE_GOOGLE_MAPS_API_KEY=paste_your_api_key_here
```

**Important**: Don't add quotes around the API key, just paste it directly.

## Step 3: Run the Project

Open your terminal in this directory and run:

```bash
npm run dev
```

The website will open at: http://localhost:5173

## What You'll See

- **Left Sidebar**: List of all 10 days of your trip
- **Center**: Interactive Google Map with markers for all locations
- **Bottom Panel**: Details when you click on any marker

## How to Use

- Click on any **day** in the sidebar to filter the map to show only that day's activities
- Click on **"Show All Days"** to see the entire trip
- Click on any **marker** on the map to see detailed information
- The **colors** indicate different types of locations:
  - Blue = Hotels
  - Orange = Attractions
  - Red = Restaurants
  - Cyan = Beaches
  - Purple = Temples
  - Green = Activities

## Customizing Your Trip

All trip data is in `src/data/tripData.ts`. You can:
- Change dates and locations
- Add new days or activities
- Update hotel information
- Modify descriptions and times

To find GPS coordinates:
1. Go to Google Maps
2. Right-click on any location
3. Click the coordinates to copy them
4. Use format: `{ lat: -8.5069, lng: 115.2625 }`

## Need Help?

Check the full README.md for detailed instructions on:
- Deploying to the web (Vercel/Netlify)
- Adding photos
- Troubleshooting
- Advanced customization
