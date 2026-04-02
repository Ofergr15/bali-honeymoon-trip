import { useState } from 'react';
import { DollarSign, TrendingUp, MapPin, Calendar, PieChart, AlertCircle } from 'lucide-react';
import type { TripData, DayExpense } from '../types/trip';
import { getAreaFromCoordinates } from '../utils/colors';

interface BudgetAnalyticsProps {
  tripData: TripData;
}

const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', emoji: '🍽️', color: '#EF4444' },
  { id: 'transport', name: 'Transportation', emoji: '🚗', color: '#3B82F6' },
  { id: 'activities', name: 'Activities', emoji: '🎯', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#F59E0B' },
  { id: 'accommodation', name: 'Accommodation', emoji: '🏨', color: '#8B5CF6' },
  { id: 'other', name: 'Other', emoji: '💰', color: '#6B7280' },
];

// Define places with their day ranges
const PLACES = [
  { name: 'Canggu', emoji: '🏖️', color: '#06B6D4', dayStart: 1, dayEnd: 3 },
  { name: 'Ubud', emoji: '🌿', color: '#10B981', dayStart: 4, dayEnd: 6 },
  { name: 'Munduk', emoji: '🏔️', color: '#8B4513', dayStart: 7, dayEnd: 9 },
  { name: 'Sidemen', emoji: '🌾', color: '#84CC16', dayStart: 10, dayEnd: 11 },
  { name: 'Gili Trawangan', emoji: '🏝️', color: '#3B82F6', dayStart: 12, dayEnd: 13 },
  { name: 'Gili Air', emoji: '🌊', color: '#60A5FA', dayStart: 14, dayEnd: 15 },
  { name: 'Nusa Penida', emoji: '⛰️', color: '#1D4ED8', dayStart: 16, dayEnd: 16 },
  { name: 'Uluwatu', emoji: '🌅', color: '#F97316', dayStart: 17, dayEnd: 25 },
];

export default function BudgetAnalytics({ tripData }: BudgetAnalyticsProps) {
  const [budget, setBudget] = useState<{ [currency: string]: number }>({
    USD: 5000,
    IDR: 50000000,
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState({ ...budget });

  // Get all expenses
  const allExpenses = tripData.days.flatMap(d => d.expenses || []);

  // Calculate total by currency
  const totalByCurrency = allExpenses.reduce((acc, exp) => {
    if (!acc[exp.currency]) acc[exp.currency] = 0;
    acc[exp.currency] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate by category
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => {
    const expenses = allExpenses.filter(e => e.category === cat.id);
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    return { ...cat, totals, count: expenses.length };
  });

  // Calculate by place
  const placeTotals = PLACES.map(place => {
    const daysInPlace = tripData.days.filter(d => d.day >= place.dayStart && d.day <= place.dayEnd);
    const expenses = daysInPlace.flatMap(d => d.expenses || []);
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    return { ...place, totals, count: expenses.length, days: place.dayEnd - place.dayStart + 1 };
  });

  // Calculate by week
  const weekTotals = [
    { week: 1, days: '1-7', dayStart: 1, dayEnd: 7 },
    { week: 2, days: '8-14', dayStart: 8, dayEnd: 14 },
    { week: 3, days: '15-21', dayStart: 15, dayEnd: 21 },
    { week: 4, days: '22-25', dayStart: 22, dayEnd: 25 },
  ].map(w => {
    const daysInWeek = tripData.days.filter(d => d.day >= w.dayStart && d.day <= w.dayEnd);
    const expenses = daysInWeek.flatMap(d => d.expenses || []);
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    return { ...w, totals, count: expenses.length };
  });

  // Calculate daily average
  const daysWithExpenses = tripData.days.filter(d => (d.expenses || []).length > 0).length;
  const dailyAvgByCurrency: Record<string, number> = {};
  Object.entries(totalByCurrency).forEach(([currency, total]) => {
    dailyAvgByCurrency[currency] = daysWithExpenses > 0 ? total / daysWithExpenses : 0;
  });

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleSaveBudget = () => {
    setBudget(tempBudget);
    setEditingBudget(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-travel-teal" />
            Budget & Analytics
          </h2>
          <p className="text-sm text-gray-600 mt-1">Track your spending across the trip</p>
        </div>
      </div>

      {/* Total Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget vs Actual */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-travel-teal" />
              Budget vs Actual
            </h3>
            <button
              onClick={() => {
                setEditingBudget(!editingBudget);
                setTempBudget(budget);
              }}
              className="text-xs text-travel-teal hover:underline font-medium"
            >
              {editingBudget ? 'Cancel' : 'Edit Budget'}
            </button>
          </div>

          {editingBudget ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700">USD Budget</label>
                <input
                  type="number"
                  value={tempBudget.USD || ''}
                  onChange={(e) => setTempBudget({ ...tempBudget, USD: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">IDR Budget</label>
                <input
                  type="number"
                  value={tempBudget.IDR || ''}
                  onChange={(e) => setTempBudget({ ...tempBudget, IDR: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="e.g., 50000000"
                />
              </div>
              <button
                onClick={handleSaveBudget}
                className="w-full px-4 py-2 bg-travel-teal text-white rounded-lg font-medium hover:bg-[#0c8c8c] transition-colors text-sm"
              >
                Save Budget
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(budget).map(([currency, budgetAmount]) => {
                const actual = totalByCurrency[currency] || 0;
                const percentage = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;
                const remaining = budgetAmount - actual;
                const isOverBudget = remaining < 0;

                return (
                  <div key={currency}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{currency}</span>
                      <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(actual, currency)} / {formatCurrency(budgetAmount, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-gray-200">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-travel-teal'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">{percentage.toFixed(1)}% used</span>
                      <span className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverBudget ? 'Over by ' : 'Remaining: '}
                        {formatCurrency(Math.abs(remaining), currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total Spent */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Total Expenses
          </h3>
          <div className="space-y-2">
            {Object.entries(totalByCurrency).map(([currency, total]) => (
              <div key={currency} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{currency}</span>
                <span className="text-2xl font-bold text-purple-600">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            ))}
            {Object.keys(totalByCurrency).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No expenses yet</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-bold text-gray-900">{allExpenses.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Daily Average</span>
              <div className="text-right">
                {Object.entries(dailyAvgByCurrency).map(([currency, avg]) => (
                  <div key={currency} className="font-bold text-gray-900">
                    {formatCurrency(avg, currency)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-travel-teal" />
          By Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryTotals.map(cat => (
            <div
              key={cat.id}
              className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ borderColor: `${cat.color}40` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{cat.name}</h4>
                  <p className="text-xs text-gray-500">{cat.count} transactions</p>
                </div>
              </div>
              {Object.entries(cat.totals).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(cat.totals).map(([currency, total]) => (
                    <div key={currency} className="text-sm">
                      <span className="font-bold" style={{ color: cat.color }}>
                        {formatCurrency(total, currency)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">{currency}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No expenses</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* By Place */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-travel-teal" />
          By Place
        </h3>
        <div className="space-y-3">
          {placeTotals.map(place => (
            <div
              key={place.name}
              className="border-l-4 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              style={{ borderColor: place.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{place.emoji}</span>
                    <h4 className="font-bold text-gray-900">{place.name}</h4>
                    <span className="text-xs text-gray-500">
                      Days {place.dayStart}-{place.dayEnd} ({place.days} days)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{place.count} transactions</p>
                  {Object.entries(place.totals).length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(place.totals).map(([currency, total]) => (
                        <div key={currency}>
                          <span className="font-bold text-lg" style={{ color: place.color }}>
                            {formatCurrency(total, currency)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">{currency}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No expenses yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Week */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-travel-teal" />
          By Week
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weekTotals.map(week => (
            <div
              key={week.week}
              className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">Week {week.week}</h4>
                  <p className="text-xs text-gray-500">Days {week.days}</p>
                </div>
                <span className="text-2xl">📅</span>
              </div>
              {Object.entries(week.totals).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(week.totals).map(([currency, total]) => (
                    <div key={currency} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{currency}</span>
                      <span className="font-bold text-travel-teal">
                        {formatCurrency(total, currency)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Transactions</span>
                      <span className="font-medium text-gray-700">{week.count}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No expenses yet</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">💡 Tips for Tracking</p>
            <ul className="space-y-1 text-xs">
              <li>• Add expenses daily to get accurate analytics</li>
              <li>• Set realistic budgets for each currency</li>
              <li>• Use the category breakdown to see where you're spending most</li>
              <li>• Compare spending across places to plan future trips</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
