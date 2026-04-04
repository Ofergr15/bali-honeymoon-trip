import { GoogleMap, useLoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import React, { useState, useMemo, useEffect } from 'react';
import type { Activity, Hotel, DayItinerary } from '../types/trip';
import { getMarkerColor, ACTIVITY_COLORS, getActivityTypeColor, getAreaFromCoordinates } from '../utils/colors';
import ColorLegend from './ColorLegend';

interface MapProps {
  activities: Activity[];
  hotels: Hotel[];
  bookmarks?: Activity[]; // Unassigned activities
  showBookmarks?: boolean; // Whether to show bookmarks on map
  selectedDay?: number;
  selectedPlace?: string;
  placeDays?: number[]; // Array of day numbers for the selected place
  days?: DayItinerary[]; // All days to determine place for selected day
  onMarkerClick?: (item: Activity | Hotel) => void;
  selectedItem?: Activity | Hotel | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Center of Bali
const defaultCenter = {
  lat: -8.4095,
  lng: 115.1889,
};

// Get place name from day
function getPlaceNameFromDay(day: DayItinerary): string {
  if (day.hotel) {
    const name = day.hotel.name;
    if (name.includes('Canggu')) return 'Canggu';
    if (name.includes('Ubud') || name.includes('Sayan')) return 'Ubud';
    if (name.includes('Munduk')) return 'Munduk';
    if (name.includes('Sidemen') || name.includes('Samanvaya')) return 'Sidemen';
    if (name.includes('Gili Trawangan') || name.includes('Almarik')) return 'Gili Trawangan';
    if (name.includes('Gili Air')) return 'Gili Air';
    if (name.includes('Nusa Penida') || name.includes('Warnakali')) return 'Nusa Penida';
    if (name.includes('Uluwatu') || name.includes('Bulgari')) return 'Uluwatu';
  }
  if (day.title.includes('Canggu')) return 'Canggu';
  if (day.title.includes('Ubud')) return 'Ubud';
  if (day.title.includes('Munduk')) return 'Munduk';
  if (day.title.includes('Sidemen')) return 'Sidemen';
  if (day.title.includes('Gili Trawangan')) return 'Gili Trawangan';
  if (day.title.includes('Gili Air')) return 'Gili Air';
  if (day.title.includes('Nusa Penida')) return 'Nusa Penida';
  if (day.title.includes('Uluwatu')) return 'Uluwatu';
  if (day.title.includes('Denpasar') || day.title.includes('Airport')) return 'Uluwatu';
  return 'Other';
}

// Load Places library for auto-fill functionality
const libraries: ("places")[] = ["places"];

export default function Map({ activities, hotels, bookmarks, showBookmarks, selectedDay, selectedPlace, placeDays, days, onMarkerClick, selectedItem }: MapProps) {
  const [selectedMarker, setSelectedMarker] = useState<Activity | Hotel | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<Activity | Hotel | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const hoverTimeoutRef = React.useRef<number | null>(null);
  const userInteractingRef = React.useRef(false);
  const previousSelectedItemRef = React.useRef<Activity | Hotel | null>(null);
  const animationLockRef = React.useRef<boolean>(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      animationLockRef.current = false;
    };
  }, []);

  // Location data for zooming
  // VERIFIED COORDINATES for Bali destinations:
  // - Canggu: Beach town in southwest Bali
  // - Ubud: Cultural center in central Bali
  // - Munduk: Mountain village in north Bali
  // - Sidemen: Valley in east Bali
  // - Gili Trawangan: Island northwest of Lombok
  // - Gili Air: Island northwest of Lombok
  // - Nusa Penida: Island southeast of Bali
  // - Uluwatu: Peninsula in south Bali
  const locations = useMemo(() => [
    { lat: -8.6489, lng: 115.1328, name: 'Canggu', emoji: '🏖️', color: '#06B6D4', days: 3 },
    { lat: -8.5069, lng: 115.2625, name: 'Ubud', emoji: '🌿', color: '#10B981', days: 3 },
    { lat: -8.2661, lng: 115.0717, name: 'Munduk', emoji: '🏔️', color: '#8B4513', days: 3 },
    { lat: -8.4833, lng: 115.4167, name: 'Sidemen', emoji: '🌾', color: '#84CC16', days: 2 },
    { lat: -8.3500, lng: 116.0417, name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6', days: 2 },
    { lat: -8.3614, lng: 116.0861, name: 'Gili Air', emoji: '🌊', color: '#60A5FA', days: 2 },
    { lat: -8.7292, lng: 115.5431, name: 'Nusa Penida', emoji: '⛰️', color: '#1D4ED8', days: 1 },
    { lat: -8.8286, lng: 115.1036, name: 'Uluwatu', emoji: '🌅', color: '#F97316', days: 8 },
  ], []);

  console.log('🗺️ Map component initialized with locations:', locations.map(l => `${l.name}: ${l.lat}, ${l.lng}`));

  // Listen to zoom changes for auto-scaling markers and prevent rotation/tilt
  useEffect(() => {
    if (map) {
      const zoomListener = map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom) {
          setZoomLevel(currentZoom);
        }
      });

      // Prevent rotation/tilt only when it actually changes
      const tiltListener = map.addListener('tilt_changed', () => {
        if (map.getTilt() !== 0) {
          map.setTilt(0);
        }
      });

      const headingListener = map.addListener('heading_changed', () => {
        if (map.getHeading() !== 0) {
          map.setHeading(0);
        }
      });

      return () => {
        google.maps.event.removeListener(zoomListener);
        google.maps.event.removeListener(tiltListener);
        google.maps.event.removeListener(headingListener);
      };
    }
  }, [map]);

  // Google Earth-style animation: zoom out → pan → zoom in
  const animateToLocation = React.useCallback((targetLat: number, targetLng: number, targetZoom: number, label: string) => {
    if (!map || animationLockRef.current || userInteractingRef.current) return;

    // Lock to prevent overlapping clicks
    animationLockRef.current = true;

    const startCenter = map.getCenter();
    const startZoom = map.getZoom() || 10;
    const targetLatLng = { lat: targetLat, lng: targetLng };

    // Calculate distance to determine zoom out level
    const latDiff = Math.abs((startCenter?.lat() || 0) - targetLat);
    const lngDiff = Math.abs((startCenter?.lng() || 0) - targetLng);
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    console.log(`🎯 Animating to ${label}:`, { lat: targetLat, lng: targetLng, zoom: targetZoom, distance: distance.toFixed(3) });

    // Determine intermediate zoom level to ensure BOTH locations are visible
    // This prevents showing random places during the pan
    let intermediateZoom = 9;
    if (distance < 0.05) {
      // Very close - minimal zoom out
      intermediateZoom = Math.max(startZoom - 2, 11);
      console.log('   Strategy: Very close - minimal zoom out to', intermediateZoom);
    } else if (distance < 0.2) {
      // Close distance - zoom out enough to see both
      intermediateZoom = 10;
      console.log('   Strategy: Close - zoom to', intermediateZoom);
    } else if (distance < 0.5) {
      // Medium distance - need more zoom out
      intermediateZoom = 9;
      console.log('   Strategy: Medium distance - zoom to', intermediateZoom);
    } else if (distance < 1.0) {
      // Far distance - zoom way out
      intermediateZoom = 8;
      console.log('   Strategy: Far - zoom to', intermediateZoom);
    } else {
      // Very far - zoom out to see all of Bali
      intermediateZoom = 7;
      console.log('   Strategy: Very far - zoom to', intermediateZoom);
    }

    // STEP 1: Use fitBounds to show BOTH start and destination (official Google approach)
    console.log('   Step 1: Fitting bounds to show both locations');
    const bounds = new google.maps.LatLngBounds();
    if (startCenter) {
      bounds.extend(startCenter);
    }
    bounds.extend(targetLatLng);

    // Add padding so locations aren't at edge
    map.fitBounds(bounds, { top: 100, bottom: 100, left: 100, right: 100 });

    const zoomOutListener = map.addListener('idle', () => {
      google.maps.event.removeListener(zoomOutListener);

      // STEP 2: Pan to destination at zoomed-out level
      console.log('   Step 2: Panning to destination');
      map.panTo(targetLatLng);

      const panListener = map.addListener('idle', () => {
        google.maps.event.removeListener(panListener);

        // STEP 3: Zoom in to final zoom level
        console.log('   Step 3: Zooming in to', targetZoom);
        map.setZoom(targetZoom);

        const zoomInListener = map.addListener('idle', () => {
          google.maps.event.removeListener(zoomInListener);

          // STEP 4: Verify and force final position
          const finalCenter = map.getCenter();
          const finalZoom = map.getZoom();

          if (finalCenter) {
            const latDiff = Math.abs(finalCenter.lat() - targetLat);
            const lngDiff = Math.abs(finalCenter.lng() - targetLng);
            const zoomDiff = Math.abs((finalZoom || 0) - targetZoom);

            console.log('✅ Animation complete!');
            console.log('   Target:', { lat: targetLat, lng: targetLng, zoom: targetZoom });
            console.log('   Final:', { lat: finalCenter.lat().toFixed(4), lng: finalCenter.lng().toFixed(4), zoom: finalZoom });

            // Force exact position if not accurate
            if (latDiff > 0.001 || lngDiff > 0.001 || zoomDiff > 0.5) {
              console.log('⚠️ Forcing exact position');
              map.setCenter(targetLatLng);
              map.setZoom(targetZoom);
            }
          }

          // Release lock
          animationLockRef.current = false;
        });
      });
    });

    // Fallback timeout
    setTimeout(() => {
      if (animationLockRef.current) {
        console.log('⏱️ Timeout - forcing unlock and final position');
        map.setCenter(targetLatLng);
        map.setZoom(targetZoom);
        animationLockRef.current = false;
      }
    }, 5000);
  }, [map]);

  // Zoom to selected place, day, or item with Google Earth-style animation
  useEffect(() => {
    console.log('📍 Map useEffect triggered:', { selectedPlace, selectedDay, selectedItem: selectedItem?.name });

    if (!map) {
      console.log('⚠️ Map not ready yet');
      return;
    }

    if (selectedItem && 'location' in selectedItem && selectedItem.location) {
      console.log('🎯 Selected item:', selectedItem.name, 'at', selectedItem.location);
      previousSelectedItemRef.current = selectedItem;
      animateToLocation(
        selectedItem.location.lat,
        selectedItem.location.lng,
        17,
        `${selectedItem.name} (marker)`
      );
    } else {
      previousSelectedItemRef.current = null;
    }

    if (selectedPlace && !selectedItem) {
      console.log('🏖️ Selected place from navigation bar:', selectedPlace);
      console.log('🏖️ Available locations:', locations.map(l => `${l.name} (${l.lat}, ${l.lng})`));

      const location = locations.find(loc => loc.name === selectedPlace);
      console.log('🏖️ Found location match:', location);

      if (location) {
        console.log('✅ Animating to:', location.name, 'at coordinates:', location.lat, location.lng, 'zoom: 15');
        animateToLocation(
          location.lat,
          location.lng,
          15,
          `${selectedPlace} (navigation bar)`
        );
      } else {
        console.error('❌ Location NOT found for:', selectedPlace);
        console.error('❌ This means the place name doesn\'t match any location in the array');
      }
    } else if (selectedDay && days && !selectedItem && !selectedPlace) {
      // Find the place for the selected day and zoom to it
      const selectedDayData = days.find(d => d.day === selectedDay);
      if (selectedDayData) {
        const placeName = getPlaceNameFromDay(selectedDayData);
        const location = locations.find(loc => loc.name === placeName);
        if (location) {
          animateToLocation(
            location.lat,
            location.lng,
            15,
            `${placeName} (day ${selectedDay})`
          );
        }
      }
    } else if (!selectedPlace && !selectedDay && !selectedItem) {
      // Reset to default view
      animationLockRef.current = false; // Release lock for reset
      map.panTo(defaultCenter);
      map.setZoom(10);
    }
  }, [map, selectedPlace, selectedDay, selectedItem, locations, days, animateToLocation]);

  // Calculate marker scale based on zoom level
  const getMarkerScale = (baseScale: number) => {
    // Scale markers based on zoom: zoom 8 = 0.8x, zoom 10 = 1x, zoom 15 = 1.5x
    const scaleFactor = Math.pow(1.15, zoomLevel - 10);
    return baseScale * scaleFactor;
  };

  // Filter activities by selected day or place
  const filteredActivities = useMemo(() => {
    if (selectedDay) {
      return activities.filter(activity => activity.day === selectedDay);
    }
    if (placeDays && placeDays.length > 0) {
      return activities.filter(activity => activity.day && placeDays.includes(activity.day));
    }
    return activities;
  }, [activities, selectedDay, placeDays]);

  // Filter hotels by selected day or place
  const filteredHotels = useMemo(() => {
    if (selectedDay) {
      return hotels.filter(hotel => {
        const checkInDate = new Date(hotel.checkIn);
        const checkOutDate = new Date(hotel.checkOut);
        // Trip starts on May 6, 2026
        const dayDate = new Date('2026-05-06');
        dayDate.setDate(dayDate.getDate() + selectedDay - 1);
        return dayDate >= checkInDate && dayDate < checkOutDate;
      });
    }
    if (placeDays && placeDays.length > 0) {
      // Filter hotels that overlap with any of the place days
      return hotels.filter(hotel => {
        const checkInDate = new Date(hotel.checkIn);
        const checkOutDate = new Date(hotel.checkOut);
        return placeDays.some(day => {
          const dayDate = new Date('2026-05-06');
          dayDate.setDate(dayDate.getDate() + day - 1);
          return dayDate >= checkInDate && dayDate < checkOutDate;
        });
      });
    }
    return hotels;
  }, [hotels, selectedDay, placeDays]);

  const handleMarkerClick = (item: Activity | Hotel) => {
    setSelectedMarker(item);
    onMarkerClick?.(item);
  };

  // Handle hover with delay to prevent flickering
  const handleMarkerHover = (item: Activity | Hotel | any) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMarker(item);
  };

  const handleMarkerUnhover = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMarker(null);
    }, 150); // 150ms delay before hiding
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-600 font-semibold mb-2">Error loading Google Maps</p>
          <p className="text-sm text-gray-600">Please check your API key in the .env file</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={10}
        center={defaultCenter}
        onLoad={(mapInstance) => {
          setMap(mapInstance);
          // Aggressively force flat 2D map
          mapInstance.setTilt(0);
          mapInstance.setHeading(0);
          mapInstance.setMapTypeId('hybrid');

          // Disable all rotation/tilt gestures at the Maps API level
          const mapOptions = {
            gestureHandling: 'greedy',
            tilt: 0,
            heading: 0,
            rotateControl: false,
            keyboardShortcuts: false,
          };
          mapInstance.setOptions(mapOptions);

          // Detect user interactions to prevent animation interference
          mapInstance.addListener('dragstart', () => {
            console.log('👆 User started dragging');
            userInteractingRef.current = true;
            animationLockRef.current = false; // Release animation lock
          });

          mapInstance.addListener('dragend', () => {
            console.log('👆 User stopped dragging');
            setTimeout(() => {
              userInteractingRef.current = false;
            }, 500); // Small delay to prevent immediate re-animation
          });

          // Detect manual zoom changes
          mapInstance.addListener('zoom_changed', () => {
            if (!animationLockRef.current) {
              // User is manually zooming
              userInteractingRef.current = true;
              setTimeout(() => {
                userInteractingRef.current = false;
              }, 1000);
            }
          });
        }}
        options={{
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
          mapTypeId: 'hybrid',
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
          },
          streetViewControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
          scaleControl: false,
          panControl: false,
          rotateControl: false,
          tilt: 0,
          heading: 0,
          clickableIcons: false,
          disableDoubleClickZoom: false,
          maxZoom: 20, // Allow close zoom for detailed views
          minZoom: 8,
          // Disable all rotation capabilities
          draggableCursor: 'default',
          draggingCursor: 'move',
          // Force disable 45° imagery
          restriction: {
            latLngBounds: {
              north: -8.0,
              south: -9.0,
              west: 114.5,
              east: 116.5,
            },
            strictBounds: false,
          },
        }}
      >
      {/* Route line - color-coded by location */}
      {!selectedDay && (
        <>
          {/* Route lines between locations */}
          {locations.slice(0, -1).map((start, i) => {
            const end = locations[i + 1];
            return (
              <Polyline
                key={`segment-${i}`}
                path={[start, end]}
                options={{
                  strokeColor: start.color,
                  strokeOpacity: 0,
                  strokeWeight: 3,
                  geodesic: true,
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 0.6,
                      strokeColor: start.color,
                      scale: 2.5,
                    },
                    offset: '0',
                    repeat: '15px',
                  }],
                }}
              />
            );
          })}

          {/* Location markers - circles with names */}
          {locations.map((location) => {
            // Vertical offset to place label above circle
            let verticalOffset = 0.025 / Math.pow(1.15, zoomLevel - 10);

            // Check if this location is being hovered (hide label if InfoWindow is showing)
            const isHovered = hoveredMarker && 'isLocationMarker' in hoveredMarker && hoveredMarker.name === location.name;

            return (
              <React.Fragment key={`location-${location.name}`}>
                {/* Circle marker */}
                <Marker
                  position={{ lat: location.lat, lng: location.lng }}
                  onClick={() => {
                    // Trigger smooth Google Earth animation
                    console.log('🏝️ Clicked on MAP CHIP:', location.name);
                    console.log('🏝️ Target coordinates:', { lat: location.lat, lng: location.lng, zoom: 15 });
                    console.log('🏝️ Full location data:', location);

                    // Start smooth animation (cleanup is handled internally)
                    animateToLocation(
                      location.lat,
                      location.lng,
                      15,
                      `${location.name} (map chip)`
                    );
                  }}
                  onMouseOver={() => {
                    // Show location info on hover
                    handleMarkerHover({
                      id: `location-${location.name}`,
                      name: location.name,
                      location: { lat: location.lat, lng: location.lng },
                      description: `${location.emoji} ${location.days} days in ${location.name}`,
                      isLocationMarker: true,
                    });
                  }}
                  onMouseOut={handleMarkerUnhover}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: location.color,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: getMarkerScale(11),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  options={{
                    cursor: 'pointer',
                  }}
                  zIndex={100}
                />
                {/* Text label above the circle - hide when InfoWindow is showing */}
                {!isHovered && (
                  <Marker
                    position={{
                      lat: location.lat + verticalOffset,
                      lng: location.lng
                    }}
                    icon={{
                      path: 'M 0,0',
                      scale: 0,
                    }}
                    label={{
                      text: `${location.emoji} ${location.name}`,
                      color: '#1f2937',
                      fontSize: '13px',
                      fontWeight: '600',
                      className: 'map-label',
                    }}
                    options={{
                      clickable: false, // Don't capture mouse events
                    }}
                    zIndex={99} // Below the circle so it doesn't block hover
                  />
                )}
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Hotel markers */}
      {filteredHotels.map((hotel) => {
        const showLabel = zoomLevel >= 11; // Show labels when zoomed in
        const isSelected = selectedItem && selectedItem.id === hotel.id;
        return (
          <React.Fragment key={hotel.id}>
            {/* Pulsing ring for selected marker */}
            {isSelected && (
              <>
                <Marker
                  position={hotel.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: ACTIVITY_COLORS.hotel.color,
                    fillOpacity: 0.2,
                    strokeColor: ACTIVITY_COLORS.hotel.color,
                    strokeWeight: 3,
                    scale: getMarkerScale(18),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={90}
                />
                <Marker
                  position={hotel.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    strokeColor: ACTIVITY_COLORS.hotel.color,
                    strokeWeight: 2,
                    scale: getMarkerScale(15),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={91}
                />
              </>
            )}
            <Marker
              position={hotel.location}
              onClick={() => handleMarkerClick(hotel)}
              onMouseOver={() => handleMarkerHover(hotel)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: ACTIVITY_COLORS.hotel.color,
                fillOpacity: 0.95,
                strokeColor: isSelected ? '#FFD700' : '#ffffff',
                strokeWeight: isSelected ? 4 : 2.5,
                scale: isSelected ? getMarkerScale(12) : getMarkerScale(10),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 200 : undefined}
            />
            {showLabel && (
              <Marker
                position={{
                  lat: hotel.location.lat,
                  lng: hotel.location.lng + (0.008 / Math.pow(1.15, zoomLevel - 10))
                }}
                icon={{
                  path: 'M 0,0',
                  scale: 0,
                }}
                label={{
                  text: hotel.name.length > 25 ? hotel.name.substring(0, 22) + '...' : hotel.name,
                  color: '#1f2937',
                  fontSize: '11px',
                  fontWeight: '600',
                  className: 'map-label',
                }}
                zIndex={150}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Activity markers */}
      {filteredActivities.map((activity) => {
        const showLabel = zoomLevel >= 11; // Show labels when zoomed in
        const isSelected = selectedItem && selectedItem.id === activity.id;
        const activityColor = getMarkerColor({ type: activity.type });
        return (
          <React.Fragment key={activity.id}>
            {/* Pulsing ring for selected marker */}
            {isSelected && (
              <>
                <Marker
                  position={activity.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: activityColor,
                    fillOpacity: 0.2,
                    strokeColor: activityColor,
                    strokeWeight: 3,
                    scale: getMarkerScale(16),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={90}
                />
                <Marker
                  position={activity.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    strokeColor: activityColor,
                    strokeWeight: 2,
                    scale: getMarkerScale(13),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={91}
                />
              </>
            )}
            <Marker
              position={activity.location}
              onClick={() => handleMarkerClick(activity)}
              onMouseOver={() => handleMarkerHover(activity)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: activityColor,
                fillOpacity: 0.92,
                strokeColor: isSelected ? '#FFD700' : '#ffffff',
                strokeWeight: isSelected ? 3.5 : 2,
                scale: isSelected ? getMarkerScale(11) : getMarkerScale(9),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 200 : undefined}
            />
            {showLabel && (
              <Marker
                position={{
                  lat: activity.location.lat,
                  lng: activity.location.lng + (0.008 / Math.pow(1.15, zoomLevel - 10))
                }}
                icon={{
                  path: 'M 0,0',
                  scale: 0,
                }}
                label={{
                  text: activity.name.length > 25 ? activity.name.substring(0, 22) + '...' : activity.name,
                  color: '#1f2937',
                  fontSize: '11px',
                  fontWeight: '600',
                  className: 'map-label',
                }}
                zIndex={150}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Bookmark markers - shown when bookmarks panel is open */}
      {showBookmarks && bookmarks && bookmarks.map((bookmark) => {
        const showLabel = zoomLevel >= 11;
        const isSelected = selectedItem && selectedItem.id === bookmark.id;
        const bookmarkColor = '#FFA500'; // Orange/gold color for bookmarks
        return (
          <React.Fragment key={bookmark.id}>
            {/* Pulsing ring for selected bookmark */}
            {isSelected && (
              <>
                <Marker
                  position={bookmark.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: bookmarkColor,
                    fillOpacity: 0.2,
                    strokeColor: bookmarkColor,
                    strokeWeight: 3,
                    scale: getMarkerScale(16),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={90}
                />
                <Marker
                  position={bookmark.location}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    strokeColor: bookmarkColor,
                    strokeWeight: 2,
                    scale: getMarkerScale(13),
                    anchor: new google.maps.Point(0, 0),
                  }}
                  zIndex={91}
                />
              </>
            )}
            <Marker
              position={bookmark.location}
              onClick={() => handleMarkerClick(bookmark)}
              onMouseOver={() => handleMarkerHover(bookmark)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: bookmarkColor,
                fillOpacity: 0.92,
                strokeColor: isSelected ? '#FFD700' : '#ffffff',
                strokeWeight: isSelected ? 4 : 3,
                scale: isSelected ? getMarkerScale(12) : getMarkerScale(10),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 200 : 180} // Higher than regular activities
              label={{
                text: '📌',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            />
            {showLabel && (
              <Marker
                position={{
                  lat: bookmark.location.lat,
                  lng: bookmark.location.lng + (0.008 / Math.pow(1.15, zoomLevel - 10))
                }}
                icon={{
                  path: 'M 0,0',
                  scale: 0,
                }}
                label={{
                  text: bookmark.name.length > 25 ? bookmark.name.substring(0, 22) + '...' : bookmark.name,
                  color: '#1f2937',
                  fontSize: '11px',
                  fontWeight: '600',
                  className: 'map-label',
                }}
                zIndex={150}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Info window - show on hover or click */}
      {(hoveredMarker || selectedMarker) && (() => {
        const markerToShow = hoveredMarker || selectedMarker;
        if (!markerToShow) return null;

        // Offset InfoWindow position slightly above marker to prevent blocking hover
        const infoWindowPosition = 'location' in markerToShow
          ? {
              lat: markerToShow.location.lat + 0.002, // Offset slightly north
              lng: markerToShow.location.lng
            }
          : { lat: 0, lng: 0 };

        return (
          <InfoWindow
            position={infoWindowPosition}
            options={{
              pixelOffset: new google.maps.Size(0, -40), // Move up 40px to not cover marker
            }}
            onCloseClick={() => {
              setSelectedMarker(null);
              setHoveredMarker(null);
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
          >
            <div
              className="p-2 max-w-xs"
              onMouseEnter={() => {
                // Keep InfoWindow visible when mouse is over it
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
              }}
              onMouseLeave={handleMarkerUnhover}
            >
              {markerToShow.imageUrl && (
                <img
                  src={markerToShow.imageUrl}
                  alt={markerToShow.name}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              {/* Type & Area Badges */}
              <div className="flex items-center gap-2 mb-2">
                {/* Don't show type badge for location markers */}
                {!('isLocationMarker' in markerToShow) && (
                  <>
                    {'type' in markerToShow ? (() => {
                      const typeInfo = getActivityTypeColor(markerToShow.type);
                      return (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded capitalize border"
                          style={{
                            backgroundColor: `${typeInfo.color}15`,
                            color: typeInfo.color,
                            borderColor: typeInfo.color
                          }}
                        >
                          {typeInfo.emoji} {typeInfo.name}
                        </span>
                      );
                    })() : (
                      <span
                        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded capitalize border"
                        style={{
                          backgroundColor: `${ACTIVITY_COLORS.hotel.color}15`,
                          color: ACTIVITY_COLORS.hotel.color,
                          borderColor: ACTIVITY_COLORS.hotel.color
                        }}
                      >
                        {ACTIVITY_COLORS.hotel.emoji} Hotel
                      </span>
                    )}
                  </>
                )}
                {(() => {
                  const area = getAreaFromCoordinates(markerToShow.location);
                  return (
                    <span
                      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
                      style={{
                        backgroundColor: `${area.color}20`,
                        color: area.color
                      }}
                    >
                      {area.emoji} {area.name}
                    </span>
                  );
                })()}
              </div>

              <h3 className="font-semibold text-lg mb-1">
                {markerToShow.name}
              </h3>

              {markerToShow.description && (
                <p className="text-sm text-gray-700 mb-2">
                  {markerToShow.description}
                </p>
              )}
              {'rating' in markerToShow && markerToShow.rating && (
                <p className="text-sm">
                  ⭐ {markerToShow.rating}
                </p>
              )}
              {'time' in markerToShow && (
                <p className="text-sm text-gray-600 mt-1">
                  🕐 {markerToShow.time}
                </p>
              )}
            </div>
          </InfoWindow>
        );
      })()}
      </GoogleMap>

      {/* Color Legend */}
      <ColorLegend />
    </div>
  );
}
