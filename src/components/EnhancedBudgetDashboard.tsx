import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Wallet, Receipt, MapPin, Calendar, PiggyBank, CreditCard, Target, DollarSign, Plane, Hotel as HotelIcon, Car, Coffee, ShoppingBag, Activity } from 'lucide-react';
import type { TripData } from '../types/trip';

interface EnhancedBudgetDashboardProps {
  tripData: TripData;
  onClose: () => void;
}

const PLACES = [
  { name: 'Bangkok', emoji: '🇹🇭', color: '#FF6B6B' },
  { name: 'Canggu', emoji: '🏖️', color: '#4ECDC4' },
  { name: 'Sidemen', emoji: '🌾', color: '#95E1D3' },
  { name: 'Ubud', emoji: '🌿', color: '#38B2AC' },
  { name: 'Uluwatu', emoji: '🌅', color: '#F97316' },
  { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6' },
  { name: 'Gili Air', emoji: '🌊', color: '#60A5FA' },
  { name: 'Nusa Lembongan', emoji: '⛰️', color: '#8B5CF6' },
  { name: 'Kuta', emoji: '🏄', color: '#EC4899' },
  { name: 'Komodo', emoji: '🐉', color: '#EF4444' },
];

const CATEGORY_CONFIG = {
  accommodation: { icon: HotelIcon, label: 'Hotels & Accommodation', color: '#3B82F6', priority: 1 },
  transport: { icon: Car, label: 'Transportation', color: '#F59E0B', priority: 2 },
  food: { icon: Coffee, label: 'Food & Dining', color: '#EF4444', priority: 3 },
  activities: { icon: Activity, label: 'Activities & Entertainment', color: '#10B981', priority: 4 },
  shopping: { icon: ShoppingBag, label: 'Shopping', color: '#EC4899', priority: 5 },
  other: { icon: DollarSign, label: 'Other Expenses', color: '#6B7280', priority: 6 },
};

// Currency conversion rates (approximate for display)
const EXCHANGE_RATES: Record<string, number> = {
  'ILS': 1,
  'USD': 3.7,
  'THB': 0.11,
  'IDR': 0.00024,
};

export default function EnhancedBudgetDashboard({ tripData, onClose }: EnhancedBudgetDashboardProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'daily' | 'locations' | 'categories'>('overview');
  // Convert all amounts to ILS
  const convertCurrency = (amount: number, fromCurrency: string): number => {
    return amount * (EXCHANGE_RATES[fromCurrency] || 1);
  };

  const formatCurrency = (amount: number): string => {
    return `₪${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate all expenses and metrics
  const allExpenses = tripData.days.flatMap(d => d.expenses || []);
  const generalExpenses = tripData.generalExpenses || [];
  const totalExpenses = [...allExpenses, ...generalExpenses];

  // Separate fixed vs variable costs
  const fixedExpenses = generalExpenses.filter(e =>
    e.description.toLowerCase().includes('visa') ||
    e.description.toLowerCase().includes('flight') ||
    e.description.toLowerCase().includes('pre-trip')
  );
  const variableExpenses = allExpenses;

  const fixedTotal = fixedExpenses.reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
  const variableTotal = variableExpenses.reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
  const grandTotal = fixedTotal + variableTotal;

  const tripLength = tripData.days.length;
  const daysWithExpenses = tripData.days.filter(d => (d.expenses || []).length > 0).length;
  const avgPerDay = variableTotal / Math.max(daysWithExpenses, 1);
  const avgPerPerson = grandTotal / 2;
  const avgPerPersonPerDay = avgPerDay / 2;

  // Calculate by category
  const byCategory = Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
    const categoryExpenses = totalExpenses.filter(e => e.category === key);
    const total = categoryExpenses.reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
    const count = categoryExpenses.length;
    const percent = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
    return { key, ...config, total, count, percent };
  }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  // Calculate by location
  const byLocation = PLACES.map(place => {
    const placeDays = tripData.days.filter(d => d.title.includes(place.name));
    const expenses = placeDays.flatMap(d => d.expenses || []);
    const total = expenses.reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
    const avgPerDay = total / Math.max(placeDays.length, 1);
    return { ...place, days: placeDays.length, expenses: expenses.length, total, avgPerDay };
  }).filter(p => p.days > 0).sort((a, b) => b.total - a.total);

  // Calculate daily trend
  const dailyTrend = tripData.days
    .filter(d => (d.expenses || []).length > 0)
    .map(day => {
      const dayTotal = (day.expenses || []).reduce((sum, e) => sum + convertCurrency(e.amount, e.currency), 0);
      const place = PLACES.find(p => day.title.includes(p.name));
      return {
        day: day.day,
        date: day.date,
        title: day.title,
        total: dayTotal,
        expenseCount: day.expenses?.length || 0,
        place: place?.name || 'Other',
        placeEmoji: place?.emoji || '📍'
      };
    })
    .sort((a, b) => b.total - a.total);

  const topExpensiveDays = dailyTrend.slice(0, 10);

  // Calculate spending velocity (trend)
  const recentDays = dailyTrend.slice(0, 7);
  const olderDays = dailyTrend.slice(7, 14);
  const recentAvg = recentDays.reduce((sum, d) => sum + d.total, 0) / Math.max(recentDays.length, 1);
  const olderAvg = olderDays.reduce((sum, d) => sum + d.total, 0) / Math.max(olderDays.length, 1);
  const spendingTrend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Honeymoon Budget Analysis</h1>
              <p className="text-gray-600 text-sm mt-1">Complete financial breakdown of your trip</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Target },
              { id: 'daily', label: 'Daily Breakdown', icon: Calendar },
              { id: 'locations', label: 'By Location', icon: MapPin },
              { id: 'categories', label: 'By Category', icon: Receipt },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === id
                    ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Overview */}
          {viewMode === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                  <Wallet className="w-8 h-8 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold">{formatCurrency(grandTotal)}</p>
                  <p className="text-xs opacity-75 mt-2">{totalExpenses.length} transactions</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                  <PiggyBank className="w-8 h-8 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Per Person</p>
                  <p className="text-3xl font-bold">{formatCurrency(avgPerPerson)}</p>
                  <p className="text-xs opacity-75 mt-2">Split between two</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
                  <Calendar className="w-8 h-8 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Daily Average</p>
                  <p className="text-3xl font-bold">{formatCurrency(avgPerDay)}</p>
                  <p className="text-xs opacity-75 mt-2">{daysWithExpenses} days tracked</p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                  <Target className="w-8 h-8 mb-3 opacity-80" />
                  <p className="text-sm opacity-90 mb-1">Per Person/Day</p>
                  <p className="text-3xl font-bold">{formatCurrency(avgPerPersonPerDay)}</p>
                  <p className="text-xs opacity-75 mt-2">Individual daily cost</p>
                </div>
              </div>

              {/* Fixed vs Variable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-blue-600" />
                    Fixed / Pre-Trip Costs
                  </h3>
                  <div className="space-y-3">
                    {fixedExpenses.map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{exp.description}</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(convertCurrency(exp.amount, exp.currency))}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Fixed</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(fixedTotal)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {((fixedTotal / grandTotal) * 100).toFixed(1)}% of total budget
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Variable / Daily Costs
                  </h3>
                  <div className="space-y-3">
                    {byCategory.slice(0, 5).map((cat) => (
                      <div key={cat.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                          <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total Variable</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(variableTotal)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {((variableTotal / grandTotal) * 100).toFixed(1)}% of total budget
                    </p>
                  </div>
                </div>
              </div>

              {/* Spending Trend */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Spending Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Most Expensive Location</p>
                    <p className="text-2xl font-bold text-gray-900">{byLocation[0]?.emoji} {byLocation[0]?.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(byLocation[0]?.total || 0)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Top Expense Category</p>
                    <p className="text-2xl font-bold text-gray-900">{byCategory[0]?.label}</p>
                    <p className="text-sm text-gray-500">{byCategory[0]?.percent.toFixed(1)}% of budget</p>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Spending Trend</p>
                    <div className="flex items-center gap-2">
                      {spendingTrend > 0 ? (
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-green-500" />
                      )}
                      <p className="text-2xl font-bold text-gray-900">{Math.abs(spendingTrend).toFixed(0)}%</p>
                    </div>
                    <p className="text-sm text-gray-500">{spendingTrend > 0 ? 'Increasing' : 'Decreasing'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Breakdown */}
          {viewMode === 'daily' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Top 10 Most Expensive Days</h2>
              <div className="space-y-3">
                {topExpensiveDays.map((day, idx) => {
                  const isHigh = day.total > avgPerDay * 1.5;
                  const isLow = day.total < avgPerDay * 0.5 && avgPerDay > 0;

                  return (
                    <div key={day.day} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                            idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">{day.placeEmoji}</span>
                              <span className="font-bold text-gray-900 text-lg">Day {day.day}</span>
                              <span className="text-gray-500">·</span>
                              <span className="text-gray-600">{day.title}</span>
                            </div>
                            <p className="text-sm text-gray-500">{day.expenseCount} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900">{formatCurrency(day.total)}</p>
                          {isHigh && (
                            <span className="text-xs text-orange-600 flex items-center gap-1 justify-end mt-1">
                              <TrendingUp className="w-3 h-3" />
                              Above average
                            </span>
                          )}
                          {isLow && (
                            <span className="text-xs text-green-600 flex items-center gap-1 justify-end mt-1">
                              <TrendingDown className="w-3 h-3" />
                              Below average
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Location */}
          {viewMode === 'locations' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Spending by Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {byLocation.map((place) => {
                  const maxSpending = Math.max(...byLocation.map(p => p.total));
                  const widthPercent = (place.total / maxSpending) * 100;

                  return (
                    <div key={place.name} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{place.emoji}</span>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{place.name}</h3>
                            <p className="text-sm text-gray-500">{place.days} days · {place.expenses} expenses</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(place.total)}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(place.avgPerDay)}/day</p>
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: place.color,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {((place.total / grandTotal) * 100).toFixed(1)}% of total budget
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Category */}
          {viewMode === 'categories' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Spending by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {byCategory.map((cat) => (
                  <div key={cat.key} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                          <cat.icon className="w-6 h-6" style={{ color: cat.color }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{cat.label}</h3>
                          <p className="text-sm text-gray-500">{cat.count} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(cat.total)}</p>
                        <p className="text-sm text-gray-500">{cat.percent.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
