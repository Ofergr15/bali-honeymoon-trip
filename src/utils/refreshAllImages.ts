/**
 * Utility script to refresh all place images from Google Places API
 * Run this in the browser console while on the site
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

  // Check if Google Maps is loaded
  if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
    const error = '❌ Google Maps is not loaded! Please wait a moment and try again.';
    console.error(error);
    alert(error);
    throw new Error('Google Maps not loaded');
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    const error = '❌ No Google Maps API key found in environment variables!';
    console.error(error);
    alert(error);
    throw new Error('No API key');
  }

  console.log('✅ Google Maps loaded, API key found');

  try {
    // Fetch all activities
    console.log('📥 Fetching activities from database...');
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, location_lat, location_lng, image_url');

    if (activitiesError) {
      const error = `❌ Error fetching activities: ${activitiesError.message}`;
      console.error(error, activitiesError);
      alert(error);
      throw activitiesError;
    }

    console.log(`✅ Found ${activities?.length || 0} activities`);

    // Fetch all hotels
    console.log('📥 Fetching hotels from database...');
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, name, location_lat, location_lng, image_url');

    if (hotelsError) {
      const error = `❌ Error fetching hotels: ${hotelsError.message}`;
      console.error(error, hotelsError);
      alert(error);
      throw hotelsError;
    }

    console.log(`✅ Found ${hotels?.length || 0} hotels`);

    // Combine all places
    const placesToRefresh: PlaceToRefresh[] = [
      ...(activities || []).map(a => ({ ...a, table: 'activities' as const })),
      ...(hotels || []).map(h => ({ ...h, table: 'hotels' as const }))
    ];

    console.log(`📍 Found ${placesToRefresh.length} places to check`);

    let refreshed = 0;
    let failed = 0;
    let skipped = 0;

    const service = new google.maps.places.PlacesService(document.createElement('div'));

    // Process each place
    for (const place of placesToRefresh) {
      console.log(`\n🔍 Processing: ${place.name}`);

      try {
        const newImageUrl = await refreshPlaceImage(service, place, apiKey);

        if (newImageUrl) {
          // Update the database
          const { error: updateError } = await supabase
            .from(place.table)
            .update({ image_url: newImageUrl })
            .eq('id', place.id);

          if (updateError) {
            console.error(`❌ Failed to update ${place.name}:`, updateError);
            failed++;
          } else {
            console.log(`✅ Updated ${place.name}`);
            refreshed++;
          }
        } else {
          console.log(`⏭️  No photo found for ${place.name}`);
          skipped++;
        }

        // Add delay to avoid hitting API rate limits (1 second between requests)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error processing ${place.name}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Refreshed: ${refreshed}`);
    console.log(`⏭️  Skipped (no photo): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📍 Total: ${placesToRefresh.length}`);

    const message = `✅ Image refresh complete!\n\nRefreshed: ${refreshed}\nSkipped (no photo found): ${skipped}\nFailed: ${failed}\nTotal: ${placesToRefresh.length}\n\nPlease refresh the page to see the updated images.`;
    alert(message);
    return { refreshed, skipped, failed, total: placesToRefresh.length };

  } catch (error) {
    console.error('❌ Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`❌ Fatal error during image refresh:\n\n${errorMessage}\n\nCheck the console for more details.`);
    throw error;
  }
}

function refreshPlaceImage(
  service: google.maps.places.PlacesService,
  place: PlaceToRefresh,
  apiKey: string
): Promise<string | null> {
  return new Promise((resolve) => {
    console.log(`  🔍 Searching for images near: ${place.location_lat}, ${place.location_lng}`);

    // Just do a simple nearby search and grab the first place with photos
    // Note: Cannot use both radius and rankBy together
    service.nearbySearch(
      {
        location: new google.maps.LatLng(place.location_lat, place.location_lng),
        radius: 100 // 100 meters should catch most exact locations
      },
      (results, status) => {
        console.log(`  📍 Nearby search status: ${status}, results: ${results?.length || 0}`);

        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Try each result until we find one with photos
          let currentIndex = 0;

          function tryNextResult() {
            if (currentIndex >= results.length) {
              console.log(`  ⏭️  No photos found in any of ${results.length} nearby results`);
              resolve(null);
              return;
            }

            const result = results[currentIndex];
            console.log(`  🔎 Checking result ${currentIndex + 1}/${results.length}: ${result.name}`);

            if (!result.place_id) {
              currentIndex++;
              tryNextResult();
              return;
            }

            service.getDetails(
              {
                placeId: result.place_id,
                fields: ['photos', 'name']
              },
              (placeDetails, detailsStatus) => {
                if (
                  detailsStatus === google.maps.places.PlacesServiceStatus.OK &&
                  placeDetails &&
                  placeDetails.photos &&
                  placeDetails.photos.length > 0
                ) {
                  const photo = placeDetails.photos[0] as any;
                  const photoReference = photo.photo_reference;

                  if (photoReference) {
                    const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`;
                    console.log(`  ✅ Found photo from: ${placeDetails.name}`);
                    resolve(imageUrl);
                  } else {
                    console.log(`  ⚠️  Photo exists but no reference available`);
                    currentIndex++;
                    setTimeout(tryNextResult, 100);
                  }
                } else {
                  console.log(`  ⚠️  No photos for ${placeDetails?.name || 'this place'}`);
                  currentIndex++;
                  setTimeout(tryNextResult, 100);
                }
              }
            );
          }

          tryNextResult();
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          console.log(`  ❌ No places found near this location`);
          resolve(null);
        } else {
          console.log(`  ❌ Search failed with status: ${status}`);
          resolve(null);
        }
      }
    );
  });
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).refreshAllImages = refreshAllImages;
}
