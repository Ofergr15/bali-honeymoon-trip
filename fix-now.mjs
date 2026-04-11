import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jcsqpjdtfkiorsaugosn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc3FwamR0Zmtpb3JzYXVnb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDA3MDUsImV4cCI6MjA5MDcxNjcwNX0.z2JsigrqpAzo3VAE6bF1oR_DOuNxrK16rdHIG4i5kUs'
);

const API_KEY = 'AIzaSyD2xL1i7f4ANLIfUA3Rz8rje2dXRmc37T8';

async function searchAndGetPhoto(name, lat, lng) {
  // Search for place
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${lat},${lng}&radius=500&key=${API_KEY}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.status !== 'OK' || !searchData.results?.[0]) {
    return null;
  }

  const placeId = searchData.results[0].place_id;

  // Get photos
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${API_KEY}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  if (detailsData.status !== 'OK' || !detailsData.result?.photos?.[0]) {
    return null;
  }

  const ref = detailsData.result.photos[0].photo_reference;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${API_KEY}`;
}

async function main() {
  console.log('🔄 Fixing images with service role key...\n');

  // Get all activities and hotels
  const { data: activities, error: aErr } = await supabase.from('activities').select('id, name, location_lat, location_lng');
  const { data: hotels, error: hErr } = await supabase.from('hotels').select('id, name, location_lat, location_lng');

  if (aErr) console.error('Activity error:', aErr);
  if (hErr) console.error('Hotel error:', hErr);

  const places = [
    ...(activities || []).map(p => ({...p, table: 'activities'})),
    ...(hotels || []).map(p => ({...p, table: 'hotels'}))
  ];

  console.log(`Found ${places.length} places\n`);

  let done = 0, skipped = 0;

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    console.log(`[${i+1}/${places.length}] ${place.name}`);

    try {
      const imageUrl = await searchAndGetPhoto(place.name, place.location_lat, place.location_lng);

      if (imageUrl) {
        const { error } = await supabase.from(place.table).update({ image_url: imageUrl }).eq('id', place.id);
        if (error) {
          console.log('  ❌ DB Error:', error.message);
        } else {
          console.log('  ✅ Updated!');
          done++;
        }
      } else {
        console.log('  ⏭️  No photo found');
        skipped++;
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log('  ❌ Error:', err.message);
      skipped++;
    }
  }

  console.log(`\n✅ DONE! Updated ${done}/${places.length} (skipped ${skipped})`);
}

main();
