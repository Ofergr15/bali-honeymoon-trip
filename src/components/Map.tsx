import { GoogleMap, useLoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import React, { useState, useMemo, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { Activity, Hotel, DayItinerary } from '../types/trip';
import { getMarkerColor, ACTIVITY_COLORS, getActivityTypeColor, getAreaFromCoordinates } from '../utils/colors';
import { PLACE_LOCATIONS, getPlaceInfo } from '../utils/locations';
import ColorLegend from './ColorLegend';
import OpeningHoursDisplay from './OpeningHoursDisplay';
import { Star, MapPin } from 'lucide-react';

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
  onPlaceClick?: (placeName: string) => void; // NEW: Callback when clicking location chip
  selectedItem?: Activity | Hotel | null;
}

export interface MapRef {
  zoomToPlace: (placeName: string) => void;
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

const Map = forwardRef<MapRef, MapProps>(({ activities, hotels, bookmarks, showBookmarks, selectedDay, selectedPlace, placeDays, days, onMarkerClick, onPlaceClick, selectedItem }, ref) => {
  // Track render count to see how often component re-renders
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;

  const [selectedMarker, setSelectedMarker] = useState<Activity | Hotel | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<Activity | Hotel | null>(null);
  const [hoveredPlace, setHoveredPlace] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // USE REF FOR ZOOM - don't trigger re-renders on every zoom change!
  const zoomLevelRef = React.useRef(10);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const hoverTimeoutRef = React.useRef<number | null>(null);
  const isUserInteractingRef = React.useRef(false);
  const lastAnimatedIdRef = React.useRef<string | null>(null);
  const dragStartPositionRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const lastDragPositionRef = React.useRef<{ lat: number; lng: number } | null>(null);

  // Log EVERY render with all state values to track what's changing
  console.log(`🔄 ========== RENDER #${renderCountRef.current} ==========`);
  console.log('   Props:');
  console.log('   - selectedItem:', selectedItem?.name || 'null');
  console.log('   - selectedDay:', selectedDay);
  console.log('   State:');
  console.log('   - zoomLevel (REF):', zoomLevelRef.current);
  console.log('   - selectedMarker:', selectedMarker?.name || 'null');
  console.log('   - hoveredMarker:', hoveredMarker?.name || 'null');
  console.log('   - map instance:', map ? 'exists' : 'null');
  console.log('========================================');

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

  // Memoize options to prevent new object on every render (which causes fast pan issues)
  const mapOptions = useMemo(() => ({
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
      style: 1, // HORIZONTAL_BAR
      position: 2, // TOP_CENTER
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
    maxZoom: 20,
    minZoom: 8,
    draggableCursor: 'default',
    draggingCursor: 'move',
    // Removed overly restrictive bounds - was preventing navigation to Gili Islands
    // restriction: {
    //   latLngBounds: {
    //     north: -8.0,
    //     south: -9.0,
    //     west: 114.5,
    //     east: 116.5,
    //   },
    //   strictBounds: false,
    // },
  }), []); // Never changes - same object every render!

  // Listen to zoom changes - USE REF to avoid triggering re-renders!
  useEffect(() => {
    if (map) {
      const zoomListener = map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom) {
          const previousZoom = zoomLevelRef.current;
          zoomLevelRef.current = currentZoom;

          // Only force re-render if we cross the label threshold (zoom 11)
          const crossedLabelThreshold =
            (previousZoom < 11 && currentZoom >= 11) ||
            (previousZoom >= 11 && currentZoom < 11);

          if (crossedLabelThreshold) {
            console.log('🔍 ZOOM crossed label threshold:', currentZoom.toFixed(2), '→ forcing update for labels');
            forceUpdate(); // Only re-render when labels need to show/hide
          } else {
            console.log('🔍 ZOOM changed:', currentZoom.toFixed(2), '→ stored in ref, NO RE-RENDER');
          }
        }
      });

      console.log('✅ Zoom listener using REF (no re-renders except for label threshold)');

      return () => {
        google.maps.event.removeListener(zoomListener);
      };
    }
  }, [map]);

  // Smooth animation with visible journey during pan
  const animateToLocation = React.useCallback((targetLat: number, targetLng: number, targetZoom: number, source: string = 'unknown') => {
    if (!map) return;

    const currentCenter = map.getCenter();
    if (!currentCenter) return;

    const startLat = currentCenter.lat();
    const startLng = currentCenter.lng();
    const currentZoom = map.getZoom() || 10;

    console.log('📍 Smooth navigate to:', source);

    // SIMPLE SMOOTH PAN - let Google Maps handle it natively
    // Single panTo() is smoother than multiple interrupted calls
    map.panTo({ lat: targetLat, lng: targetLng });

    // Wait for pan to complete before zooming (longer wait = more visible pan)
    const panDuration = 800; // 800ms to see the pan movement
    const zoomDiff = targetZoom - currentZoom;
    const zoomSteps = Math.abs(Math.ceil(zoomDiff / 2));

    if (zoomSteps > 0) {
      for (let i = 1; i <= zoomSteps; i++) {
        setTimeout(() => {
          const stepZoom = currentZoom + (zoomDiff > 0 ? i * 2 : -i * 2);
          const clampedZoom = zoomDiff > 0
            ? Math.min(stepZoom, targetZoom)
            : Math.max(stepZoom, targetZoom);

          console.log('   Zoom step', i, '→', clampedZoom);
          map.setZoom(clampedZoom);

          // FINAL STEP: Ensure exact center
          if (i === zoomSteps) {
            setTimeout(() => {
              map.panTo({ lat: targetLat, lng: targetLng });
            }, 300);
          }
        }, panDuration + (i * 400)); // SLOWER: 400ms per zoom step (was 300ms)
      }
    }
  }, [map]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    zoomToPlace: (placeName: string) => {
      const placeData = PLACE_LOCATIONS[placeName as keyof typeof PLACE_LOCATIONS];
      if (placeData && map) {
        console.log('🗺️ Zooming to place from sidebar:', placeName);
        animateToLocation(placeData.lat, placeData.lng, 14, `sidebar-place-${placeName}`);
      }
    }
  }), [map, animateToLocation]);

  // ONLY animate when a marker is explicitly selected from sidebar
  // This prevents the "reactive loop trap" where state changes trigger unwanted animations
  useEffect(() => {
    console.log('🔍 useEffect[selectedItem] fired, selectedItem:', selectedItem?.name || 'null');

    if (!map || !selectedItem || !('location' in selectedItem) || !selectedItem.location) {
      lastAnimatedIdRef.current = null;
      console.log('   ↳ No animation (no item or no location)');
      return;
    }

    // Deduplication: Don't re-animate to the same item
    if (lastAnimatedIdRef.current === selectedItem.id) {
      console.log('⏭️ Already animated to:', selectedItem.name);
      return;
    }

    console.log('🎯 Explicit selection:', selectedItem.name, '→ TRIGGERING ANIMATION');
    lastAnimatedIdRef.current = selectedItem.id;
    animateToLocation(selectedItem.location.lat, selectedItem.location.lng, 17, 'selectedItem-useEffect');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedItem]); // animateToLocation is stable (useCallback), don't need it as dependency

  // Calculate marker scale based on zoom level (from ref, not state!)
  // REVERSE scaling: markers should stay same size or get SMALLER when zoomed in
  const getMarkerScale = (baseScale: number) => {
    // At zoom 8: 1.2x (bigger), at zoom 10: 1x, at zoom 15: 0.7x (smaller), at zoom 18: 0.5x
    const scaleFactor = Math.pow(0.92, zoomLevelRef.current - 10);
    return baseScale * scaleFactor;
  };

  // Filter activities by selected day or place
  const filteredActivities = useMemo(() => {
    console.log('🔍 Filtering activities:', {
      selectedPlace,
      selectedDay,
      placeDays,
      totalActivities: activities.length
    });

    // If no place selected, don't show any activity pins
    if (!selectedPlace && !selectedDay) {
      console.log('   → No place or day selected, hiding all pins');
      return [];
    }

    if (selectedDay) {
      const filtered = activities.filter(activity => activity.day === selectedDay);
      console.log(`   → Filtered by day ${selectedDay}: ${filtered.length} activities`);
      return filtered;
    }
    if (placeDays && placeDays.length > 0) {
      const filtered = activities.filter(activity => activity.day && placeDays.includes(activity.day));
      console.log(`   → Filtered by placeDays [${placeDays}]: ${filtered.length} activities`);
      return filtered;
    }
    console.log('   → No filters matched, returning all activities');
    return activities;
  }, [activities, selectedDay, placeDays, selectedPlace]);

  // Filter hotels by selected day or place
  const filteredHotels = useMemo(() => {
    // If no place selected, don't show any hotel pins
    if (!selectedPlace && !selectedDay) {
      return [];
    }

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
  }, [hotels, selectedDay, placeDays, selectedPlace]);

  const handleMarkerClick = (item: Activity | Hotel) => {
    console.log('🖱️ MARKER CLICKED:', item.name, '→ opening DetailsPanel');
    // Clear hover state
    setHoveredMarker(null);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Open DetailsPanel (like clicking from list)
    onMarkerClick?.(item);
  };

  // Handle hover - DISABLED for cleaner UX (only click to see details)
  const handleMarkerHover = (item: Activity | Hotel | any) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMarker(item);
  };

  const handleMarkerUnhover = () => {
    // Add delay before closing to allow moving mouse to InfoWindow
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredMarker(null);
    }, 300);
  };

  const handleInfoWindowMouseEnter = () => {
    // Keep InfoWindow open when hovering over it
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleInfoWindowMouseLeave = () => {
    // Close InfoWindow when leaving it
    setHoveredMarker(null);
  };

  // Place chip hover handlers with delay
  const placeHoverTimeoutRef = React.useRef<number | null>(null);

  const handlePlaceHover = (placeName: string) => {
    // Clear any existing timeout
    if (placeHoverTimeoutRef.current) {
      clearTimeout(placeHoverTimeoutRef.current);
    }
    setHoveredPlace(placeName);
  };

  const handlePlaceUnhover = () => {
    // Add delay before closing to allow moving mouse to InfoWindow
    placeHoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredPlace(null);
    }, 300);
  };

  const handlePlaceInfoWindowMouseEnter = () => {
    // Keep InfoWindow open when hovering over it
    if (placeHoverTimeoutRef.current) {
      clearTimeout(placeHoverTimeoutRef.current);
    }
  };

  const handlePlaceInfoWindowMouseLeave = () => {
    // Close InfoWindow when leaving it
    setHoveredPlace(null);
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
        onLoad={(mapInstance) => {
          setMap(mapInstance);

          // Set initial position ONCE - then never update via props (uncontrolled)
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(10);
          mapInstance.setMapTypeId('hybrid');

          // Update ref for initial zoom
          zoomLevelRef.current = 10;

          console.log('✅ Map loaded - initial position set, now uncontrolled');

          // === COMPREHENSIVE DRAG LOGGING ===
          // Track every drag movement to see snap-back in real-time

          mapInstance.addListener('dragstart', () => {
            const center = mapInstance.getCenter();
            console.log('🖱️ DRAGSTART - User started dragging');
            console.log('   Start position:', center ? `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}` : 'unknown');

            // Track start position for momentum calculation
            if (center) {
              dragStartPositionRef.current = { lat: center.lat(), lng: center.lng() };
              lastDragPositionRef.current = { lat: center.lat(), lng: center.lng() };
            }

            isUserInteractingRef.current = true;
          });

          mapInstance.addListener('drag', () => {
            const center = mapInstance.getCenter();
            if (center) {
              console.log('👋 DRAG - Position:', `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}`);
              // Track last position during drag
              lastDragPositionRef.current = { lat: center.lat(), lng: center.lng() };
            }
          });

          mapInstance.addListener('dragend', () => {
            const center = mapInstance.getCenter();
            console.log('🛑 DRAGEND - User stopped dragging');
            console.log('   End position:', center ? `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}` : 'unknown');

            // Calculate drag vector for momentum analysis
            if (center && dragStartPositionRef.current && lastDragPositionRef.current) {
              const dragVector = {
                lat: lastDragPositionRef.current.lat - dragStartPositionRef.current.lat,
                lng: lastDragPositionRef.current.lng - dragStartPositionRef.current.lng,
              };
              console.log('   Drag vector:', dragVector);
              console.log('   🌊 Allowing natural momentum/inertia to continue...');
            }

            isUserInteractingRef.current = false;

            // Clear drag tracking after a delay (let momentum finish)
            setTimeout(() => {
              dragStartPositionRef.current = null;
              lastDragPositionRef.current = null;
            }, 1000);
          });

          // Track center changes (this fires when map center changes for ANY reason)
          let centerChangeCount = 0;
          let lastCenterChangeTime = Date.now();
          let lastCenter: { lat: number; lng: number } | null = null;

          mapInstance.addListener('center_changed', () => {
            centerChangeCount++;
            const center = mapInstance.getCenter();
            const now = Date.now();
            const timeSinceLastChange = now - lastCenterChangeTime;
            lastCenterChangeTime = now;

            if (center) {
              const currentPos = { lat: center.lat(), lng: center.lng() };

              // Calculate distance moved
              let distanceMoved = 0;
              if (lastCenter) {
                const latDiff = currentPos.lat - lastCenter.lat;
                const lngDiff = currentPos.lng - lastCenter.lng;
                distanceMoved = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
              }

              console.log(`📍 CENTER_CHANGED #${centerChangeCount}:`, `${currentPos.lat.toFixed(6)}, ${currentPos.lng.toFixed(6)}`);
              console.log(`   ⏱️ ${timeSinceLastChange}ms since last, Distance: ${distanceMoved.toFixed(8)}`);

              // DETECT SUDDEN JUMPS (large distance in short time = not natural momentum)
              if (!isUserInteractingRef.current && distanceMoved > 0.01 && timeSinceLastChange < 50) {
                console.log('   🚨 SUDDEN JUMP DETECTED! Large distance in short time!');
                console.trace('   Stack trace of jump:');
              }

              // Detect if this is momentum (small movements, frequent)
              if (!isUserInteractingRef.current) {
                if (lastDragPositionRef.current && dragStartPositionRef.current && timeSinceLastChange < 100) {
                  console.log('   🌊 Momentum/inertia (smooth drift)');
                } else if (distanceMoved > 0.001) {
                  console.log('   ⚠️ UNEXPECTED CENTER CHANGE!');
                  console.trace('   Stack trace:');
                }
              }

              lastCenter = currentPos;
            }
          });
        }}
        options={mapOptions}
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
            let verticalOffset = 0.025 / Math.pow(1.15, zoomLevelRef.current - 10);

            return (
              <React.Fragment key={`location-${location.name}`}>
                {/* Circle marker */}
                <Marker
                  position={{ lat: location.lat, lng: location.lng }}
                  onClick={() => {
                    // Event-driven animation - explicit user click
                    console.log('🏝️ Clicked location chip:', location.name);
                    animateToLocation(location.lat, location.lng, 14, `location-chip-${location.name}`);
                    // Trigger place selection to show activity pins
                    onPlaceClick?.(location.name);
                  }}
                  onMouseOver={() => handlePlaceHover(location.name)}
                  onMouseOut={handlePlaceUnhover}
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
                {/* Text label above the circle - always visible */}
                <Marker
                  position={{
                    lat: location.lat + verticalOffset,
                    lng: location.lng
                  }}
                  onClick={() => {
                    // Make label clickable too!
                    console.log('🏝️ Clicked location label:', location.name);
                    animateToLocation(location.lat, location.lng, 14, `location-label-${location.name}`);
                    onPlaceClick?.(location.name);
                  }}
                  onMouseOver={() => handlePlaceHover(location.name)}
                  onMouseOut={handlePlaceUnhover}
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
                    cursor: 'pointer', // Show pointer cursor
                  }}
                  zIndex={99} // Below the circle so it doesn't block hover
                />
              </React.Fragment>
            );
          })}

          {/* InfoWindow for hovered place */}
          {hoveredPlace && (() => {
            const placeLocation = locations.find(loc => loc.name === hoveredPlace);
            if (!placeLocation) return null;

            // Count days and activities for this place
            const placeDaysForInfo = days?.filter(day => getPlaceNameFromDay(day) === hoveredPlace) || [];
            const dayCount = placeDaysForInfo.length;
            const activityCount = placeDaysForInfo.reduce((sum, day) => sum + day.activities.length, 0);

            return (
              <InfoWindow
                position={{ lat: placeLocation.lat, lng: placeLocation.lng }}
                options={{
                  pixelOffset: new google.maps.Size(0, -15),
                  disableAutoPan: true,
                }}
                onCloseClick={() => setHoveredPlace(null)}
              >
                <div
                  onMouseEnter={handlePlaceInfoWindowMouseEnter}
                  onMouseLeave={handlePlaceInfoWindowMouseLeave}
                  className="p-3 min-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{placeLocation.emoji}</span>
                    <h3 className="text-base font-bold text-gray-900">{hoveredPlace}</h3>
                  </div>

                  {dayCount > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{dayCount} day{dayCount !== 1 ? 's' : ''}</span>
                        {activityCount > 0 && (
                          <span className="text-gray-500">• {activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-travel-teal font-medium pt-2 border-t border-gray-200">
                    💡 Click to zoom and view activities
                  </div>
                </div>
              </InfoWindow>
            );
          })()}
        </>
      )}

      {/* Hotel markers */}
      {filteredHotels.map((hotel) => {
        const isSelected = selectedItem && selectedItem.id === hotel.id;
        const showLabel = isSelected; // Only show label when clicked/selected
        return (
          <React.Fragment key={hotel.id}>
            {/* Circle background */}
            <Marker
              position={hotel.location}
              onClick={() => handleMarkerClick(hotel)}
              onMouseOver={() => handleMarkerHover(hotel)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FFFFFF',
                fillOpacity: 0.95,
                strokeColor: ACTIVITY_COLORS.hotel.color,
                strokeWeight: 3,
                scale: getMarkerScale(12),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 199 : 99}
            />
            {/* Emoji on top */}
            <Marker
              position={hotel.location}
              onClick={() => handleMarkerClick(hotel)}
              onMouseOver={() => handleMarkerHover(hotel)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: 'M 0,0',
                scale: 0,
              }}
              label={{
                text: ACTIVITY_COLORS.hotel.emoji,
                fontSize: '24px',
                className: isSelected ? 'selected-marker' : '',
              }}
              zIndex={isSelected ? 200 : 100}
            />
            {showLabel && (
              <Marker
                position={{
                  lat: hotel.location.lat,
                  lng: hotel.location.lng + (0.008 / Math.pow(1.15, zoomLevelRef.current - 10))
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
        const isSelected = selectedItem && selectedItem.id === activity.id;
        const showLabel = isSelected; // Only show label when clicked/selected
        const activityColor = getMarkerColor({ type: activity.type });
        const activityTypeInfo = getActivityTypeColor(activity.type);
        return (
          <React.Fragment key={activity.id}>
            {/* Circle background */}
            <Marker
              position={activity.location}
              onClick={() => handleMarkerClick(activity)}
              onMouseOver={() => handleMarkerHover(activity)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FFFFFF',
                fillOpacity: 0.95,
                strokeColor: activityColor,
                strokeWeight: 3,
                scale: getMarkerScale(11),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 199 : 99}
            />
            {/* Emoji on top */}
            <Marker
              position={activity.location}
              onClick={() => handleMarkerClick(activity)}
              onMouseOver={() => handleMarkerHover(activity)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: 'M 0,0',
                scale: 0,
              }}
              label={{
                text: activityTypeInfo.emoji,
                fontSize: '22px',
                className: isSelected ? 'selected-marker' : '',
              }}
              zIndex={isSelected ? 200 : 100}
            />
            {showLabel && (
              <Marker
                position={{
                  lat: activity.location.lat,
                  lng: activity.location.lng + (0.008 / Math.pow(1.15, zoomLevelRef.current - 10))
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
        const isSelected = selectedItem && selectedItem.id === bookmark.id;
        const showLabel = isSelected; // Only show label when clicked/selected
        const bookmarkColor = '#FFA500'; // Orange/gold color for bookmarks
        const bookmarkTypeInfo = getActivityTypeColor(bookmark.type);
        return (
          <React.Fragment key={bookmark.id}>
            {/* Circle background */}
            <Marker
              position={bookmark.location}
              onClick={() => handleMarkerClick(bookmark)}
              onMouseOver={() => handleMarkerHover(bookmark)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#FFFFFF',
                fillOpacity: 0.95,
                strokeColor: bookmarkColor,
                strokeWeight: 3,
                scale: getMarkerScale(12),
                anchor: new google.maps.Point(0, 0),
              }}
              zIndex={isSelected ? 199 : 179}
            />
            {/* Emoji on top */}
            <Marker
              position={bookmark.location}
              onClick={() => handleMarkerClick(bookmark)}
              onMouseOver={() => handleMarkerHover(bookmark)}
              onMouseOut={handleMarkerUnhover}
              icon={{
                path: 'M 0,0',
                scale: 0,
              }}
              label={{
                text: bookmarkTypeInfo.emoji,
                fontSize: '24px',
                className: isSelected ? 'selected-marker' : '',
              }}
              zIndex={isSelected ? 200 : 180} // Higher than regular activities
            />
            {showLabel && (
              <Marker
                position={{
                  lat: bookmark.location.lat,
                  lng: bookmark.location.lng + (0.008 / Math.pow(1.15, zoomLevelRef.current - 10))
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

      {/* Info window - show on hover only (click opens DetailsPanel) */}
      {hoveredMarker && (() => {
        const markerToShow = hoveredMarker;
        if (!markerToShow) return null;

        // Position InfoWindow below marker to avoid being cut off at screen edges
        const infoWindowPosition = 'location' in markerToShow
          ? {
              lat: markerToShow.location.lat,
              lng: markerToShow.location.lng
            }
          : { lat: 0, lng: 0 };

        return (
          <InfoWindow
            position={infoWindowPosition}
            options={{
              pixelOffset: new google.maps.Size(0, 35), // Position BELOW marker (positive = down)
              disableAutoPan: true, // CRITICAL: Prevent map from moving when InfoWindow appears on hover
            }}
            onCloseClick={() => {
              setHoveredMarker(null);
              if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
              }
            }}
          >
            <div
              className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[320px]"
              onMouseEnter={handleInfoWindowMouseEnter}
              onMouseLeave={handleInfoWindowMouseLeave}
            >
              {/* Large image header */}
              {markerToShow.imageUrl && (
                <div className="relative w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={markerToShow.imageUrl}
                    alt={markerToShow.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-3">
                {/* Badges row with Location, Type, and Rating/Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  {/* Left side: Location and Type badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Location badge */}
                    {(() => {
                      const isActivity = 'type' in markerToShow;
                      const manualPlace = isActivity && 'place' in markerToShow ? (markerToShow as Activity).place : undefined;
                      const area = getPlaceInfo(markerToShow.location.lat, markerToShow.location.lng, manualPlace);
                      return (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-lg border"
                          style={{
                            backgroundColor: `${area.color}20`,
                            color: area.color,
                            borderColor: area.color
                          }}
                        >
                          <span className="text-sm mr-1">{area.emoji}</span>
                          <span>{area.name}</span>
                        </span>
                      );
                    })()}

                    {/* Type badge */}
                    {'type' in markerToShow ? (() => {
                      const typeInfo = getActivityTypeColor(markerToShow.type);
                      return (
                        <span
                          className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-lg capitalize border"
                          style={{
                            backgroundColor: `${typeInfo.color}15`,
                            color: typeInfo.color,
                            borderColor: typeInfo.color
                          }}
                        >
                          <span className="text-sm">{typeInfo.emoji}</span>
                          <span className="ml-1">{typeInfo.name}</span>
                        </span>
                      );
                    })() : (
                      <span
                        className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-lg capitalize border"
                        style={{
                          backgroundColor: `${ACTIVITY_COLORS.hotel.color}15`,
                          color: ACTIVITY_COLORS.hotel.color,
                          borderColor: ACTIVITY_COLORS.hotel.color
                        }}
                      >
                        <span className="text-sm">{ACTIVITY_COLORS.hotel.emoji}</span>
                        <span className="ml-1">Hotel</span>
                      </span>
                    )}
                  </div>

                  {/* Right side: Open/Closed Status and Rating */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Open/Closed Status */}
                    {'type' in markerToShow && 'openingHours' in markerToShow && markerToShow.openingHours && (
                      <OpeningHoursDisplay openingHours={markerToShow.openingHours} rating={markerToShow.rating} compact={true} inline={true} />
                    )}
                    {/* Rating for items without opening hours */}
                    {markerToShow.rating && !('openingHours' in markerToShow && markerToShow.openingHours) && (
                      <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        <span className="text-yellow-700 font-bold text-sm">{markerToShow.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                  {markerToShow.name}
                </h3>

                {/* Address */}
                {'address' in markerToShow && markerToShow.address && (
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                    <p className="text-xs text-gray-600 line-clamp-2 flex items-start gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span>{markerToShow.address}</span>
                    </p>
                  </div>
                )}

                {/* Click hint */}
                <p className="text-xs text-travel-teal font-medium text-center pt-2 border-t border-gray-200">
                  💡 Click marker for full details
                </p>
              </div>
            </div>
          </InfoWindow>
        );
      })()}
      </GoogleMap>

      {/* Color Legend */}
      <ColorLegend />
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
