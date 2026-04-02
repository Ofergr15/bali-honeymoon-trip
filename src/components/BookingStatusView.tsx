import { useState } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface BookingStatusViewProps {
  tripData: TripData;
}

export default function BookingStatusView({ tripData }: BookingStatusViewProps) {
  const [showOnlyUnbooked, setShowOnlyUnbooked] = useState(false);

  const daysWithBookingStatus = tripData.days.map(day => ({
    ...day,
    hasHotel: !!day.hotel,
    hotelName: day.hotel?.name || null,
    hotelPrice: day.hotel?.price || null,
    checkIn: day.hotel?.checkIn || null,
    checkOut: day.hotel?.checkOut || null,
  }));

  const filteredDays = showOnlyUnbooked
    ? daysWithBookingStatus.filter(d => !d.hasHotel)
    : daysWithBookingStatus;

  const totalBookedDays = daysWithBookingStatus.filter(d => d.hasHotel).length;
  const totalDays = daysWithBookingStatus.length;
  const unbookedDays = totalDays - totalBookedDays;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <HotelIcon className="w-5 h-5" />
            Hotel Booking Status
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {totalBookedDays} of {totalDays} days with hotel booked
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyUnbooked}
            onChange={(e) => setShowOnlyUnbooked(e.target.checked)}
            className="rounded border-gray-300 text-travel-teal focus:ring-travel-teal"
          />
          Show only unbooked
        </label>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(totalBookedDays / totalDays) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{totalBookedDays} booked</span>
          {unbookedDays > 0 && <span className="text-orange-600 font-medium">{unbookedDays} unbooked</span>}
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredDays.map(day => (
          <div
            key={day.day}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              day.hasHotel
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {day.hasHotel ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-orange-600" />
              )}
            </div>

            {/* Day Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </span>
              </div>

              {day.hasHotel ? (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {day.hotelName}
                  </div>
                  {day.hotelPrice && (
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{day.hotelPrice}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-orange-700 font-medium">
                  ⚠️ No hotel booked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {unbookedDays > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>⚠️ Action needed:</strong> {unbookedDays} {unbookedDays === 1 ? 'day' : 'days'} without hotel booking.
            Add hotels in the trip planner.
          </p>
        </div>
      )}
    </div>
  );
}
