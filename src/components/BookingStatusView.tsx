import { useState } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, DollarSign, CheckCircle, XCircle, MapPin, Moon } from 'lucide-react';
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

  // Extract location from day title
  const getLocation = (title: string): string => {
    const locations = ['Bangkok', 'Canggu', 'Sidemen', 'Ubud', 'Uluwatu', 'Gili Trawangan', 'Gili Air', 'Nusa Lembongan', 'Kuta', 'Komodo'];
    for (const loc of locations) {
      if (title.includes(loc)) return loc;
    }
    return '';
  };

  // Parse nights from description or calculate from data
  const extractNights = (description: string): number => {
    // Try to find pattern like "(2 nights)" or "(2n)"
    const match = description.match(/\((\d+)\s*n/i);
    return match ? parseInt(match[1]) : 1;
  };

  const daysWithBookingStatus = tripData.days
    .filter(day => !isTransitDay(day)) // Exclude transit days
    .map(day => {
      const accommodationExpenses = (day.expenses || []).filter(e => e.category === 'accommodation');
      const hasHotel = accommodationExpenses.length > 0;
      const totalPriceILS = accommodationExpenses.reduce((sum, e) => sum + convertToILS(e.amount, e.currency), 0);

      // Clean hotel name - remove parenthetical night counts and notes
      const rawName = accommodationExpenses[0]?.description || '';
      const hotelName = rawName
        .replace(/\s*\([^)]*\)/g, '') // Remove all parenthetical text
        .replace(/\s*-\s*.*$/, '') // Remove everything after dash (notes)
        .trim();

      const nights = accommodationExpenses.length > 0 ? extractNights(rawName) : 0;
      const location = getLocation(day.title);

      return {
        ...day,
        hasHotel,
        hotelName: hotelName || null,
        hotelPrice: totalPriceILS > 0 ? `₪${totalPriceILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Paid in cash',
        nights,
        location,
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

      {/* Days List - Card style with better visual hierarchy */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredDays.map(day => (
          <div
            key={day.day}
            className={`relative rounded-xl border-2 transition-all hover:shadow-md ${
              day.hasHotel
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300'
            }`}
          >
            <div className="p-4">
              {/* Header Row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    day.hasHotel ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {day.hasHotel ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <XCircle className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Day and Date */}
                  <div>
                    <div className="font-bold text-gray-900">Day {day.day}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                {/* Location Badge */}
                {day.location && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/80 rounded-lg border border-gray-200">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">{day.location}</span>
                  </div>
                )}
              </div>

              {/* Hotel Details */}
              {day.hasHotel ? (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <HotelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="font-semibold text-gray-900 text-sm truncate">
                          {day.hotelName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {day.nights > 0 && (
                          <div className="flex items-center gap-1">
                            <Moon className="w-3 h-3" />
                            <span>{day.nights} {day.nights === 1 ? 'night' : 'nights'}</span>
                          </div>
                        )}
                        {canManageUsers && day.hotelPrice && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="font-medium">{day.hotelPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                    <XCircle className="w-4 h-4" />
                    <span>No hotel booked for this night</span>
                  </div>
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
