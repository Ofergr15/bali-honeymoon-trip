import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { Activity, Hotel } from '../types/trip';
import { PLACE_LOCATIONS, findNearestPlace } from '../utils/locations';
import { parseBookingUrl, calculateNights, formatPrice } from '../utils/bookingParser';

interface EditPlaceFormProps {
  item: Activity | Hotel;
  onUpdate: (item: Activity | Hotel) => void;
  onClose: () => void;
  tripDays: number; // Total number of days in the trip
}

const isActivity = (item: Activity | Hotel): item is Activity => {
  return 'type' in item;
};

export default function EditPlaceForm({ item, onUpdate, onClose, tripDays }: EditPlaceFormProps) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(
    isActivity(item) ? (item.description || '') : (item.description || '')
  );
  const [rating, setRating] = useState(item.rating?.toString() || '');
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');

  // Place/Location - use manual if set, otherwise detect from GPS
  const detectedPlace = findNearestPlace(item.location.lat, item.location.lng);
  const [place, setPlace] = useState<string>(
    isActivity(item) && item.place
      ? item.place
      : detectedPlace?.name || 'auto'
  );

  // Activity-specific fields
  const [day, setDay] = useState(isActivity(item) ? (item.day?.toString() || '0') : '1');
  const [time, setTime] = useState(isActivity(item) ? (item.time || '') : '');
  const [activityType, setActivityType] = useState<Activity['type']>(
    isActivity(item) ? item.type : 'restaurant'
  );

  // Hotel-specific fields (can be in Activity if type='hotel', or in separate Hotel object)
  const [price, setPrice] = useState(
    isActivity(item)
      ? (item.price || '')
      : (item.price || '')
  );
  const [pricePerNight, setPricePerNight] = useState(
    isActivity(item)
      ? (item.pricePerNight?.toString() || '')
      : ''
  );
  const [checkIn, setCheckIn] = useState(
    isActivity(item)
      ? (item.checkIn || '')
      : (item.checkIn || '')
  );
  const [checkOut, setCheckOut] = useState(
    isActivity(item)
      ? (item.checkOut || '')
      : (item.checkOut || '')
  );
  const [bookingUrl, setBookingUrl] = useState(
    isActivity(item)
      ? (item.bookingUrl || '')
      : (item.bookingUrl || '')
  );

  // Auto-extract dates from Booking.com URL
  useEffect(() => {
    if (isActivity(item) && activityType === 'hotel' && bookingUrl) {
      const dates = parseBookingUrl(bookingUrl);
      if (dates.checkIn && !checkIn) {
        setCheckIn(dates.checkIn);
      }
      if (dates.checkOut && !checkOut) {
        setCheckOut(dates.checkOut);
      }
    }
  }, [bookingUrl, activityType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert('Please provide a name');
      return;
    }

    if (isActivity(item)) {
      const dayNum = parseInt(day);
      const updatedActivity: Activity = {
        ...item,
        name,
        day: dayNum === 0 ? undefined : dayNum, // undefined = bookmark
        type: activityType,
        time: time || undefined,
        description: description || undefined,
        rating: rating ? parseFloat(rating) : undefined,
        imageUrl: imageUrl || undefined,
        price: activityType !== 'hotel' ? (price || undefined) : undefined,
        place: place === 'auto' ? undefined : place, // Store manual selection, undefined = auto-detect
        // Hotel-specific fields (only set if type is 'hotel')
        pricePerNight: activityType === 'hotel' && pricePerNight ? parseFloat(pricePerNight) : undefined,
        checkIn: activityType === 'hotel' ? (checkIn || undefined) : undefined,
        checkOut: activityType === 'hotel' ? (checkOut || undefined) : undefined,
        bookingUrl: activityType === 'hotel' ? (bookingUrl || undefined) : undefined,
      };
      onUpdate(updatedActivity);
    } else {
      // Old Hotel object (for backwards compatibility)
      if (!checkIn || !checkOut) {
        alert('Please provide check-in and check-out dates');
        return;
      }

      const updatedHotel: Hotel = {
        ...item,
        name,
        description: description || undefined,
        rating: rating ? parseFloat(rating) : undefined,
        imageUrl: imageUrl || undefined,
        price: price || undefined,
        checkIn,
        checkOut,
        bookingUrl: bookingUrl || undefined,
      };
      onUpdate(updatedHotel);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-premium-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit {isActivity(item) ? 'Activity' : 'Hotel'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* Activity Type (only for activities) */}
          {isActivity(item) && (
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
          )}

          {/* Place/Location Selector */}
          {isActivity(item) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              >
                <option value="auto">🤖 Auto-detect ({detectedPlace?.emoji} {detectedPlace?.name || 'Bali'})</option>
                {Object.entries(PLACE_LOCATIONS).map(([placeName, placeInfo]) => (
                  <option key={placeName} value={placeName}>
                    {placeInfo.emoji} {placeName}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                💡 AI auto-detects location. Select manually if incorrect.
              </div>
            </div>
          )}

          {/* Day (only for non-hotel activities) */}
          {isActivity(item) && activityType !== 'hotel' && (
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
                {Array.from({ length: tripDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                💡 Select "No day" to save as a bookmark without scheduling
              </div>
            </div>
          )}

          {/* Time (only for non-hotel activities) */}
          {isActivity(item) && activityType !== 'hotel' && (
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

          {/* Booking URL (hotels only) */}
          {((!isActivity(item)) || activityType === 'hotel') && (
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
            </div>
          )}

          {/* Check-in/Check-out dates (hotels only) */}
          {((!isActivity(item)) || activityType === 'hotel') && (
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in (optional)
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min="2026-05-06"
                    max="2026-05-30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out (optional)
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min="2026-05-06"
                    max="2026-05-30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                💡 Leave empty if you're just browsing potential hotels
              </div>
            </div>
          )}

          {/* Price per night (hotels only) */}
          {((!isActivity(item)) || activityType === 'hotel') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Night (USD)
              </label>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={pricePerNight}
                      onChange={(e) => setPricePerNight(e.target.value)}
                      placeholder="150"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
                    />
                  </div>
                </div>
                {pricePerNight && checkIn && checkOut && (
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-700 mb-1">💰 Total Cost</div>
                    <div className="text-lg font-bold text-blue-900">
                      ${formatPrice(parseFloat(pricePerNight) * calculateNights(checkIn, checkOut))}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      ${pricePerNight}/night × {calculateNights(checkIn, checkOut)} nights
                    </div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                💵 Copy from Booking.com listing
              </div>
            </div>
          )}

          {/* Price (OLD hotels table - backwards compatibility) */}
          {!isActivity(item) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Price from Booking.com
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., $1,250 total or 3,500,000 IDR/night"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              />
            </div>
          )}

          {/* Booking URL (hotels only) */}
          {!isActivity(item) && (
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
          </div>

          {/* Photo URL */}
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
            {imageUrl && (
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-premium-sm"
            >
              <Save className="w-5 h-5" />
              Save Changes
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
