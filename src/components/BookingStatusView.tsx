import { useState } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BookingStatusViewProps {
  tripData: TripData;
}

export default function BookingStatusView({ tripData }: BookingStatusViewProps) {
  const { canManageUsers } = useAuth();
  const [showOnlyUnbooked, setShowOnlyUnbooked] = useState(false);

  // Identify transit days (flights) - no hotel needed
  const isTransitDay = (day: any) => {
    const title = day.title.toLowerCase();
    return title.includes('departure') ||
           title.includes('arrival') ||
           title.includes('flight') ||
           (day.day === 1) || // May 4 - Departure
           (day.day === 29) || // June 1 - Departure flight
           (day.day === 30); // June 2 - Arrival home
  };

  // Currency conversion
  const EXCHANGE_RATES: Record<string, number> = {
    'ILS': 1, 'USD': 3.7, 'THB': 0.11, 'IDR': 0.00024,
  };
  const convertToILS = (amount: number, currency: string): number => {
    return amount * (EXCHANGE_RATES[currency] || 1);
  };

  const daysWithBookingStatus = tripData.days
    .filter(day => !isTransitDay(day)) // Exclude transit days
    .map(day => {
      const accommodationExpenses = (day.expenses || []).filter(e => e.category === 'accommodation');
      const hasHotel = accommodationExpenses.length > 0;
      const totalPriceILS = accommodationExpenses.reduce((sum, e) => sum + convertToILS(e.amount, e.currency), 0);

      // Clean hotel name - remove parenthetical night counts
      const rawName = accommodationExpenses[0]?.description || '';
      const hotelName = rawName.replace(/\s*\([^)]*night[^)]*\)/gi, '').trim();

      return {
        ...day,
        hasHotel,
        hotelName: hotelName || null,
        hotelPrice: totalPriceILS > 0 ? `₪${totalPriceILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Paid in cash',
        checkIn: null,
        checkOut: null,
      };
    });

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
            {totalBookedDays} of {totalDays} nights with hotel booked
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            (Excludes transit days: May 4, June 1-2)
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
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {filteredDays.map(day => (
          <div
            key={day.day}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
              day.hasHotel
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-300'
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {day.hasHotel ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-orange-600" />
              )}
            </div>

            {/* Day Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  Day {day.day}
                </span>
                <span className="text-xs text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </span>
              </div>

              {day.hasHotel ? (
                <div className="text-sm mt-0.5">
                  <div className="font-medium text-gray-900 truncate">
                    {day.hotelName}
                  </div>
                  {canManageUsers && day.hotelPrice && (
                    <div className="text-xs text-gray-600 mt-0.5">
                      {day.hotelPrice}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-orange-700 font-medium mt-0.5">
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
