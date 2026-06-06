import { useState, useMemo } from 'react';
import type { TripData } from '../types/trip';
import { Hotel as HotelIcon, Calendar, MapPin, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface BookingStatusViewProps {
  tripData: TripData;
}

interface HotelStay {
  hotelName: string;
  location: { name: string; emoji: string; color: string };
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
  dayNumbers: number[];
  isPaidInCash: boolean;
}

export default function BookingStatusView({ tripData }: BookingStatusViewProps) {
  const { canManageUsers } = useAuth();
  const [showOnlyUnbooked, setShowOnlyUnbooked] = useState(false);

  // Places with emojis and colors
  const PLACES = [
    { name: 'Bangkok', emoji: '🇹🇭', color: '#EF4444' },
    { name: 'Canggu', emoji: '🏖️', color: '#06B6D4' },
    { name: 'Sidemen', emoji: '🌾', color: '#84CC16' },
    { name: 'Ubud', emoji: '🌿', color: '#10B981' },
    { name: 'Uluwatu', emoji: '🌅', color: '#F97316' },
    { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6' },
    { name: 'Gili Air', emoji: '🌊', color: '#60A5FA' },
    { name: 'Nusa Lembongan', emoji: '⛰️', color: '#8B5CF6' },
    { name: 'Kuta', emoji: '🏄', color: '#EC4899' },
    { name: 'Komodo', emoji: '🐉', color: '#14B8A6' },
  ];

  // Transit days
  const isTransitDay = (day: any) => {
    const title = day.title.toLowerCase();
    return title.includes('departure') || title.includes('arrival') || title.includes('flight') ||
           (day.day === 1) || (day.day === 29) || (day.day === 30);
  };

  // Currency conversion
  const EXCHANGE_RATES: Record<string, number> = {
    'ILS': 1, 'USD': 3.7, 'THB': 0.11, 'IDR': 0.00024,
  };
  const convertToILS = (amount: number, currency: string) => amount * (EXCHANGE_RATES[currency] || 1);

  // Get location
  const getLocation = (title: string) => {
    for (const place of PLACES) {
      if (title.includes(place.name)) return place;
    }
    return { name: '', emoji: '📍', color: '#6B7280' };
  };

  // Group consecutive nights at same hotel into stays
  const hotelStays = useMemo(() => {
    console.log('🏨 Starting hotel grouping analysis...');

    const stays: HotelStay[] = [];
    const eligibleDays = tripData.days.filter(d => !isTransitDay(d));
    const processed = new Set<number>();

    console.log(`📅 Total eligible days: ${eligibleDays.length}`);
    console.log('All days:', eligibleDays.map(d => ({ day: d.day, date: d.date, hasExpenses: !!d.expenses?.length })));

    // Sort by day number to ensure proper order
    const sortedDays = [...eligibleDays].sort((a, b) => a.day - b.day);

    sortedDays.forEach(day => {
      if (processed.has(day.day)) {
        console.log(`⏭️  Day ${day.day} already processed, skipping`);
        return;
      }

      const accommodations = (day.expenses || []).filter(e => e.category === 'accommodation');
      if (accommodations.length === 0) {
        console.log(`❌ Day ${day.day} (${day.date}): No accommodations`);
        return;
      }

      // Get hotel name (clean)
      const rawName = accommodations[0].description;
      const hotelName = rawName
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*-\s*.*$/,'')
        .trim();

      console.log(`\n🏨 Day ${day.day} (${day.date}): Found "${hotelName}"`);
      console.log(`   Raw description: "${rawName}"`);
      console.log(`   Expenses on this day: ${accommodations.length}`);

      const location = getLocation(day.title);

      // Collect consecutive nights at same hotel
      const nightsData = [day];
      processed.add(day.day);

      // Look ahead for consecutive days with same hotel
      console.log(`   🔍 Looking ahead from day ${day.day}...`);

      // Check each subsequent day
      for (let checkDay = day.day + 1; checkDay <= sortedDays[sortedDays.length - 1].day; checkDay++) {
        console.log(`      Checking day ${checkDay}...`);

        const nextDay = sortedDays.find(d => d.day === checkDay);

        if (!nextDay) {
          console.log(`      ⚠️  Day ${checkDay} not in eligible days list`);
          break;
        }

        const nextAccom = (nextDay.expenses || []).filter(e => e.category === 'accommodation');

        if (nextAccom.length === 0) {
          console.log(`      ⚠️  Day ${checkDay}: No accommodations found, stopping`);
          break;
        }

        const nextRawName = nextAccom[0].description;
        const nextHotelName = nextRawName
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/\s*-\s*.*$/, '')
          .trim();

        console.log(`      📍 Day ${checkDay}: Found "${nextHotelName}"`);
        console.log(`         Raw: "${nextRawName}"`);
        console.log(`         Match? "${nextHotelName}" === "${hotelName}" = ${nextHotelName === hotelName}`);

        if (nextHotelName !== hotelName) {
          console.log(`      ❌ Different hotel, stopping here`);
          break;
        }

        console.log(`      ✅ Same hotel! Adding day ${checkDay} to group`);
        nightsData.push(nextDay);
        processed.add(nextDay.day);
      }

      // Calculate total price across all nights
      const allAccom = nightsData.flatMap(d =>
        (d.expenses || []).filter(e => e.category === 'accommodation')
      );
      const totalPrice = allAccom.reduce((sum, e) => sum + convertToILS(e.amount, e.currency), 0);

      console.log(`   💰 Total accommodation expenses collected: ${allAccom.length}`);
      allAccom.forEach((acc, i) => {
        console.log(`      ${i + 1}. ${acc.amount} ${acc.currency} = ₪${convertToILS(acc.amount, acc.currency).toFixed(2)}`);
      });
      console.log(`   💵 Total price: ₪${totalPrice.toFixed(2)}`);
      console.log(`   🌙 Total nights grouped: ${nightsData.length}`);
      console.log(`   📊 Day numbers: ${nightsData.map(d => d.day).join(', ')}`);

      // Check-out is morning after last night
      const lastNight = nightsData[nightsData.length - 1];
      const checkOutDate = new Date(lastNight.date);
      checkOutDate.setDate(checkOutDate.getDate() + 1);

      const stay = {
        hotelName,
        location,
        checkInDate: nightsData[0].date,
        checkOutDate: checkOutDate.toISOString().split('T')[0],
        nights: nightsData.length,
        totalPrice,
        dayNumbers: nightsData.map(d => d.day),
        isPaidInCash: totalPrice === 0
      };

      console.log(`   ✅ Created stay:`, JSON.stringify(stay, null, 2));
      stays.push(stay);
    });

    console.log(`\n📊 FINAL SUMMARY: ${stays.length} hotel stays created`);
    stays.forEach((stay, idx) => {
      console.log(`${idx + 1}. ${stay.hotelName}:`);
      console.log(`   - ${stay.nights} nights`);
      console.log(`   - Days ${stay.dayNumbers.join(', ')}`);
      console.log(`   - Check-in: ${stay.checkInDate}`);
      console.log(`   - Check-out: ${stay.checkOutDate}`);
      console.log(`   - Total: ₪${stay.totalPrice.toFixed(0)}`);
    });

    return stays;
  }, [tripData]);

  // Find unbooked nights
  const unbookedNights = useMemo(() => {
    const eligibleDays = tripData.days.filter(d => !isTransitDay(d));
    const bookedDayNumbers = new Set(hotelStays.flatMap(s => s.dayNumbers));
    return eligibleDays.filter(d => !bookedDayNumbers.has(d.day));
  }, [tripData, hotelStays]);

  const totalNights = tripData.days.filter(d => !isTransitDay(d)).length;
  const bookedNights = hotelStays.reduce((sum, s) => sum + s.nights, 0);
  const progress = totalNights > 0 ? (bookedNights / totalNights) * 100 : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <HotelIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Accommodation</h3>
              <p className="text-sm text-gray-600">{hotelStays.length} bookings • {bookedNights} nights</p>
            </div>
          </div>

          <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={showOnlyUnbooked}
              onChange={(e) => setShowOnlyUnbooked(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Unbooked only</span>
          </label>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Booking Progress</span>
            <span className="font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{bookedNights} nights booked</span>
            {unbookedNights.length > 0 && (
              <span className="text-orange-600 font-medium">{unbookedNights.length} unbooked</span>
            )}
          </div>
        </div>
      </div>

      {/* Hotel Stays */}
      {!showOnlyUnbooked && hotelStays.length > 0 && (
        <div className="space-y-3">
          {hotelStays.map((stay, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Location color bar */}
              <div
                className="h-1.5"
                style={{ backgroundColor: stay.location.color }}
              />

              <div className="p-5">
                {/* Hotel name and location */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <HotelIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{stay.hotelName}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold"
                        style={{ backgroundColor: stay.location.color }}
                      >
                        <span>{stay.location.emoji}</span>
                        <span>{stay.location.name}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-lg border-2 border-indigo-200">
                        <Moon className="w-5 h-5 text-indigo-600" />
                        <span className="text-xl font-bold text-indigo-900">{stay.nights}</span>
                        <span className="text-sm font-semibold text-indigo-700">{stay.nights === 1 ? 'night' : 'nights'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  {canManageUsers && (
                    <div className="text-right flex-shrink-0">
                      {stay.isPaidInCash ? (
                        <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-semibold">
                          Paid in cash
                        </div>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-gray-900">
                            ₪{stay.totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ₪{Math.round(stay.totalPrice / stay.nights).toLocaleString()} per night
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Check-in</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{formatDate(stay.checkInDate)}</span>
                    </div>
                  </div>

                  <div className="text-gray-300">→</div>

                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Check-out</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{formatDate(stay.checkOutDate)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 ml-auto">
                    Days {stay.dayNumbers[0]}-{stay.dayNumbers[stay.dayNumbers.length - 1]}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unbooked Nights */}
      {unbookedNights.length > 0 && (
        <div className="space-y-2">
          {!showOnlyUnbooked && (
            <div className="flex items-center gap-3 px-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unbooked</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {unbookedNights.map(day => {
            const location = getLocation(day.title);
            return (
              <div
                key={day.day}
                className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center">
                      {day.day}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{formatDate(day.date)}</div>
                      <div className="text-sm text-orange-700 flex items-center gap-1.5 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No accommodation booked</span>
                      </div>
                    </div>
                  </div>

                  {location.name && (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-semibold"
                      style={{ backgroundColor: location.color }}
                    >
                      <span>{location.emoji}</span>
                      <span>{location.name}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
