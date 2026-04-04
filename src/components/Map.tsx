import { GoogleMap, useLoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import React, { useState, useMemo, useEffect } from 'react';
import type { Activity, Hotel, DayItinerary } from '../types/trip';
import { getMarkerColor, ACTIVITY_COLORS, getActivityTypeColor, getAreaFromCoordinates } from '../utils/colors';
import ColorLegend from './ColorLegend';
import MapDebugPanel from './MapDebugPanel';

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
  // Track render count to see how often component re-renders
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;

  const [selectedMarker, setSelectedMarker] = useState<Activity | Hotel | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<Activity | Hotel | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoomLevel, setZoomLevel] = useState(10);
  const hoverTimeoutRef = React.useRef<number | null>(null);
  const isUserInteractingRef = React.useRef(false);
  const lastAnimatedIdRef = React.useRef<string | null>(null);

  // Log EVERY render with all state values to track what's changing
  console.log(`🔄 ========== RENDER #${renderCountRef.current} ==========`);
  console.log('   State snapshot:');
  console.log('   - zoomLevel:', zoomLevel);
  console.log('   - selectedMarker:', selectedMarker?.name || 'null');
  console.log('   - hoveredMarker:', hoveredMarker?.name || 'null');
  console.log('   - selectedItem:', selectedItem?.name || 'null');
  console.log('   - map instance:', map ? 'exists' : 'null');
  console.log('   - selectedDay:', selectedDay);
  console.log('   - isUserInteracting:', isUserInteractingRef.current);
  console.log('========================================');

  // Debug state
  const [debugState, setDebugState] = useState({
    isUserInteracting: false,
    lastAnimatedId: null as string | null,
    mapCenter: null as { lat: number; lng: number } | null,
    mapZoom: null as number | null,
    lastAnimationAttempt: null as {
      source: string;
      timestamp: number;
      blocked: boolean;
    } | null,
  });

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
    restriction: {
      latLngBounds: {
        north: -8.0,
        south: -9.0,
        west: 114.5,
        east: 116.5,
      },
      strictBounds: false,
    },
  }), []); // Never changes - same object every render!

  // Listen to zoom changes for auto-scaling markers and prevent rotation/tilt
  useEffect(() => {
    if (map) {
      const zoomListener = map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom) {
          console.log('🔍 ZOOM_CHANGED:', currentZoom.toFixed(2), '→ calling setZoomLevel (TRIGGERS RE-RENDER)');
          setZoomLevel(currentZoom);
        }
      });

      // Prevent rotation/tilt only when it actually changes
      const tiltListener = map.addListener('tilt_changed', () => {
        const currentTilt = map.getTilt();
        if (currentTilt !== 0) {
          console.log('🔄 TILT_CHANGED:', currentTilt, '→ forcing back to 0 (MAY CAUSE CENTER_CHANGED)');
          map.setTilt(0);
        }
      });

      const headingListener = map.addListener('heading_changed', () => {
        const currentHeading = map.getHeading();
        if (currentHeading !== 0) {
          console.log('🧭 HEADING_CHANGED:', currentHeading, '→ forcing back to 0 (MAY CAUSE CENTER_CHANGED)');
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

  // Atomic camera movement - SINGLE OPERATION (prevents dual-action conflict)
  const animateToLocation = React.useCallback((targetLat: number, targetLng: number, targetZoom: number, source: string = 'unknown') => {
    if (!map) {
      console.log('❌ No map instance');
      return;
    }

    // Disable debug state updates to prevent re-renders during pan!
    const currentCenter = map.getCenter();

    console.log('🎥 Animation triggered from:', source);
    console.log('   Current:', currentCenter ? `${currentCenter.lat().toFixed(4)}, ${currentCenter.lng().toFixed(4)}` : 'unknown');
    console.log('   Target:', `${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}, zoom: ${targetZoom}`);

    // Use simple panTo + setZoom for reliability
    console.log('📍 Animating with panTo + setZoom...');
    map.panTo({ lat: targetLat, lng: targetLng });
    map.setZoom(targetZoom);
    console.log('✅ Animation commands sent');
  }, [map]);

  // ONLY animate when a marker is explicitly selected from sidebar
  // This prevents the "reactive loop trap" where state changes trigger unwanted animations
  useEffect(() => {
    if (!map || !selectedItem || !('location' in selectedItem) || !selectedItem.location) {
      lastAnimatedIdRef.current = null;
      setDebugState(prev => ({ ...prev, lastAnimatedId: null }));
      return;
    }

    // Deduplication: Don't re-animate to the same item
    if (lastAnimatedIdRef.current === selectedItem.id) {
      console.log('⏭️ Already animated to:', selectedItem.name);
      return;
    }

    console.log('🎯 Explicit selection:', selectedItem.name);
    lastAnimatedIdRef.current = selectedItem.id;
    setDebugState(prev => ({ ...prev, lastAnimatedId: selectedItem.id }));
    animateToLocation(selectedItem.location.lat, selectedItem.location.lng, 17, 'selectedItem-useEffect');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedItem]); // animateToLocation is stable (useCallback), don't need it as dependency

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
    console.log('🖱️ MARKER CLICKED:', item.name, '→ calling setSelectedMarker (TRIGGERS RE-RENDER)');
    setSelectedMarker(item);
    onMarkerClick?.(item);
  };

  // Handle hover with delay to prevent flickering
  const handleMarkerHover = (item: Activity | Hotel | any) => {
    console.log('🎯 Hover state change:', item.name);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredMarker(item);
  };

  const handleMarkerUnhover = () => {
    console.log('🎯 Unhover - clearing after delay');
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('🎯 Hover cleared');
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
        onLoad={(mapInstance) => {
          setMap(mapInstance);

          // Set initial position - ONLY ONCE on load!
          mapInstance.setCenter(defaultCenter);
          mapInstance.setZoom(10);

          // Force flat 2D map
          mapInstance.setTilt(0);
          mapInstance.setHeading(0);
          mapInstance.setMapTypeId('hybrid');

          console.log('✅ Map loaded - initial position set, now uncontrolled');

          // === COMPREHENSIVE DRAG LOGGING ===
          // Track every drag movement to see snap-back in real-time

          mapInstance.addListener('dragstart', () => {
            const center = mapInstance.getCenter();
            console.log('🖱️ DRAGSTART - User started dragging');
            console.log('   Start position:', center ? `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}` : 'unknown');
            isUserInteractingRef.current = true;
          });

          mapInstance.addListener('drag', () => {
            const center = mapInstance.getCenter();
            if (center) {
              console.log('👋 DRAG - Position:', `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}`);
            }
          });

          mapInstance.addListener('dragend', () => {
            const center = mapInstance.getCenter();
            console.log('🛑 DRAGEND - User stopped dragging');
            console.log('   End position:', center ? `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}` : 'unknown');
            isUserInteractingRef.current = false;
          });

          // Track center changes (this fires when map center changes for ANY reason)
          let centerChangeCount = 0;
          mapInstance.addListener('center_changed', () => {
            centerChangeCount++;
            const center = mapInstance.getCenter();
            if (center) {
              console.log(`📍 CENTER_CHANGED #${centerChangeCount}:`, `${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}`);

              // Show stack trace for center changes that happen AFTER dragend
              if (!isUserInteractingRef.current) {
                console.log('   ⚠️ CENTER CHANGED WHILE NOT DRAGGING!');
                console.trace('   Stack trace:');
              }
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
            let verticalOffset = 0.025 / Math.pow(1.15, zoomLevel - 10);

            // Check if this location is being hovered (hide label if InfoWindow is showing)
            const isHovered = hoveredMarker && 'isLocationMarker' in hoveredMarker && hoveredMarker.name === location.name;

            return (
              <React.Fragment key={`location-${location.name}`}>
                {/* Circle marker */}
                <Marker
                  position={{ lat: location.lat, lng: location.lng }}
                  onClick={() => {
                    // Event-driven animation - explicit user click
                    console.log('🏝️ Clicked location chip:', location.name);
                    animateToLocation(location.lat, location.lng, 15, `location-chip-${location.name}`);
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

      {/* Debug Panel */}
      <MapDebugPanel
        isUserInteracting={debugState.isUserInteracting}
        lastAnimatedId={debugState.lastAnimatedId}
        mapCenter={debugState.mapCenter}
        mapZoom={debugState.mapZoom}
        lastAnimationAttempt={debugState.lastAnimationAttempt}
      />
    </div>
  );
}
