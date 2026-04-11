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
    console.error('❌ Google Maps is not loaded!');
    alert('Please wait for Google Maps to load and try again.');
    return;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('❌ No API key found!');
    return;
  }

  try {
    // Fetch all activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, name, location_lat, location_lng, image_url');

    if (activitiesError) {
      console.error('❌ Error fetching activities:', activitiesError);
      return;
    }

    // Fetch all hotels
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, name, location_lat, location_lng, image_url');

    if (hotelsError) {
      console.error('❌ Error fetching hotels:', hotelsError);
      return;
    }

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

        // Add delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
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

    alert(`Image refresh complete!\n✅ Refreshed: ${refreshed}\n⏭️ Skipped: ${skipped}\n❌ Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

function refreshPlaceImage(
  service: google.maps.places.PlacesService,
  place: PlaceToRefresh,
  apiKey: string
): Promise<string | null> {
  return new Promise((resolve) => {
    // Search for the place
    service.nearbySearch(
      {
        location: new google.maps.LatLng(place.location_lat, place.location_lng),
        radius: 50,
        keyword: place.name
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const placeId = results[0].place_id;

          if (placeId) {
            // Get place details with photos
            service.getDetails(
              {
                placeId: placeId,
                fields: ['photos']
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
                    resolve(imageUrl);
                  } else {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              }
            );
          } else {
            resolve(null);
          }
        } else {
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
