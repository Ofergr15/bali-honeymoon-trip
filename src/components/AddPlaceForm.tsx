import { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import type { Activity, Hotel } from '../types/trip';

interface AddPlaceFormProps {
  onAddActivity: (activity: Omit<Activity, 'id'>) => void;
  onAddHotel: (hotel: Omit<Hotel, 'id'>) => void;
  onClose: () => void;
}

// Extract coordinates from Google Maps link
function extractCoordinatesFromLink(link: string): { lat: number; lng: number } | null {
  try {
    // Pattern 1 (BEST): !3d and !4d format (most accurate)
    // Example: !3d-8.6667652!4d115.1393984
    const bangPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    const bangMatch = link.match(bangPattern);
    if (bangMatch) {
      console.log('Found coordinates using !3d!4d pattern:', bangMatch[1], bangMatch[2]);
      return { lat: parseFloat(bangMatch[1]), lng: parseFloat(bangMatch[2]) };
    }

    // Pattern 2: https://maps.google.com/?q=-8.5069,115.2625
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qMatch = link.match(qPattern);
    if (qMatch) {
      console.log('Found coordinates using q= pattern:', qMatch[1], qMatch[2]);
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Pattern 3: https://www.google.com/maps/place/.../@-8.5069,115.2625,17z/...
    // Note: This is less accurate, use as fallback
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const atMatch = link.match(atPattern);
    if (atMatch) {
      console.log('Found coordinates using @ pattern:', atMatch[1], atMatch[2]);
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Pattern 4: Direct lat,lng in URL
    const coordPattern = /(-?\d+\.?\d+),\s*(-?\d+\.?\d+)/;
    const coordMatch = link.match(coordPattern);
    if (coordMatch) {
      console.log('Found coordinates using direct pattern:', coordMatch[1], coordMatch[2]);
      return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
}

export default function AddPlaceForm({ onAddActivity, onAddHotel, onClose }: AddPlaceFormProps) {
  const [activityType, setActivityType] = useState<Activity['type']>('restaurant');

  // Common fields
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [openingHours, setOpeningHours] = useState<any>(null);

  // Activity-specific fields
  const [day, setDay] = useState('0'); // Default to bookmark (no day)
  const [time, setTime] = useState('');

  // Hotel-specific fields
  const [bookingUrl, setBookingUrl] = useState('');
  const [price, setPrice] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // AI auto-fill state
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autoFillError, setAutoFillError] = useState<string | null>(null);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{
    name: boolean;
    coordinates: boolean;
    rating: boolean;
    image: boolean;
    description: boolean;
  } | null>(null);

  const handleAutoFill = async () => {
    if (!link) {
      alert('Please paste a Google Maps link first');
      return;
    }
    setIsAutoFilling(true);
    await handleAutoFillForLink(link);
  };

  // Auto-trigger fill when link is pasted
  const handleLinkChange = async (newLink: string) => {
    setLink(newLink);
    setAutoFillSuccess(false);
    setAutoFillError(null);
    setFetchStatus(null); // Reset status when link changes

    console.log('Link changed:', newLink);

    // Check if it's a valid Google Maps link
    if (newLink && (newLink.includes('google.com/maps') || newLink.includes('maps.app.goo.gl') || newLink.includes('goo.gl'))) {
      console.log('Valid Google Maps link detected, starting auto-fill...');
      // Wait a bit for user to finish pasting, then auto-trigger
      setTimeout(() => {
        // Trigger auto-fill
        setIsAutoFilling(true);
        handleAutoFillForLink(newLink);
      }, 1200);
    }
  };

  const handleAutoFillForLink = async (urlToFetch: string) => {
    try {
      // Use the current link or passed link
      const targetLink = urlToFetch || link;

      if (!targetLink) {
        setIsAutoFilling(false);
        return;
      }

      // Extract name from URL
      const placeNameMatch = targetLink.match(/\/place\/([^/@]+)/);
      let extractedName = '';
      if (placeNameMatch) {
        extractedName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '));
      }

      // Extract coordinates from URL (ALWAYS works, most accurate)
      const coords = extractCoordinatesFromLink(targetLink);
      if (!coords) {
        throw new Error('Could not extract coordinates from link');
      }

      console.log('✅ Extracted coordinates:', coords);

      // NEW APPROACH: Use Google Geocoding API + Places Service
      // This works 100% in local development with no CORS issues!
      let extractedRating = '';
      let extractedImage = '';
      let extractedDescription = '';

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        // Step 1: Try to find the place using Nearby Search (more accurate for businesses)
        console.log('🔍 Step 1: Searching for place near coordinates...');
        console.log('Place name:', extractedName);
        console.log('Coordinates:', coords);

        // Wait for Google Maps to load
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
          console.warn('⚠️ Waiting for Google Places library...');
          let attempts = 0;
          while (attempts < 10 && (typeof google === 'undefined' || !google.maps || !google.maps.places)) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
        }

        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
          throw new Error('Google Places library not loaded');
        }

        let placeId: string | null = null;

        // Try Nearby Search with the place name
        const nearbySearchPromise = new Promise<string | null>((resolve) => {
          const service = new google.maps.places.PlacesService(document.createElement('div'));
          const location = new google.maps.LatLng(coords.lat, coords.lng);

          service.nearbySearch(
            {
              location: location,
              radius: 50, // 50 meters radius
              keyword: extractedName
            },
            (results, status) => {
              console.log('Nearby Search status:', status);
              console.log('Nearby Search results:', results);

              if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                // Find the best match
                const bestMatch = results[0];
                console.log('✅ Found place via Nearby Search:', bestMatch.name);
                console.log('Place ID:', bestMatch.place_id);
                resolve(bestMatch.place_id || null);
              } else {
                console.warn('⚠️ Nearby Search failed, falling back to Geocoding...');
                resolve(null);
              }
            }
          );
        });

        placeId = await nearbySearchPromise;

        // Fallback to Geocoding if Nearby Search didn't work
        if (!placeId) {
          console.log('🔍 Fallback: Using Geocoding API...');
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`;

          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
            placeId = geocodeData.results[0].place_id;
            console.log('✅ Got Place ID from Geocoding:', placeId);
          } else {
            throw new Error(`Could not find place: ${geocodeData.status}`);
          }
        }

        if (!placeId) {
          throw new Error('Could not get Place ID');
        }

        // Step 2: Get place details using Places Service
        console.log('🔍 Step 2: Fetching place details with Place ID:', placeId);

        const placeDetails: {
          rating?: number;
          imageUrl?: string;
          description?: string;
          openingHours?: any;
        } = await new Promise((resolve, reject) => {
          const service = new google.maps.places.PlacesService(document.createElement('div'));

          service.getDetails(
            {
              placeId: placeId,
              fields: ['name', 'rating', 'photos', 'vicinity', 'formatted_address', 'user_ratings_total', 'opening_hours']
            },
            (place, status) => {
              console.log('📥 Places Service response:', { status, place });

              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                const result: {
                  rating?: number;
                  imageUrl?: string;
                  description?: string;
                  openingHours?: any;
                } = {};

                if (place.rating) {
                  result.rating = place.rating;
                  console.log('✅ Rating:', result.rating, `(${place.user_ratings_total || 0} reviews)`);
                }

                if (place.photos && place.photos.length > 0) {
                  result.imageUrl = place.photos[0].getUrl({ maxWidth: 800, maxHeight: 800 });
                  console.log('✅ Photo URL:', result.imageUrl);
                }

                if (place.vicinity) {
                  result.description = place.vicinity;
                } else if (place.formatted_address) {
                  result.description = place.formatted_address;
                }

                // Extract opening hours
                if (place.opening_hours) {
                  const openingHours: any = {};

                  // Check if 24 hours
                  if (place.opening_hours.periods && place.opening_hours.periods.length === 1) {
                    const period = place.opening_hours.periods[0];
                    if (period.open && !period.close) {
                      openingHours.is24Hours = true;
                    }
                  }

                  // Get weekday text (e.g., "Monday: 9:00 AM – 10:00 PM")
                  if (place.opening_hours.weekday_text) {
                    openingHours.weekdayText = place.opening_hours.weekday_text;
                  }

                  // Get periods for programmatic access
                  if (place.opening_hours.periods) {
                    openingHours.periods = place.opening_hours.periods.map((period: any) => ({
                      day: period.open?.day,
                      open: period.open ? `${String(period.open.hours).padStart(2, '0')}:${String(period.open.minutes).padStart(2, '0')}` : undefined,
                      close: period.close ? `${String(period.close.hours).padStart(2, '0')}:${String(period.close.minutes).padStart(2, '0')}` : undefined,
                    }));
                  }

                  result.openingHours = openingHours;
                  console.log('✅ Opening Hours:', result.openingHours);
                }

                resolve(result);
              } else {
                console.error('❌ Places Service error:', status);
                reject(new Error(`Places Service failed: ${status}`));
              }
            }
          );
        });

        if (placeDetails.rating) {
          extractedRating = placeDetails.rating.toString();
          console.log('✅ Rating:', extractedRating);
        }

        if (placeDetails.imageUrl) {
          extractedImage = placeDetails.imageUrl;
          console.log('✅ Image URL:', extractedImage);
        }

        if (placeDetails.description) {
          extractedDescription = placeDetails.description;
          console.log('✅ Description:', extractedDescription);
        }

        // Also set address if we got it
        if (placeDetails.description) {
          setAddress(placeDetails.description);
        }

        // Set opening hours
        if (placeDetails.openingHours) {
          setOpeningHours(placeDetails.openingHours);
        }

      } catch (placesError) {
        console.error('❌ Error using Google Places API:', placesError);

        // Show error to user
        if (placesError instanceof Error) {
          setAutoFillError(placesError.message);
        }

        // Fallback: Try serverless function if deployed to Vercel
        console.log('⚠️ Trying serverless function fallback...');
        try {
          const serverlessUrl = `/api/fetch-place?url=${encodeURIComponent(targetLink)}`;
          const response = await fetch(serverlessUrl);

          if (response.ok) {
            const data = await response.json();
            console.log('Serverless response:', data);
            if (data.success) {
              if (data.rating) {
                extractedRating = data.rating;
                console.log('✅ Rating from serverless:', extractedRating);
              }
              if (data.imageUrl) {
                extractedImage = data.imageUrl;
                console.log('✅ Image from serverless:', extractedImage);
              }
              if (data.description) {
                extractedDescription = data.description;
              }
            }
          } else {
            console.warn('Serverless function returned status:', response.status);
          }
        } catch (serverlessError) {
          console.warn('Serverless function not available:', serverlessError);
        }
      }

      // AI-powered type detection - check name, description, and address
      const lowerName = extractedName.toLowerCase();
      const lowerDesc = extractedDescription.toLowerCase();
      const lowerAddr = address.toLowerCase();
      const combinedText = `${lowerName} ${lowerDesc} ${lowerAddr}`;

      // Hotel detection keywords - comprehensive list for accommodations
      const hotelKeywords = [
        'hotel', 'resort', 'villa', 'hostel', 'accommodation',
        'guest house', 'guesthouse', 'homestay', 'lodge', 'inn',
        'bungalow', 'cottage', 'house', 'apartment', 'suites',
        'retreat', 'stay', 'rooms', 'airbnb', 'bnb', 'bed and breakfast',
        'vacation rental', 'holiday home', 'glamping', 'cabana', 'eco lodge'
      ];

      // Check if it's a hotel/accommodation
      let isHotel = hotelKeywords.some(keyword => combinedText.includes(keyword));

      // Special handling: If name contains "house" but also contains accommodation indicators
      if (!isHotel && lowerName.includes('house')) {
        // Check if it's likely accommodation (not a restaurant/cafe/museum)
        const notAccommodation = ['coffee house', 'tea house', 'house of', 'warehouse', 'greenhouse'];
        const isNotAccommodation = notAccommodation.some(term => combinedText.includes(term));

        if (!isNotAccommodation) {
          // Likely an accommodation if it has "house" and isn't explicitly something else
          isHotel = true;
        }
      }

      // Activity type detection
      let guessedType: Activity['type'] = 'activity';
      if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('warung') || lowerName.includes('kitchen') || lowerName.includes('dining') || lowerName.includes('eatery')) {
        guessedType = 'restaurant';
      } else if (lowerName.includes('temple') || lowerName.includes('pura') || lowerName.includes('shrine')) {
        guessedType = 'temple';
      } else if (lowerName.includes('beach') || lowerName.includes('club') || lowerName.includes('surf') || lowerName.includes('coast')) {
        guessedType = 'beach';
      } else if (lowerName.includes('museum') || lowerName.includes('gallery') || lowerName.includes('park') || lowerName.includes('attraction')) {
        guessedType = 'attraction';
      }

      // AI: Try to auto-extract check-in/out dates from name or description
      let extractedCheckIn = '';
      let extractedCheckOut = '';

      // Look for date patterns in the name/description (e.g., "May 10-15", "10-15 May", "May 10 to May 15")
      const datePattern = /(?:may|june)\s+(\d{1,2})(?:\s*-\s*|\s+to\s+)(?:may|june)?\s*(\d{1,2})/i;
      const dateMatch = `${extractedName} ${extractedDescription}`.match(datePattern);

      if (dateMatch && isHotel) {
        const startDay = parseInt(dateMatch[1]);
        const endDay = parseInt(dateMatch[2]);

        // Our trip is May 6-30, 2026
        if (startDay >= 6 && startDay <= 30 && endDay >= 6 && endDay <= 30) {
          extractedCheckIn = `2026-05-${String(startDay).padStart(2, '0')}`;
          extractedCheckOut = `2026-05-${String(endDay).padStart(2, '0')}`;
          console.log('✅ Auto-detected dates:', extractedCheckIn, '-', extractedCheckOut);
        }
      }

      // Log what we extracted
      console.log('Auto-fill results:', {
        name: extractedName,
        rating: extractedRating,
        image: extractedImage,
        description: extractedDescription,
        type: isHotel ? 'hotel' : guessedType,
        checkIn: extractedCheckIn || 'not detected',
        checkOut: extractedCheckOut || 'not detected',
      });

      // Track what was successfully fetched
      setFetchStatus({
        name: !!extractedName,
        coordinates: !!coords,
        rating: !!extractedRating,
        image: !!extractedImage,
        description: !!extractedDescription,
      });

      // Pre-fill the form
      if (extractedName) setName(extractedName);
      if (extractedRating) setRating(extractedRating);
      if (extractedImage) setImageUrl(extractedImage);
      if (extractedDescription) setDescription(extractedDescription);
      if (extractedCheckIn) setCheckIn(extractedCheckIn);
      if (extractedCheckOut) setCheckOut(extractedCheckOut);

      // Set activity type (including 'hotel')
      if (isHotel) {
        setActivityType('hotel');
      } else {
        setActivityType(guessedType);
      }

      setAutoFillSuccess(true);
      setAutoFillError(null);

    } catch (error) {
      console.error('Auto-fill error:', error);
      setAutoFillError(`Error: ${error instanceof Error ? error.message : 'Could not extract place info'}`);
      setAutoFillSuccess(false);
      setFetchStatus(null);
    } finally {
      setIsAutoFilling(false);
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !link) {
      alert('Please fill in Name and Google Maps Link');
      return;
    }

    const location = extractCoordinatesFromLink(link);
    if (!location) {
      alert('Could not extract coordinates from this link.\n\nPlease paste a Google Maps URL that shows a specific location.\n\nTip: Click on a place in Google Maps, then copy the URL from your browser\'s address bar.\n\nValid URL formats:\n• https://www.google.com/maps/place/Name/@lat,lng...\n• https://maps.google.com/?q=lat,lng\n• Any URL containing !3d and !4d coordinates');
      return;
    }

    // For hotels, validate check-in/check-out dates
    if (activityType === 'hotel' && (!checkIn || !checkOut)) {
      alert('Please provide check-in and check-out dates for the hotel');
      return;
    }

    const dayNum = parseInt(day);
    const newActivity: Omit<Activity, 'id'> = {
      day: dayNum === 0 ? undefined : dayNum, // undefined = bookmark, no day assigned
      type: activityType,
      name,
      location,
      address: address || undefined,
      googleMapsUrl: link || undefined,
      time,
      duration: undefined,
      description,
      price: price || undefined,
      rating: rating ? parseFloat(rating) : undefined,
      imageUrl: imageUrl || undefined,
      openingHours: openingHours || undefined,
      // Hotel-specific fields
      checkIn: activityType === 'hotel' ? checkIn : undefined,
      checkOut: activityType === 'hotel' ? checkOut : undefined,
      bookingUrl: activityType === 'hotel' ? bookingUrl : undefined,
    };
    onAddActivity(newActivity);

    // Reset form
    setName('');
    setLink('');
    setAddress('');
    setDescription('');
    setRating('');
    setImageUrl('');
    setOpeningHours(null);
    setDay('1');
    setTime('');
    setBookingUrl('');
    setPrice('');
    setCheckIn('');
    setCheckOut('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Add New Place</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* AI-Detected Type Badge */}
          {name && autoFillSuccess && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">AI Detected:</span>
                  <span className="px-3 py-1 bg-white border-2 border-purple-300 rounded-full text-sm font-bold text-purple-700">
                    {activityType === 'hotel' && '🏨 Hotel'}
                    {activityType === 'restaurant' && '🍽️ Restaurant'}
                    {activityType === 'beach' && '🏖️ Beach'}
                    {activityType === 'temple' && '⛩️ Temple'}
                    {activityType === 'attraction' && '📍 Attraction'}
                    {activityType === 'activity' && '🎯 Activity'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ✓ Auto-filled
                </span>
              </div>
            </div>
          )}

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as Activity['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            >
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="attraction">📍 Attraction</option>
              <option value="beach">🏖️ Beach</option>
              <option value="temple">⛩️ Temple</option>
              <option value="activity">🎯 Activity</option>
              <option value="hotel">🏨 Hotel</option>
            </select>
          </div>

          {/* Google Maps Link - PRIMARY FIELD */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
            <label className="block text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Paste Google Maps Link <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://maps.google.com/place/..."
              className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
              required
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600 flex-1">
                {isAutoFilling ? (
                  <span className="flex items-center gap-2 text-purple-600 font-medium">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Extracting data from Google Maps...
                  </span>
                ) : autoFillError ? (
                  <div className="text-red-600 text-xs">
                    <div className="font-semibold">❌ {autoFillError}</div>
                    {autoFillError.includes('APIs not enabled') && (
                      <div className="mt-2 text-xs bg-red-50 border border-red-200 rounded p-2">
                        <strong>To enable auto-fill:</strong>
                        <ol className="ml-4 mt-1 list-decimal">
                          <li>Go to <a href="https://console.cloud.google.com/google/maps-apis/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                          <li>Enable "Geocoding API"</li>
                          <li>Enable "Places API"</li>
                          <li>Refresh this page</li>
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>💡 Paste Google Maps link → Auto-fills details!</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={!link || isAutoFilling}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                <Sparkles className={`w-4 h-4 ${isAutoFilling ? 'animate-spin' : ''}`} />
                {isAutoFilling ? 'Loading...' : 'AI Fill'}
              </button>
            </div>

            {/* Fetch Status Panel */}
            {fetchStatus && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Fetch Results:</h4>
                {autoFillError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <strong>Error:</strong> {autoFillError}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📍 Name</span>
                    {fetchStatus.name ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        ✅ Found: "{name}"
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">❌ Not found</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🗺️ Coordinates</span>
                    {fetchStatus.coordinates ? (
                      <span className="text-green-600 font-medium">✅ Extracted</span>
                    ) : (
                      <span className="text-red-600 font-medium">❌ Not found</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">⭐ Rating</span>
                    {fetchStatus.rating ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        ✅ Found: {rating}
                      </span>
                    ) : (
                      <span className="text-orange-600 font-medium">⚠️ Not found - add manually below</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🖼️ Photo</span>
                    {fetchStatus.image ? (
                      <span className="text-green-600 font-medium">✅ Found</span>
                    ) : (
                      <span className="text-orange-600 font-medium">⚠️ Not found - add manually below</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📝 Description</span>
                    {fetchStatus.description ? (
                      <span className="text-green-600 font-medium">✅ Found</span>
                    ) : (
                      <span className="text-gray-400 font-medium">⚪ Optional</span>
                    )}
                  </div>
                </div>
                {(!fetchStatus.rating || !fetchStatus.image) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      💡 <strong>Tip:</strong> Open the Google Maps link in your browser to manually copy the rating and image.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Locavore Restaurant"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Jl. Pantai Berawa, Canggu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            />
            {address && link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-travel-teal hover:underline mt-1 inline-flex items-center gap-1"
              >
                📍 Open in Google Maps →
              </a>
            )}
            <div className="text-xs text-gray-500 mt-1">
              🎯 Auto-filled by AI Fill
            </div>
          </div>

          {/* Day (not for hotels) */}
          {activityType !== 'hotel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              >
                <option value="0">📌 No day (bookmark only)</option>
                {Array.from({ length: 25 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                💡 Select "No day" to add as a bookmark without scheduling
              </div>
            </div>
          )}

          {/* Booking URL (hotels only) */}
          {activityType === 'hotel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking.com URL
              </label>
              <input
                type="url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://www.booking.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              />
              <div className="text-xs text-gray-500 mt-1">
                🔗 Paste your Booking.com reservation link
              </div>
            </div>
          )}

          {/* Check-in/Check-out dates (hotels only) */}
          {activityType === 'hotel' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min="2026-05-06"
                  max="2026-05-30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min="2026-05-06"
                  max="2026-05-30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
                  required
                />
              </div>
            </div>
          )}

          {/* Instagram Photo Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/... or any image URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            />
            <div className="text-xs text-gray-500 mt-1">
              📸 Auto-filled by AI Fill, or paste Instagram/image link manually
            </div>
            {!imageUrl && fetchStatus && !fetchStatus.image && (
              <div className="mt-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded p-2">
                💡 <strong>How to get:</strong> Open Google Maps link → Click any photo → Right-click large image → "Copy image address" → Paste here
              </div>
            )}
            {imageUrl && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
                  <span>✓ Image preview</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Time (not for hotels) */}
          {activityType !== 'hotel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time (optional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⭐ Rating (0-5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="e.g., 4.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            />
            {!rating && fetchStatus && !fetchStatus.rating && (
              <div className="mt-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded p-2">
                💡 <strong>How to get:</strong> Open the Google Maps link → Look for the star rating (e.g., "4.4 ⭐") → Type it here
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-travel-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0c8c8c] transition-colors flex items-center justify-center gap-2 shadow-premium-sm"
            >
              <Plus className="w-5 h-5" />
              Add {activityType === 'hotel' ? 'Hotel' : capitalizeFirst(activityType)}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
