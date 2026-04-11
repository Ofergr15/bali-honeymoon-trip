// One-time script to fix all broken images
// Run with: node fix-images-once.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jcsqpjdtfkiorsaugosn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc3FwamR0Zmtpb3JzYXVnb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDA3MDUsImV4cCI6MjA5MDcxNjcwNX0.z2JsigrqpAzo3VAE6bF1oR_DOuNxrK16rdHIG4i5kUs';
const GOOGLE_MAPS_API_KEY = 'AIzaSyD2xL1i7f4ANLIfUA3Rz8rje2dXRmc37T8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function searchPlace(name, lat, lng) {
  // Use Google Places Text Search API
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${lat},${lng}&radius=500&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results && data.results.length > 0) {
    return data.results[0].place_id;
  }

  return null;
}

async function getPhotoReference(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.result && data.result.photos && data.result.photos.length > 0) {
    return data.result.photos[0].photo_reference;
  }

  return null;
}

async function fixImages() {
  console.log('🔄 Starting image fix...\n');

  // First, get the trip ID
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id')
    .limit(1);

  if (tripsError) {
    console.error('❌ Error fetching trips:', tripsError);
    return;
  }

  if (!trips || trips.length === 0) {
    console.error('❌ No trips found in database');
    return;
  }

  const tripId = trips[0].id;
  console.log(`📌 Using trip ID: ${tripId}\n`);

  // Get all days for this trip
  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id')
    .eq('trip_id', tripId);

  if (daysError) {
    console.error('❌ Error fetching days:', daysError);
    return;
  }

  const dayIds = days.map(d => d.id);
  console.log(`📅 Found ${dayIds.length} days\n`);

  // Fetch all activities for these days
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('id, name, location_lat, location_lng, image_url')
    .in('day_id', dayIds);

  if (activitiesError) {
    console.error('❌ Error fetching activities:', activitiesError);
    return;
  }

  console.log(`📍 Found ${activities?.length || 0} activities`);

  // Fetch all hotels for these days
  const { data: hotels, error: hotelsError } = await supabase
    .from('hotels')
    .select('id, name, location_lat, location_lng, image_url')
    .in('day_id', dayIds);

  if (hotelsError) {
    console.error('❌ Error fetching hotels:', hotelsError);
    return;
  }

  console.log(`🏨 Found ${hotels?.length || 0} hotels\n`);

  const allPlaces = [
    ...(activities || []).map(a => ({ ...a, table: 'activities' })),
    ...(hotels || []).map(h => ({ ...h, table: 'hotels' }))
  ];

  let refreshed = 0;
  let skipped = 0;
  let failed = 0;

  for (const place of allPlaces) {
    console.log(`\n🔍 Processing: ${place.name}`);

    try {
      // Search for place
      const placeId = await searchPlace(place.name, place.location_lat, place.location_lng);

      if (!placeId) {
        console.log(`  ⏭️  No place found`);
        skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      console.log(`  ✓ Found place ID: ${placeId}`);

      // Get photo reference
      const photoRef = await getPhotoReference(placeId);

      if (!photoRef) {
        console.log(`  ⏭️  No photos available`);
        skipped++;
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }

      const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`;
      console.log(`  ✓ Got photo reference`);

      // Update database
      const { error: updateError } = await supabase
        .from(place.table)
        .update({ image_url: imageUrl })
        .eq('id', place.id);

      if (updateError) {
        console.error(`  ❌ Failed to update:`, updateError);
        failed++;
      } else {
        console.log(`  ✅ Updated!`);
        refreshed++;
      }

      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

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
}

fixImages().catch(console.error);
