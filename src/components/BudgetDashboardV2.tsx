import { useState } from 'react';
import { X, TrendingUp, TrendingDown, Wallet, Receipt, MapPin, Calendar, PiggyBank, CreditCard, Target } from 'lucide-react';
import type { TripData } from '../types/trip';

interface BudgetDashboardV2Props {
  tripData: TripData;
  onClose: () => void;
}

const PLACES = [
  { name: 'Canggu', emoji: '🏖️', color: '#06B6D4', image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ubud', emoji: '🌿', color: '#10B981', image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Munduk', emoji: '🏔️', color: '#8B4513', image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Sidemen', emoji: '🌾', color: '#84CC16', image: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6', image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Gili Air', emoji: '🌊', color: '#60A5FA', image: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { name: 'Nusa Penida', emoji: '⛰️', color: '#1D4ED8', image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Uluwatu', emoji: '🌅', color: '#F97316', image: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%, #feada6 100%)' },
];

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  activities: '🎯',
  shopping: '🛍️',
  accommodation: '🏨',
  other: '💰',
};

export default function BudgetDashboardV2({ tripData, onClose }: BudgetDashboardV2Props) {
  const [budget] = useState<{ [currency: string]: number }>({
    USD: 5000,
    IDR: 50000000,
  });

  // Calculate metrics
  const allExpenses = tripData.days.flatMap(d => d.expenses || []);
  const totalByCurrency = allExpenses.reduce((acc, exp) => {
    if (!acc[exp.currency]) acc[exp.currency] = 0;
    acc[exp.currency] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Place spending
  const placeSpending = PLACES.map(place => {
    const placeDays = tripData.days.filter(d => d.title.includes(place.name));
    const expenses = placeDays.flatMap(d => d.expenses || []);
    const total = expenses.reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount : e.amount / 15000), 0);
    return { ...place, total, expenses: expenses.length, days: placeDays.length };
  }).filter(p => p.days > 0);

  // Category spending
  const categorySpending = Object.keys(CATEGORY_ICONS).map(cat => {
    const expenses = allExpenses.filter(e => e.category === cat);
    const total = expenses.reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount : e.amount / 15000), 0);
    return { category: cat, total, count: expenses.length, icon: CATEGORY_ICONS[cat] };
  }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const totalUSD = Object.entries(totalByCurrency).reduce((sum, [curr, amt]) => {
    return sum + (curr === 'USD' ? amt : amt / 15000);
  }, 0);

  const budgetUSD = budget.USD || 0;
  const budgetUsedPercent = budgetUSD > 0 ? (totalUSD / budgetUSD) * 100 : 0;
  const daysWithExpenses = tripData.days.filter(d => (d.expenses || []).length > 0).length;
  const avgPerDay = daysWithExpenses > 0 ? totalUSD / daysWithExpenses : 0;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modern Header */}
        <div className="relative bg-gradient-to-br from-slate-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Trip Budget</h1>
              <p className="text-gray-600 text-sm">Track your honeymoon expenses</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Spent */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalUSD)}</p>
              <p className="text-xs text-gray-500 mt-1">{allExpenses.length} transactions</p>
            </div>

            {/* Budget Remaining */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Budget Left</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(budgetUSD - totalUSD)}</p>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetUsedPercent > 90 ? 'bg-red-500' : budgetUsedPercent > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Daily Average */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Daily Average</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(avgPerDay)}</p>
              <p className="text-xs text-gray-500 mt-1">{daysWithExpenses} days tracked</p>
            </div>

            {/* Budget Status */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Budget Used</p>
              <p className="text-3xl font-bold text-gray-900">{budgetUsedPercent.toFixed(0)}%</p>
              <p className="text-xs text-gray-500 mt-1">of {formatCurrency(budgetUSD)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Spending by Location */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Spending by Location
                </h2>

                <div className="space-y-4">
                  {placeSpending.map((place, idx) => {
                    const maxSpending = Math.max(...placeSpending.map(p => p.total));
                    const widthPercent = maxSpending > 0 ? (place.total / maxSpending) * 100 : 0;

                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                              style={{ background: place.image }}
                            >
                              {place.emoji}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{place.name}</h3>
                              <p className="text-xs text-gray-500">{place.days} days • {place.expenses} expenses</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(place.total)}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(place.total / place.days)}/day</p>
                          </div>
                        </div>

                        {/* Bar chart */}
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                            style={{
                              width: `${widthPercent}%`,
                              background: place.image,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spending Timeline */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  Spending Over Time
                </h2>

                <div className="space-y-3">
                  {tripData.days.filter(d => (d.expenses || []).length > 0).slice(0, 10).map((day) => {
                    const dayTotal = (day.expenses || []).reduce((sum, e) =>
                      sum + (e.currency === 'USD' ? e.amount : e.amount / 15000), 0
                    );
                    const place = PLACES.find(p => day.title.includes(p.name));

                    return (
                      <div key={day.day} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                          <span className="text-xs font-medium text-gray-500">Day</span>
                          <span className="text-lg font-bold text-gray-900">{day.day}</span>
                        </div>
                        {place && (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                            style={{ background: place.image }}
                          >
                            {place.emoji}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{day.title}</p>
                          <p className="text-xs text-gray-500">{day.expenses?.length} transactions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(dayTotal)}</p>
                          {dayTotal > avgPerDay * 1.5 && (
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              High
                            </span>
                          )}
                          {dayTotal < avgPerDay * 0.5 && avgPerDay > 0 && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              Low
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Categories */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  Categories
                </h2>

                <div className="space-y-3">
                  {categorySpending.map((cat, idx) => {
                    const percent = totalUSD > 0 ? (cat.total / totalUSD) * 100 : 0;

                    const colors = [
                      'from-red-500 to-orange-500',
                      'from-blue-500 to-indigo-500',
                      'from-green-500 to-emerald-500',
                      'from-yellow-500 to-amber-500',
                      'from-purple-500 to-pink-500',
                      'from-gray-500 to-slate-500',
                    ];

                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center shadow-sm`}>
                              <span className="text-xl">{cat.icon}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{cat.category}</p>
                              <p className="text-xs text-gray-500">{cat.count} items</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatCurrency(cat.total)}</p>
                            <p className="text-xs text-gray-500">{percent.toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Most expensive day</span>
                    <span className="font-bold">
                      Day {tripData.days.reduce((max, day) => {
                        const total = (day.expenses || []).reduce((sum, e) => sum + e.amount, 0);
                        const maxTotal = (tripData.days[max - 1]?.expenses || []).reduce((sum, e) => sum + e.amount, 0);
                        return total > maxTotal ? day.day : max;
                      }, 1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Top category</span>
                    <span className="font-bold capitalize">{categorySpending[0]?.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Most expensive place</span>
                    <span className="font-bold">{placeSpending[0]?.name || 'N/A'}</span>
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
