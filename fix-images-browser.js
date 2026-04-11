// Run this in the browser console on https://bali-honeymoon-trip.vercel.app/
// Paste this entire script and press Enter

(async function() {
  const API_KEY = 'AIzaSyD2xL1i7f4ANLIfUA3Rz8rje2dXRmc37T8';

  async function searchPlace(name, lat, lng) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${lat},${lng}&radius=500&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].place_id;
      }
    } catch (error) {
      console.error('Search error:', error);
    }

    return null;
  }

  async function getPhotoReference(placeId) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result && data.result.photos && data.result.photos.length > 0) {
        return data.result.photos[0].photo_reference;
      }
    } catch (error) {
      console.error('Details error:', error);
    }

    return null;
  }

  console.log('🔄 Starting image fix...\n');

  // Import supabase from the global context
  const { supabase } = window;

  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you are on the app page.');
    return;
  }

  // Fetch all activities
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, location_lat, location_lng, image_url');

  if (activitiesError) {
    console.error('❌ Error fetching activities:', activitiesError);
    return;
  }

  console.log(`📍 Found ${activities?.length || 0} activities`);

  // Fetch all hotels
  const { data: hotels, error: hotelsError } = await supabase
    .from('hotels')
    .select('id, name, location_lat, location_lng, image_url');

  if (hotelsError) {
    console.error('❌ Error fetching hotels:', hotelsError);
    return;
  }

  console.log(`🏨 Found ${hotels?.length || 0} hotels\n`);

  const allPlaces = [
    ...(activities || []).map(a => ({ ...a, table: 'activities' })),
    ...(hotels || []).map(h => ({ ...h, table: 'hotels' }))
  ];

  if (allPlaces.length === 0) {
    console.log('❌ No places found to update');
    return;
  }

  let refreshed = 0;
  let skipped = 0;
  let failed = 0;

  for (const place of allPlaces) {
    console.log(`\n🔍 Processing: ${place.name}`);

    try {
      // Search for place using Google Places API (CORS issue - this won't work from browser)
      // We need to use the Places Service from Google Maps instead

      console.log(`  ⏭️  Skipping (need to use Google Maps API)`);
      skipped++;

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  ❌ Error:`, error.message);
      failed++;
    }
  }

  console.log('\n\n📊 Summary:');
  console.log(`✅ Refreshed: ${refreshed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📍 Total: ${allPlaces.length}`);
})();
