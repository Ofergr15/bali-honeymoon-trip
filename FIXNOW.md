# Fix All Images NOW

Open https://bali-honeymoon-trip.vercel.app/ in your browser and paste this into the console:

```javascript
(async function fixAllNow() {
  const { supabase } = await import('./src/lib/supabase.ts');
  const API_KEY = 'AIzaSyD2xL1i7f4ANLIfUA3Rz8rje2dXRmc37T8';

  console.log('🔄 Starting EMERGENCY image fix...\n');

  // Get activities
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, location_lat, location_lng');

  // Get hotels
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, location_lat, location_lng');

  const places = [
    ...(activities || []).map(p => ({...p, table: 'activities'})),
    ...(hotels || []).map(p => ({...p, table: 'hotels'}))
  ];

  console.log(`Found ${places.length} places\n`);

  const service = new google.maps.places.PlacesService(document.createElement('div'));
  let done = 0;

  for (const place of places) {
    await new Promise(resolve => {
      service.nearbySearch({
        location: new google.maps.LatLng(place.location_lat, place.location_lng),
        radius: 50,
        keyword: place.name
      }, async (results, status) => {
        if (status === 'OK' && results?.[0]?.place_id) {
          service.getDetails({
            placeId: results[0].place_id,
            fields: ['photos']
          }, async (details, dStatus) => {
            if (dStatus === 'OK' && details?.photos?.[0]) {
              const photo = details.photos[0];
              const ref = photo.photo_reference;
              if (ref) {
                const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${API_KEY}`;
                await supabase.from(place.table).update({image_url: url}).eq('id', place.id);
                console.log(`✅ ${++done}/${places.length} - ${place.name}`);
              }
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
    await new Promise(r => setTimeout(r, 1000));
  }

  alert(`✅ Done! Fixed ${done}/${places.length} images. Refresh the page.`);
})();
```
