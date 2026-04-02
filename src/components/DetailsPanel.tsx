import { useState } from 'react';
import type { Activity, Hotel } from '../types/trip';
import { X, Phone, Star, Clock, DollarSign, ExternalLink, Trash2, Copy, Check, Edit } from 'lucide-react';
import { getAreaFromCoordinates, getActivityTypeColor } from '../utils/colors';
import OpeningHoursDisplay from './OpeningHoursDisplay';

interface DetailsPanelProps {
  item: Activity | Hotel | null;
  onClose: () => void;
  onDelete?: (item: Activity | Hotel) => void;
  onEdit?: (item: Activity | Hotel) => void;
}

const isActivity = (item: Activity | Hotel): item is Activity => {
  return 'type' in item;
};

export default function DetailsPanel({ item, onClose, onDelete, onEdit }: DetailsPanelProps) {
  const [addressCopied, setAddressCopied] = useState(false);
  const [fetchedAddress, setFetchedAddress] = useState<string | null>(null);
  const [fetchedOpeningHours, setFetchedOpeningHours] = useState<any>(null);
  const [loadingOpeningHours, setLoadingOpeningHours] = useState(false);

  if (!item) return null;

  // Safe access to location
  if (!item.location || typeof item.location.lat !== 'number' || typeof item.location.lng !== 'number') {
    console.error('Invalid item location:', item);
    return null;
  }

  const area = getAreaFromCoordinates(item.location);

  // Fetch address if not available
  const hasAddress = 'address' in item && item.address;
  if (!hasAddress && !fetchedAddress) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${item.location.lat},${item.location.lng}&key=${apiKey}`;
      fetch(geocodeUrl)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            setFetchedAddress(data.results[0].formatted_address);
          }
        })
        .catch(err => console.error('Failed to fetch address:', err));
    }
  }

  // Fetch opening hours if not available (only for activities)
  const hasOpeningHours = isActivity(item) && item.openingHours;
  if (isActivity(item) && !hasOpeningHours && !fetchedOpeningHours && !loadingOpeningHours && typeof google !== 'undefined' && google.maps && google.maps.places) {
    setLoadingOpeningHours(true);

    // Use Nearby Search to find the place
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.nearbySearch(
      {
        location: new google.maps.LatLng(item.location.lat, item.location.lng),
        radius: 50,
        keyword: item.name
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          const placeId = results[0].place_id;
          if (placeId) {
            // Get place details with opening hours
            service.getDetails(
              {
                placeId: placeId,
                fields: ['opening_hours']
              },
              (place, detailsStatus) => {
                if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && place && place.opening_hours) {
                  const openingHours: any = {};

                  // Check if 24 hours
                  if (place.opening_hours.periods && place.opening_hours.periods.length === 1) {
                    const period = place.opening_hours.periods[0];
                    if (period.open && !period.close) {
                      openingHours.is24Hours = true;
                    }
                  }

                  // Get weekday text
                  if (place.opening_hours.weekday_text) {
                    openingHours.weekdayText = place.opening_hours.weekday_text;
                  }

                  // Get periods
                  if (place.opening_hours.periods) {
                    openingHours.periods = place.opening_hours.periods.map((period: any) => ({
                      day: period.open?.day,
                      open: period.open ? `${String(period.open.hours).padStart(2, '0')}:${String(period.open.minutes).padStart(2, '0')}` : undefined,
                      close: period.close ? `${String(period.close.hours).padStart(2, '0')}:${String(period.close.minutes).padStart(2, '0')}` : undefined,
                    }));
                  }

                  setFetchedOpeningHours(openingHours);
                }
                setLoadingOpeningHours(false);
              }
            );
          } else {
            setLoadingOpeningHours(false);
          }
        } else {
          setLoadingOpeningHours(false);
        }
      }
    );
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      if (onDelete) {
        onDelete(item);
      }
      onClose();
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
    }
  };

  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent opening the link

    let addressText = ('address' in item && item.address) || fetchedAddress || '';

    // If no address saved or fetched, fetch it now using Google Geocoding API
    if (!addressText) {
      console.log('No address saved, fetching from Google Geocoding...');
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${item.location.lat},${item.location.lng}&key=${apiKey}`;
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.status === 'OK' && data.results && data.results.length > 0) {
            addressText = data.results[0].formatted_address;
            setFetchedAddress(addressText);
            console.log('✅ Fetched address:', addressText);
          }
        }
      } catch (err) {
        console.error('Failed to fetch address:', err);
      }
    }

    // Fallback to coordinates if still no address
    if (!addressText) {
      addressText = `${item.location.lat.toFixed(6)}, ${item.location.lng.toFixed(6)}`;
    }

    try {
      await navigator.clipboard.writeText(addressText);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
      // Fallback
      const tempInput = document.createElement('input');
      tempInput.value = addressText;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 animate-slide-up w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Image Header */}
      {item.imageUrl && (
        <div className="relative w-full h-32 bg-gray-100 flex-shrink-0 rounded-t-2xl overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-2 right-2 flex gap-2">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all shadow-lg"
                aria-label="Edit"
              >
                <Edit className="w-3.5 h-3.5 text-white" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-lg"
              aria-label="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white hover:bg-gray-50 rounded-lg transition-all shadow-lg"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-gray-900" />
            </button>
          </div>
        </div>
      )}

      <div className="p-3 overflow-y-auto flex-1 rounded-b-2xl">
        <div className="relative">
          {/* Buttons for items without image */}
          {!item.imageUrl && (
            <div className="absolute -top-1 right-0 flex gap-2 z-10">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all border border-blue-200"
                  aria-label="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all border border-red-200"
                aria-label="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all border border-gray-300"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          )}

          {/* Badges row with Status and Rating on the RIGHT */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Left side: Location and Type badges */}
            <div className="flex flex-wrap items-center gap-1.5">
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

              {isActivity(item) && (() => {
                const typeInfo = getActivityTypeColor(item.type);
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
              })()}
              {!isActivity(item) && (
                <span
                  className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-lg capitalize border"
                  style={{
                    backgroundColor: `${getActivityTypeColor('hotel').color}15`,
                    color: getActivityTypeColor('hotel').color,
                    borderColor: getActivityTypeColor('hotel').color
                  }}
                >
                  <span className="text-sm">🏨</span>
                  <span className="ml-1">Hotel</span>
                </span>
              )}
            </div>

            {/* Right side: Open/Closed Status and Rating */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Open/Closed Status */}
              {isActivity(item) && (item.openingHours || fetchedOpeningHours) && (
                <OpeningHoursDisplay openingHours={item.openingHours || fetchedOpeningHours} rating={item.rating} compact={true} inline={true} />
              )}
              {isActivity(item) && loadingOpeningHours && (
                <div className="bg-gray-50 rounded p-1 border border-gray-200 animate-pulse">
                  <div className="w-16 h-3 bg-gray-300 rounded"></div>
                </div>
              )}
              {/* Rating for Hotels or Activities without opening hours */}
              {((!isActivity(item) && item.rating) || (isActivity(item) && item.rating && !item.openingHours && !fetchedOpeningHours && !loadingOpeningHours)) && (
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-400 px-2 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-yellow-700 font-bold text-sm">{item.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
            {item.name}
          </h3>

          {/* Address Section with Links */}
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
            <p className="text-xs text-gray-600 mb-1.5 break-words">
              {('address' in item && item.address) || fetchedAddress || item.description || `${item.location.lat.toFixed(6)}, ${item.location.lng.toFixed(6)}`}
            </p>
            <div className="flex items-center gap-2">
              <a
                href={item.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${item.location.lat},${item.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-travel-teal hover:underline inline-flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                Link to the page
              </a>
              <button
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-gray-100 rounded border border-gray-300 transition-colors text-xs text-gray-700 font-medium"
              >
                {addressCopied ? (
                  <>
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-1.5">
            {isActivity(item) && item.time && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs">
                  {item.time}
                  {item.duration && ` • ${item.duration}`}
                </span>
              </div>
            )}

            {isActivity(item) && item.price && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <DollarSign className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs font-medium">{item.price}</span>
              </div>
            )}

            {'phone' in item && item.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
                <span className="text-xs">{item.phone}</span>
              </div>
            )}

            {!isActivity(item) && (
              <>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <div className="mb-1.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Check-in</p>
                    <p className="text-xs font-semibold text-gray-900">{new Date(item.checkIn).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Check-out</p>
                    <p className="text-xs font-semibold text-gray-900">{new Date(item.checkOut).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                  </div>
                </div>

                {item.price && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                    <DollarSign className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-medium">{item.price}</span>
                  </div>
                )}

                {item.bookingUrl && (
                  <a
                    href={item.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-travel-teal text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#0c8c8c] transition-colors"
                  >
                    <span>Booking.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
