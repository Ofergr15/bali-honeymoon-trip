import { useState, useMemo } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, DollarSign, CheckCircle, XCircle, MapPin, Moon, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BookingStatusViewProps {
  tripData: TripData;
}

interface HotelBooking {
  hotelName: string;
  location: string;
  locationEmoji: string;
  locationColor: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  startDay: number;
  endDay: number;
  days: number[];
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

  // Places with emojis
  const PLACES = [
    { name: 'Bangkok', emoji: '🇹🇭', color: 'bg-red-500' },
    { name: 'Canggu', emoji: '🏖️', color: 'bg-cyan-500' },
    { name: 'Sidemen', emoji: '🌾', color: 'bg-lime-500' },
    { name: 'Ubud', emoji: '🌿', color: 'bg-emerald-500' },
    { name: 'Uluwatu', emoji: '🌅', color: 'bg-orange-500' },
    { name: 'Gili Trawangan', emoji: '🏝️', color: 'bg-blue-500' },
    { name: 'Gili Air', emoji: '🌊', color: 'bg-sky-400' },
    { name: 'Nusa Lembongan', emoji: '⛰️', color: 'bg-indigo-500' },
    { name: 'Kuta', emoji: '🏄', color: 'bg-fuchsia-500' },
    { name: 'Komodo', emoji: '🐉', color: 'bg-teal-500' },
  ];

  // Extract location from day title
  const getLocation = (title: string) => {
    for (const place of PLACES) {
      if (title.includes(place.name)) return place;
    }
    return null;
  };

  // Group consecutive days with same hotel into bookings
  const hotelBookings = useMemo(() => {
    const bookings: HotelBooking[] = [];
    const processedDays = new Set<number>();

    const eligibleDays = tripData.days.filter(day => !isTransitDay(day));

    eligibleDays.forEach((day, idx) => {
      if (processedDays.has(day.day)) return;

      const accommodationExpenses = (day.expenses || []).filter(e => e.category === 'accommodation');
      if (accommodationExpenses.length === 0) return;

      const rawName = accommodationExpenses[0].description;
      const hotelName = rawName
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();

      const locationInfo = getLocation(day.title);
      const totalPrice = accommodationExpenses.reduce((sum, e) => sum + convertToILS(e.amount, e.currency), 0);

      // Find consecutive days with same hotel
      const consecutiveDays = [day.day];
      processedDays.add(day.day);

      for (let i = idx + 1; i < eligibleDays.length; i++) {
        const nextDay = eligibleDays[i];
        if (nextDay.day !== consecutiveDays[consecutiveDays.length - 1] + 1) break;

        const nextAccommodation = (nextDay.expenses || []).filter(e => e.category === 'accommodation');
        if (nextAccommodation.length === 0) break;

        const nextHotelName = nextAccommodation[0].description
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*-\s*.*$/, '')
          .trim();

        if (nextHotelName !== hotelName) break;

        consecutiveDays.push(nextDay.day);
        processedDays.add(nextDay.day);
      }

      const firstDay = eligibleDays.find(d => d.day === consecutiveDays[0]);
      const lastDay = eligibleDays.find(d => d.day === consecutiveDays[consecutiveDays.length - 1]);

      if (firstDay && lastDay) {
        // Calculate check-out date (day after last night)
        const checkOutDate = new Date(lastDay.date);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        const checkOutStr = checkOutDate.toISOString().split('T')[0];

        bookings.push({
          hotelName,
          location: locationInfo?.name || '',
          locationEmoji: locationInfo?.emoji || '',
          locationColor: locationInfo?.color || 'bg-gray-400',
          checkIn: firstDay.date,
          checkOut: checkOutStr,
          nights: consecutiveDays.length,
          totalPrice,
          startDay: consecutiveDays[0],
          endDay: consecutiveDays[consecutiveDays.length - 1],
          days: consecutiveDays,
        });
      }
    });

    return bookings;
  }, [tripData]);

  // Find unbooked nights
  const unbookedNights = useMemo(() => {
    const eligibleDays = tripData.days.filter(day => !isTransitDay(day));
    const bookedDayNumbers = new Set(hotelBookings.flatMap(b => b.days));
    return eligibleDays.filter(day => !bookedDayNumbers.has(day.day));
  }, [tripData, hotelBookings]);

  const totalNights = tripData.days.filter(day => !isTransitDay(day)).length;
  const bookedNights = hotelBookings.reduce((sum, b) => sum + b.nights, 0);

  const displayBookings = showOnlyUnbooked ? [] : hotelBookings;
  const displayUnbooked = showOnlyUnbooked || unbookedNights.length > 0 ? unbookedNights : [];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <HotelIcon className="w-6 h-6 text-white" />
            </div>
            Hotel Bookings
          </h3>
          <p className="text-sm text-gray-600 mt-2">
            {bookedNights} of {totalNights} nights booked • {hotelBookings.length} hotels
          </p>
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={showOnlyUnbooked}
            onChange={(e) => setShowOnlyUnbooked(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show unbooked only
        </label>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
          <span>Booking Progress</span>
          <span className="text-blue-600">{Math.round((bookedNights / totalNights) * 100)}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 shadow-sm"
            style={{ width: `${(bookedNights / totalNights) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Bookings Timeline */}
      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
        {!showOnlyUnbooked && hotelBookings.map((booking, idx) => (
          <div
            key={idx}
            className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-lg overflow-hidden"
          >
            {/* Location Color Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.locationColor}`}></div>

            <div className="p-5 pl-6">
              {/* Hotel Name & Location */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-gray-900 mb-1 truncate">
                    {booking.hotelName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${booking.locationColor} bg-opacity-10`}>
                      <span className="text-sm">{booking.locationEmoji}</span>
                      <span className="text-xs font-semibold text-gray-700">{booking.location}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full">
                      <Moon className="w-3.5 h-3.5 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                {canManageUsers && booking.totalPrice > 0 && (
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-gray-900">
                      ₪{booking.totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-gray-500">total</span>
                  </div>
                )}
                {canManageUsers && booking.totalPrice === 0 && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                    Paid in cash
                  </div>
                )}
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Check-in</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(booking.checkIn).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400" />

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-xs text-gray-500">Check-out</div>
                    <div className="font-semibold text-gray-900">
                      {new Date(booking.checkOut).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                <div className="ml-auto text-xs text-gray-500">
                  Days {booking.startDay}-{booking.endDay}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Unbooked Nights */}
        {displayUnbooked.length > 0 && (
          <div className="space-y-2">
            {!showOnlyUnbooked && (
              <div className="flex items-center gap-2 mt-4 mb-2">
                <div className="h-px flex-1 bg-gray-300"></div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unbooked Nights</span>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>
            )}

            {displayUnbooked.map(day => (
              <div
                key={day.day}
                className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Day {day.day}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>

                  {getLocation(day.title) && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${getLocation(day.title).color} bg-opacity-10`}>
                      <span className="text-sm">{getLocation(day.title).emoji}</span>
                      <span className="text-xs font-semibold text-gray-700">{getLocation(day.title).name}</span>
                    </div>
                  )}

                  <div className="text-sm font-medium text-orange-700">
                    No hotel booked
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Alert */}
      {unbookedNights.length > 0 && !showOnlyUnbooked && (
        <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-orange-900">
                {unbookedNights.length} {unbookedNights.length === 1 ? 'night' : 'nights'} without accommodation
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Book hotels for the remaining nights to complete your trip planning
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
