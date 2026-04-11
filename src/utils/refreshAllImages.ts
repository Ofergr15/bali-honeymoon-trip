/**
 * Utility script to refresh all place images from Google Places API
 */

import { supabase } from '../lib/supabase';

interface PlaceToRefresh {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  image_url: string | null;
  table: 'activities' | 'hotels';
}

export async function refreshAllImages() {
  console.log('🔄 Starting image refresh for all places...');

  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    const error = '❌ Google Maps not loaded! Wait a moment and try again.';
    console.error(error);
    alert(error);
    throw new Error('Google Maps not loaded');
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const error = '❌ No Google Maps API key!';
    console.error(error);
    alert(error);
    throw new Error('No API key');
  }

  console.log('✅ Google Maps loaded');

  try {
    const { data: activities } = await supabase
      .from('activities')
      .select('id, name, location_lat, location_lng, image_url');

    const { data: hotels } = await supabase
      .from('hotels')
      .select('id, name, location_lat, location_lng, image_url');

    const places: PlaceToRefresh[] = [
      ...(activities || []).map(a => ({ ...a, table: 'activities' as const })),
      ...(hotels || []).map(h => ({ ...h, table: 'hotels' as const }))
    ];

    console.log(`📍 Found ${places.length} places\n`);

    let refreshed = 0, skipped = 0, failed = 0;
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    for (const place of places) {
      console.log(`\n🔍 ${place.name}`);

      try {
        const imageUrl = await getImageForPlace(service, place, apiKey);

        if (imageUrl) {
          const { error } = await supabase
            .from(place.table)
            .update({ image_url: imageUrl })
            .eq('id', place.id);

          if (error) {
            console.error(`  ❌ DB update failed:`, error);
            failed++;
          } else {
            console.log(`  ✅ Updated!`);
            refreshed++;
          }
        } else {
          console.log(`  ⏭️  No photo`);
          skipped++;
        }

        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`  ❌ Error:`, error);
        failed++;
      }
    }

    console.log(`\n📊 Done: ✅${refreshed} ⏭️${skipped} ❌${failed}`);
    alert(`✅ Done!\n\nRefreshed: ${refreshed}\nSkipped: ${skipped}\nFailed: ${failed}\n\nRefresh the page to see updated images.`);
    return { refreshed, skipped, failed, total: places.length };

  } catch (error) {
    console.error('❌ Fatal:', error);
    alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    throw error;
  }
}

async function getImageForPlace(service: google.maps.places.PlacesService, place: PlaceToRefresh, apiKey: string): Promise<string | null> {
  // Try 4 strategies with increasing radius
  const strategies = [
    { radius: 50, keyword: true },   // Tight + keyword
    { radius: 200, keyword: true },  // Medium + keyword
    { radius: 500, keyword: true },  // Large + keyword
    { radius: 1000, keyword: false } // Very large, no keyword (grab anything)
  ];

  for (let i = 0; i < strategies.length; i++) {
    const { radius, keyword } = strategies[i];
    console.log(`  🔎 Try ${i+1}/4: ${radius}m${keyword ? ` + "${place.name}"` : ''}`);

    const result = await trySearchStrategy(service, place, radius, keyword, apiKey);
    if (result) {
      return result;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return null;
}

function trySearchStrategy(
  service: google.maps.places.PlacesService,
  place: PlaceToRefresh,
  radius: number,
  useKeyword: boolean,
  apiKey: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const opts: any = {
      location: new google.maps.LatLng(place.location_lat, place.location_lng),
      radius
    };

    if (useKeyword) opts.keyword = place.name;

    service.nearbySearch(opts, async (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results || results.length === 0) {
        resolve(null);
        return;
      }

      // Check up to 5 results for photos
      for (let i = 0; i < Math.min(results.length, 5); i++) {
        const result = results[i];
        if (!result.place_id) continue;

        const imageUrl = await getPhotoFromPlaceId(service, result.place_id, apiKey);
        if (imageUrl) {
          console.log(`    ✓ Found: ${result.name}`);
          resolve(imageUrl);
          return;
        }
      }

      resolve(null);
    });
  });
}

function getPhotoFromPlaceId(service: google.maps.places.PlacesService, placeId: string, apiKey: string): Promise<string | null> {
  return new Promise((resolve) => {
    service.getDetails({ placeId, fields: ['photos'] }, (details, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && details?.photos?.[0]) {
        const photo = details.photos[0] as any;
        const ref = photo.photo_reference;
        if (ref) {
          resolve(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${apiKey}`);
          return;
        }
      }
      resolve(null);
    });
  });
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).refreshAllImages = refreshAllImages;
}
