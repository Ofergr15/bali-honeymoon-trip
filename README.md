# 🌴 Bali Honeymoon Trip Planner 🌴

An interactive trip planning website with Google Maps integration for your Bali honeymoon adventure!

## Features

- 🗺️ **Interactive Google Map** - View all your hotels, attractions, restaurants, and beaches on a map
- 📅 **Day-by-Day Itinerary** - Browse your 25-day honeymoon schedule
- 📍 **Color-Coded Markers** - Easy to identify different types of locations
  - 🔵 Blue - Hotels
  - 🟠 Orange - Attractions
  - 🔴 Red - Restaurants
  - 🟦 Cyan - Beaches
  - 🟣 Purple - Temples
  - 🟢 Green - Activities
- 📱 **Responsive Design** - Works on desktop and mobile
- ℹ️ **Detailed Information** - Click any marker to see details, ratings, times, and descriptions
- ✨ **AI Auto-Fill** - Paste a Google Maps link and automatically extract:
  - Place name
  - GPS coordinates
  - Rating
  - Photo
  - Description
- 🎯 **Trip Settings** - Reorder places, adjust days per location, hide/show places from your trip
- 🗑️ **Delete Places** - Remove places you don't want anymore
- 📊 **Timeline Visualization** - See your trip progress with color-coded location segments

## Getting Started

### 1. Get a Google Maps API Key

You'll need a Google Maps API key to display the map:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key
5. (Recommended) Restrict your API key:
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add `http://localhost:5173/*` for development

### 2. Set Up the Project

```bash
# Navigate to the project directory
cd ~/bali-honeymoon-trip

# Install dependencies (if not already done)
npm install

# Add your API key to the .env file
# Open .env and replace the empty value with your API key:
# VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Customizing Your Trip

### Adding Places with AI Auto-Fill

The easiest way to add a new place is using the AI auto-fill feature:

1. Click the **"Add Place"** button in the top navigation
2. Paste a Google Maps link in the primary field (e.g., `https://maps.google.com/place/...`)
3. The form will automatically extract:
   - ✅ Place name
   - ✅ GPS coordinates
   - ⭐ Rating (when deployed to Vercel)
   - 🖼️ Photo (when deployed to Vercel)
   - 📝 Description
4. Review the auto-filled data and manually adjust if needed
5. Click "Add Activity" or "Add Hotel"

**Tip:** You can see what was successfully extracted in the "Fetch Results" panel below the link field.

### Editing Trip Data

All trip data is stored in `src/data/tripData.ts`. You can customize:

- **Trip title and dates**
- **Hotels** - Add/edit hotel information
- **Activities** - Add/edit daily activities
- **Locations** - Update GPS coordinates (lat/lng)

#### Finding GPS Coordinates

To get coordinates for any location:
1. Go to [Google Maps](https://maps.google.com)
2. Right-click on the location
3. Click on the coordinates (e.g., "-8.5069, 115.2625")
4. The coordinates are copied to your clipboard

Example format:
```typescript
location: { lat: -8.5069, lng: 115.2625 }
```

### Adding a New Day

```typescript
{
  day: 11,
  date: "2026-06-11",
  title: "Extra Day in Bali",
  activities: [
    {
      id: "activity-11-1",
      day: 11,
      type: "beach",
      name: "Nusa Dua Beach",
      location: { lat: -8.8069, lng: 115.2308 },
      time: "10:00",
      duration: "4 hours",
      description: "Relax at pristine white sand beach",
      rating: 4.7
    }
  ]
}
```

### Activity Types

You can use these types for activities:
- `attraction` - Tourist attractions
- `restaurant` - Restaurants and dining
- `beach` - Beach locations
- `temple` - Temples and religious sites
- `activity` - General activities (spa, transfers, etc.)

## Building for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Deployment

### Deploy to Vercel (Recommended)

**Important:** The AI auto-fill feature (automatic extraction of rating and photo from Google Maps links) requires deployment to Vercel to work properly. The serverless function in `/api/fetch-place.js` bypasses CORS restrictions and needs a backend runtime.

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add your environment variable:
   - Name: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
6. Click "Deploy"

Your site will be live in ~30 seconds!

**Note:** During local development (`npm run dev`), the auto-fill feature will work but may have limited access to rating and photo data due to CORS restrictions. Deploy to Vercel for full functionality.

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variable:
   - Key: `VITE_GOOGLE_MAPS_API_KEY`
   - Value: Your Google Maps API key
7. Click "Deploy"

## Project Structure

```
bali-honeymoon-trip/
├── src/
│   ├── components/          # React components
│   │   ├── Map.tsx         # Google Maps component
│   │   ├── ItinerarySidebar.tsx  # Day list sidebar
│   │   └── DetailsPanel.tsx      # Info panel
│   ├── data/
│   │   └── tripData.ts     # Your trip itinerary data
│   ├── types/
│   │   └── trip.ts         # TypeScript type definitions
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── .env                    # Your API key (don't commit!)
├── .env.example            # Example env file
└── package.json            # Dependencies
```

## Tips

- **Filter by Day**: Click on a day in the sidebar to show only that day's locations
- **View Details**: Click on any map marker to see detailed information
- **Navigate**: Use the map controls to zoom and pan around Bali
- **All Markers**: Click "Show All Days" to see the entire trip at once

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Google Maps API** - Interactive maps
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## Troubleshooting

### Map not loading?
- Check that your API key is correct in `.env`
- Make sure Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for specific error messages

### Markers not showing?
- Verify GPS coordinates are correct (lat/lng format)
- Check that the data structure matches the types in `types/trip.ts`

### Want to add photos?
Add an `imageUrl` property to any hotel or activity:
```typescript
imageUrl: "https://example.com/photo.jpg"
```

## License

This is a personal project. Feel free to use it as a template for your own trips!

---

Enjoy planning your Bali honeymoon! 🌺✨
