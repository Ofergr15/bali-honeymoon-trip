import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jcsqpjdtfkiorsaugosn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc3FwamR0Zmtpb3JzYXVnb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDA3MDUsImV4cCI6MjA5MDcxNjcwNX0.z2JsigrqpAzo3VAE6bF1oR_DOuNxrK16rdHIG4i5kUs';
const API_KEY = 'AIzaSyD2xL1i7f4ANLIfUA3Rz8rje2dXRmc37T8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function searchPlace(name, lat, lng) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(name)}&location=${lat},${lng}&radius=500&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'OK' && data.results?.[0]) {
    return data.results[0].place_id;
  }
  return null;
}

async function getPhoto(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === 'OK' && data.result?.photos?.[0]) {
    const ref = data.result.photos[0].photo_reference;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${API_KEY}`;
  }
  return null;
}

async function main() {
  console.log('🔄 Fixing all images...\n');

  const { data: activities } = await supabase.from('activities').select('id, name, location_lat, location_lng');
  const { data: hotels } = await supabase.from('hotels').select('id, name, location_lat, location_lng');

  const places = [
    ...(activities || []).map(p => ({...p, table: 'activities'})),
    ...(hotels || []).map(p => ({...p, table: 'hotels'}))
  ];

  console.log(`Found ${places.length} places\n`);

  let done = 0, skipped = 0;

  for (const place of places) {
    console.log(`\n[${done + skipped + 1}/${places.length}] ${place.name}`);

    try {
      const placeId = await searchPlace(place.name, place.location_lat, place.location_lng);
      if (!placeId) {
        console.log('  ⏭️  Not found');
        skipped++;
        continue;
      }

      const imageUrl = await getPhoto(placeId);
      if (!imageUrl) {
        console.log('  ⏭️  No photo');
        skipped++;
        continue;
      }

      await supabase.from(place.table).update({ image_url: imageUrl }).eq('id', place.id);
      console.log('  ✅ Updated!');
      done++;

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log('  ❌ Error:', err.message);
      skipped++;
    }
  }

  console.log(`\n\n✅ DONE! Updated ${done}/${places.length} images (skipped ${skipped})`);
}

main();
