import { useState } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, DollarSign, MapPin, Moon, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BookingStatusViewProps {
  tripData: TripData;
}

export default function BookingStatusView({ tripData }: BookingStatusViewProps) {
  const { canManageUsers } = useAuth();
  const [showOnlyUnbooked, setShowOnlyUnbooked] = useState(false);

  // Places with emojis
  const PLACES = [
    { name: 'Bangkok', emoji: '🇹🇭', color: 'from-red-500 to-rose-600' },
    { name: 'Canggu', emoji: '🏖️', color: 'from-cyan-500 to-blue-500' },
    { name: 'Sidemen', emoji: '🌾', color: 'from-lime-500 to-green-500' },
    { name: 'Ubud', emoji: '🌿', color: 'from-emerald-500 to-teal-600' },
    { name: 'Uluwatu', emoji: '🌅', color: 'from-orange-500 to-red-500' },
    { name: 'Gili Trawangan', emoji: '🏝️', color: 'from-blue-500 to-indigo-500' },
    { name: 'Gili Air', emoji: '🌊', color: 'from-sky-400 to-blue-400' },
    { name: 'Nusa Lembongan', emoji: '⛰️', color: 'from-indigo-500 to-purple-600' },
    { name: 'Kuta', emoji: '🏄', color: 'from-fuchsia-500 to-pink-600' },
    { name: 'Komodo', emoji: '🐉', color: 'from-teal-500 to-cyan-600' },
  ];

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

  // Get location info
  const getLocation = (title: string) => {
    for (const place of PLACES) {
      if (title.includes(place.name)) return place;
    }
    return null;
  };

  // Format date nicely
  const formatDate = (dateStr: string, format: 'short' | 'long' = 'short') => {
    const date = new Date(dateStr);
    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Process all days with accommodation
  const eligibleDays = tripData.days.filter(day => !isTransitDay(day));

  const daysWithStatus = eligibleDays.map(day => {
    const accommodationExpenses = (day.expenses || []).filter(e => e.category === 'accommodation');
    const hasHotel = accommodationExpenses.length > 0;
    const totalPriceILS = accommodationExpenses.reduce((sum, e) => sum + convertToILS(e.amount, e.currency), 0);
    const locationInfo = getLocation(day.title);

    // Get all hotel names for this day
    const hotelNames = accommodationExpenses.map(e => {
      const name = e.description
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();
      return name;
    });

    return {
      ...day,
      hasHotel,
      hotelNames: [...new Set(hotelNames)], // Unique names
      totalPriceILS,
      locationInfo,
      accommodationCount: accommodationExpenses.length
    };
  });

  const bookedDays = daysWithStatus.filter(d => d.hasHotel);
  const unbookedDays = daysWithStatus.filter(d => !d.hasHotel);

  const totalNights = eligibleDays.length;
  const bookedNights = bookedDays.length;
  const progress = totalNights > 0 ? (bookedNights / totalNights) * 100 : 0;

  const displayDays = showOnlyUnbooked ? unbookedDays : daysWithStatus;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl border-2 border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <HotelIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Hotel Bookings</h3>
              <p className="text-blue-100 text-sm mt-0.5">
                {bookedNights} of {totalNights} nights • {bookedDays.reduce((sum, d) => sum + d.accommodationCount, 0)} bookings
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white cursor-pointer hover:bg-white/20 transition-colors">
            <input
              type="checkbox"
              checked={showOnlyUnbooked}
              onChange={(e) => setShowOnlyUnbooked(e.target.checked)}
              className="rounded border-white/30 text-blue-600"
            />
            Unbooked only
          </label>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-semibold text-white mb-1.5">
            <span>Booking Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 shadow-lg"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Days List */}
      <div className="p-6">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {displayDays.map(day => (
            <div
              key={day.day}
              className={`relative rounded-xl border-2 transition-all ${
                day.hasHotel
                  ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg'
                  : 'bg-orange-50 border-orange-300 hover:shadow-md'
              }`}
            >
              {/* Location gradient border */}
              {day.locationInfo && day.hasHotel && (
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${day.locationInfo.color} rounded-t-xl`}></div>
              )}

              <div className="p-4 pt-5">
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Day Number Badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      day.hasHotel
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                        : 'bg-orange-500 text-white shadow-md'
                    }`}>
                      {day.day}
                    </div>

                    {/* Date */}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDate(day.date, 'long')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>Night {day.day}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Badge */}
                  {day.locationInfo && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${day.locationInfo.color} bg-opacity-10`}>
                      <span className="text-lg">{day.locationInfo.emoji}</span>
                      <span className="text-xs font-bold text-gray-700">{day.locationInfo.name}</span>
                    </div>
                  )}
                </div>

                {/* Hotel Details */}
                {day.hasHotel ? (
                  <div className="mt-3 pt-3 border-t-2 border-gray-100">
                    {day.hotelNames.map((hotelName, idx) => (
                      <div key={idx} className={idx > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <HotelIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm">
                                {hotelName}
                              </div>
                            </div>
                          </div>

                          {canManageUsers && day.totalPriceILS > 0 && (
                            <div className="flex items-baseline gap-1 flex-shrink-0">
                              <span className="text-lg font-bold text-indigo-600">
                                ₪{day.totalPriceILS.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          )}
                          {canManageUsers && day.totalPriceILS === 0 && (
                            <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium flex-shrink-0">
                              Cash
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t-2 border-orange-200">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">No accommodation booked</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {unbookedDays.length > 0 && !showOnlyUnbooked && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-300 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-orange-900 text-lg">
                  {unbookedDays.length} {unbookedDays.length === 1 ? 'night' : 'nights'} unbooked
                </p>
                <p className="text-sm text-orange-800 mt-1">
                  Complete your trip by booking accommodation for the remaining nights
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
