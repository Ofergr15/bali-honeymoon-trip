import { useState, useMemo } from 'react';
import { X, Calendar, MapPin, DollarSign, Heart, Clock, CheckCircle, AlertCircle, TrendingUp, Utensils, Hotel, Camera, Plane, Sun, Moon } from 'lucide-react';
import type { TripData, DayExpense } from '../types/trip';

interface TripDashboardProps {
  tripData: TripData;
  onClose: () => void;
}

const PLACES = [
  { name: 'Canggu', emoji: '🏖️', color: '#06B6D4', gradient: 'from-cyan-500 to-blue-500' },
  { name: 'Ubud', emoji: '🌿', color: '#10B981', gradient: 'from-emerald-500 to-green-600' },
  { name: 'Munduk', emoji: '🏔️', color: '#8B4513', gradient: 'from-amber-700 to-orange-800' },
  { name: 'Sidemen', emoji: '🌾', color: '#84CC16', gradient: 'from-lime-500 to-green-500' },
  { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6', gradient: 'from-blue-500 to-indigo-500' },
  { name: 'Gili Air', emoji: '🌊', color: '#60A5FA', gradient: 'from-blue-400 to-cyan-400' },
  { name: 'Nusa Penida', emoji: '⛰️', color: '#1D4ED8', gradient: 'from-blue-700 to-indigo-800' },
  { name: 'Uluwatu', emoji: '🌅', color: '#F97316', gradient: 'from-orange-500 to-red-500' },
];

export default function TripDashboard({ tripData, onClose }: TripDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'budget' | 'itinerary'>('overview');

  // Calculate all metrics
  const metrics = useMemo(() => {
    const allExpenses = tripData.days.flatMap(d => d.expenses || []);
    const totalByCurrency = allExpenses.reduce((acc, exp) => {
      if (!acc[exp.currency]) acc[exp.currency] = 0;
      acc[exp.currency] += exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const daysWithExpenses = tripData.days.filter(d => (d.expenses || []).length > 0).length;
    const allActivities = tripData.days.flatMap(d => d.activities || []);
    const daysWithActivities = tripData.days.filter(d => (d.activities || []).length > 0).length;

    // Hotel coverage
    const daysWithHotels = tripData.days.filter(d => d.hotel).length;
    const hotelCoverage = (daysWithHotels / tripData.days.length) * 100;

    // Activities by type
    const activitiesByType = allActivities.reduce((acc, act) => {
      if (!acc[act.type]) acc[act.type] = 0;
      acc[act.type]++;
      return acc;
    }, {} as Record<string, number>);

    // Places visited
    const placesVisited = new Set<string>();
    tripData.days.forEach(day => {
      PLACES.forEach(place => {
        if (day.title.includes(place.name)) placesVisited.add(place.name);
      });
    });

    // Days until trip
    const startDate = new Date(tripData.startDate);
    const today = new Date();
    const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Itinerary completion
    const totalDays = tripData.days.length;
    const completedDays = tripData.days.filter(d =>
      (d.activities && d.activities.length > 0) || d.hotel
    ).length;
    const completionPercentage = (completedDays / totalDays) * 100;

    return {
      totalByCurrency,
      expenseCount: allExpenses.length,
      daysWithExpenses,
      activitiesCount: allActivities.length,
      daysWithActivities,
      hotelCoverage,
      activitiesByType,
      placesCount: placesVisited.size,
      daysUntilTrip,
      completionPercentage,
      totalDays,
      completedDays,
    };
  }, [tripData]);

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Hero Header */}
        <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-8 py-6 flex-shrink-0">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-20 text-6xl">🌺</div>
            <div className="absolute bottom-10 right-20 text-6xl">💕</div>
            <div className="absolute top-20 right-40 text-4xl">✨</div>
            <div className="absolute bottom-20 left-40 text-4xl">🌴</div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="w-7 h-7 text-white" fill="white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Bali Honeymoon</h1>
                    <p className="text-pink-100 text-sm">Your dream trip awaits</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2 text-white">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">{new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tripData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">{metrics.placesCount} destinations</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{metrics.totalDays} days</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Countdown */}
            {metrics.daysUntilTrip > 0 && (
              <div className="mt-6 inline-block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                  <div className="flex items-center gap-3">
                    <Sun className="w-6 h-6 text-yellow-200" />
                    <div>
                      <p className="text-white text-2xl font-bold">{metrics.daysUntilTrip} days</p>
                      <p className="text-pink-100 text-xs">until your honeymoon!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Trip Completion */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{Math.round(metrics.completionPercentage)}%</span>
              </div>
              <h3 className="font-semibold text-sm opacity-90">Trip Planning</h3>
              <p className="text-xs opacity-75 mt-1">{metrics.completedDays} of {metrics.totalDays} days planned</p>
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${metrics.completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Activities */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{metrics.activitiesCount}</span>
              </div>
              <h3 className="font-semibold text-sm opacity-90">Activities Planned</h3>
              <p className="text-xs opacity-75 mt-1">{metrics.daysWithActivities} days covered</p>
              {Object.entries(metrics.activitiesByType).length > 0 && (
                <div className="flex flex-wrap items-center gap-1 mt-3">
                  {Object.entries(metrics.activitiesByType).slice(0, 2).map(([type, count]) => (
                    <span key={type} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      {type} ({count})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Hotels */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Hotel className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold">{Math.round(metrics.hotelCoverage)}%</span>
              </div>
              <h3 className="font-semibold text-sm opacity-90">Hotel Coverage</h3>
              <p className="text-xs opacity-75 mt-1">Accommodations booked</p>
              <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${metrics.hotelCoverage}%` }}
                />
              </div>
            </div>

            {/* Budget */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold">{metrics.expenseCount}</span>
              </div>
              <h3 className="font-semibold text-sm opacity-90">Expenses Tracked</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(metrics.totalByCurrency).slice(0, 2).map(([currency, total]) => (
                  <p key={currency} className="text-xs opacity-90">
                    {formatCurrency(total, currency)} {currency}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Journey Map */}
          <div className="bg-white rounded-xl border-2 border-gray-100 p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-travel-teal" />
              Your Journey Through Bali
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-orange-300 to-teal-300"></div>

              <div className="space-y-6">
                {PLACES.map((place, idx) => {
                  const placeDays = tripData.days.filter(d => d.title.includes(place.name));
                  if (placeDays.length === 0) return null;

                  const activities = placeDays.flatMap(d => d.activities || []);
                  const hotels = placeDays.filter(d => d.hotel).length;
                  const expenses = placeDays.flatMap(d => d.expenses || []);

                  return (
                    <div key={place.name} className="relative pl-16">
                      {/* Place icon */}
                      <div
                        className="absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white bg-gradient-to-br"
                        style={{
                          background: `linear-gradient(135deg, ${place.color}, ${place.color}dd)`
                        }}
                      >
                        {place.emoji}
                      </div>

                      {/* Place content */}
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{place.name}</h3>
                            <p className="text-sm text-gray-600">{placeDays.length} {placeDays.length === 1 ? 'day' : 'days'}</p>
                          </div>
                          <div className="flex gap-2">
                            {activities.length > 0 && (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                {activities.length} activities
                              </span>
                            )}
                            {hotels > 0 && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {hotels} {hotels === 1 ? 'night' : 'nights'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <Utensils className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                            <p className="text-xs text-gray-600">Restaurants</p>
                            <p className="text-lg font-bold text-gray-900">
                              {activities.filter(a => a.type === 'restaurant').length}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <Camera className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                            <p className="text-xs text-gray-600">Attractions</p>
                            <p className="text-lg font-bold text-gray-900">
                              {activities.filter(a => a.type === 'attraction' || a.type === 'temple' || a.type === 'beach').length}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                            <DollarSign className="w-5 h-5 mx-auto text-green-500 mb-1" />
                            <p className="text-xs text-gray-600">Expenses</p>
                            <p className="text-lg font-bold text-gray-900">{expenses.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What's Next */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                What's Next?
              </h3>
              <div className="space-y-3">
                {metrics.completionPercentage < 100 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Complete trip planning</p>
                      <p className="text-xs text-gray-600">{metrics.totalDays - metrics.completedDays} days need activities or hotels</p>
                    </div>
                  </div>
                )}
                {metrics.hotelCoverage < 100 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Book remaining hotels</p>
                      <p className="text-xs text-gray-600">{Math.round(100 - metrics.hotelCoverage)}% of nights still need accommodation</p>
                    </div>
                  </div>
                )}
                {metrics.daysWithExpenses === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Start tracking expenses</p>
                      <p className="text-xs text-gray-600">Add your first expense to get budget insights</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trip Highlights */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" fill="currentColor" />
                Honeymoon Highlights
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">🌺</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Romantic Dinners</p>
                    <p className="text-xs text-gray-600">{metrics.activitiesByType.restaurant || 0} restaurants planned</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">🏖️</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Beach Time</p>
                    <p className="text-xs text-gray-600">{metrics.activitiesByType.beach || 0} beach activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">✨</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Adventures</p>
                    <p className="text-xs text-gray-600">{metrics.activitiesByType.activity || 0} exciting activities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
