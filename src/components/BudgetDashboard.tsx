import { useState } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Calendar, MapPin, PieChart, BarChart3, Target, AlertTriangle, Check, Edit2 } from 'lucide-react';
import type { TripData, DayExpense } from '../types/trip';

interface BudgetDashboardProps {
  tripData: TripData;
  onClose: () => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', emoji: '🍽️', color: '#EF4444' },
  { id: 'transport', name: 'Transportation', emoji: '🚗', color: '#3B82F6' },
  { id: 'activities', name: 'Activities', emoji: '🎯', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#F59E0B' },
  { id: 'accommodation', name: 'Accommodation', emoji: '🏨', color: '#8B5CF6' },
  { id: 'other', name: 'Other', emoji: '💰', color: '#6B7280' },
];

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

export default function BudgetDashboard({ tripData, onClose }: BudgetDashboardProps) {
  const [budget, setBudget] = useState<{ [currency: string]: number }>({
    USD: 5000,
    IDR: 50000000,
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState({ ...budget });
  const [selectedView, setSelectedView] = useState<'overview' | 'daily' | 'categories' | 'places' | 'trends'>('overview');

  // Get all expenses
  const allExpenses = tripData.days.flatMap(d => d.expenses || []);

  // Calculate total by currency
  const totalByCurrency = allExpenses.reduce((acc, exp) => {
    if (!acc[exp.currency]) acc[exp.currency] = 0;
    acc[exp.currency] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate by category
  const categoryData = EXPENSE_CATEGORIES.map(cat => {
    const expenses = allExpenses.filter(e => e.category === cat.id);
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    return { ...cat, totals, expenses, count: expenses.length };
  });

  // Calculate by place
  const placeData = PLACES.map(place => {
    const daysInPlace = tripData.days.filter(d => d.day >= place.dayStart && d.day <= place.dayEnd);
    const expenses = daysInPlace.flatMap(d => d.expenses || []);
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    const daysCount = place.dayEnd - place.dayStart + 1;
    const avgPerDay: Record<string, number> = {};
    Object.entries(totals).forEach(([currency, total]) => {
      avgPerDay[currency] = total / daysCount;
    });
    return { ...place, totals, expenses, avgPerDay, count: expenses.length, daysCount };
  });

  // Calculate daily breakdown
  const dailyData = tripData.days.map(day => {
    const expenses = day.expenses || [];
    const totals: Record<string, number> = {};
    expenses.forEach(e => {
      if (!totals[e.currency]) totals[e.currency] = 0;
      totals[e.currency] += e.amount;
    });
    const place = PLACES.find(p => day.day >= p.dayStart && day.day <= p.dayEnd);
    return { ...day, totals, expenseCount: expenses.length, place };
  });

  // Calculate trends (last 7 days vs previous 7 days)
  const last7Days = dailyData.slice(-7);
  const previous7Days = dailyData.slice(-14, -7);
  const last7Total: Record<string, number> = {};
  const previous7Total: Record<string, number> = {};

  last7Days.forEach(day => {
    Object.entries(day.totals).forEach(([currency, amount]) => {
      if (!last7Total[currency]) last7Total[currency] = 0;
      last7Total[currency] += amount;
    });
  });

  previous7Days.forEach(day => {
    Object.entries(day.totals).forEach(([currency, amount]) => {
      if (!previous7Total[currency]) previous7Total[currency] = 0;
      previous7Total[currency] += amount;
    });
  });

  const trendData: Record<string, { change: number; direction: 'up' | 'down' | 'same' }> = {};
  Object.keys({ ...last7Total, ...previous7Total }).forEach(currency => {
    const last = last7Total[currency] || 0;
    const prev = previous7Total[currency] || 0;
    const change = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    trendData[currency] = {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    };
  });

  // Top spending days
  const topSpendingDays = [...dailyData]
    .sort((a, b) => {
      const aTotal = Object.values(a.totals).reduce((sum, v) => sum + v, 0);
      const bTotal = Object.values(b.totals).reduce((sum, v) => sum + v, 0);
      return bTotal - aTotal;
    })
    .slice(0, 5);

  // Calculate projections
  const daysWithExpenses = dailyData.filter(d => d.expenseCount > 0).length;
  const remainingDays = 25 - tripData.days.length;
  const projectedTotal: Record<string, number> = {};

  if (daysWithExpenses > 0) {
    Object.entries(totalByCurrency).forEach(([currency, total]) => {
      const dailyAvg = total / daysWithExpenses;
      projectedTotal[currency] = total + (dailyAvg * remainingDays);
    });
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
    return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const handleSaveBudget = () => {
    setBudget(tempBudget);
    setEditingBudget(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-travel-teal to-cyan-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Budget & Expense Analytics
            </h1>
            <p className="text-cyan-100 text-sm mt-1">Comprehensive financial tracking for your Bali honeymoon</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/30 rounded-xl transition-all shadow-lg bg-white/20 backdrop-blur-sm"
            title="Close dashboard"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'daily', label: 'Daily Breakdown', icon: '📅' },
            { id: 'categories', label: 'Categories', icon: '🏷️' },
            { id: 'places', label: 'By Location', icon: '📍' },
            { id: 'trends', label: 'Trends & Insights', icon: '📈' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedView === tab.id
                  ? 'border-travel-teal text-travel-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview */}
          {selectedView === 'overview' && (
            <div className="space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Spent */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-purple-100">Total Spent</h3>
                    <DollarSign className="w-6 h-6 text-purple-100" />
                  </div>
                  {Object.entries(totalByCurrency).map(([currency, total]) => (
                    <div key={currency} className="mb-2">
                      <p className="text-3xl font-bold">{formatCurrency(total, currency)}</p>
                      <p className="text-sm text-purple-100">{currency}</p>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-purple-300">
                    <p className="text-sm text-purple-100">{allExpenses.length} transactions</p>
                  </div>
                </div>

                {/* Budget Status */}
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-teal-100">Budget Status</h3>
                    <Target className="w-6 h-6 text-teal-100" />
                  </div>
                  {editingBudget ? (
                    <div className="space-y-2">
                      {Object.keys(budget).map(currency => (
                        <input
                          key={currency}
                          type="number"
                          placeholder={currency}
                          value={tempBudget[currency] || ''}
                          onChange={(e) => setTempBudget({ ...tempBudget, [currency]: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded text-gray-900 text-sm"
                        />
                      ))}
                      <button
                        onClick={handleSaveBudget}
                        className="w-full px-3 py-2 bg-white text-teal-600 rounded font-medium text-sm hover:bg-teal-50"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      {Object.entries(budget).map(([currency, budgetAmount]) => {
                        const spent = totalByCurrency[currency] || 0;
                        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                        const remaining = budgetAmount - spent;
                        return (
                          <div key={currency} className="mb-2">
                            <p className="text-2xl font-bold">{percentage.toFixed(0)}%</p>
                            <p className="text-sm text-teal-100">{currency} budget used</p>
                            <p className="text-xs text-teal-100 mt-1">
                              {remaining > 0 ? `${formatCurrency(remaining, currency)} left` : `Over by ${formatCurrency(Math.abs(remaining), currency)}`}
                            </p>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => {
                          setEditingBudget(true);
                          setTempBudget(budget);
                        }}
                        className="mt-3 text-sm text-teal-100 hover:text-white flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit Budget
                      </button>
                    </>
                  )}
                </div>

                {/* Daily Average */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-orange-100">Daily Average</h3>
                    <Calendar className="w-6 h-6 text-orange-100" />
                  </div>
                  {Object.entries(totalByCurrency).map(([currency, total]) => {
                    const avg = daysWithExpenses > 0 ? total / daysWithExpenses : 0;
                    return (
                      <div key={currency} className="mb-2">
                        <p className="text-3xl font-bold">{formatCurrency(avg, currency)}</p>
                        <p className="text-sm text-orange-100">{currency} per day</p>
                      </div>
                    );
                  })}
                  <div className="mt-4 pt-4 border-t border-orange-300">
                    <p className="text-sm text-orange-100">{daysWithExpenses} days tracked</p>
                  </div>
                </div>
              </div>

              {/* Budget Progress Bars */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-travel-teal" />
                  Budget Tracking
                </h3>
                <div className="space-y-4">
                  {Object.entries(budget).map(([currency, budgetAmount]) => {
                    const spent = totalByCurrency[currency] || 0;
                    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                    const remaining = budgetAmount - spent;
                    const isOverBudget = remaining < 0;

                    return (
                      <div key={currency}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-gray-900 text-lg">{currency}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {formatCurrency(spent, currency)} / {formatCurrency(budgetAmount, currency)}
                            </span>
                          </div>
                          <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                            {isOverBudget ? `Over ${formatCurrency(Math.abs(remaining), currency)}` : `${formatCurrency(remaining, currency)} left`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 flex items-center justify-end px-2 ${
                              isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          >
                            <span className="text-xs font-bold text-white">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Category Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoryData.map(cat => {
                  const totalAmount = Object.values(cat.totals).reduce((sum, v) => sum + v, 0);
                  return (
                    <div
                      key={cat.id}
                      className="border-2 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer"
                      style={{ borderColor: `${cat.color}40`, backgroundColor: `${cat.color}05` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">{cat.emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900">{cat.name}</h4>
                          <p className="text-xs text-gray-500">{cat.count} transactions</p>
                        </div>
                      </div>
                      {Object.entries(cat.totals).map(([currency, total]) => (
                        <p key={currency} className="text-lg font-bold" style={{ color: cat.color }}>
                          {formatCurrency(total, currency)}
                        </p>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Projections */}
              {remainingDays > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Spending Projection
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your current spending pattern, here's the projected total for the entire trip:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(projectedTotal).map(([currency, projected]) => {
                      const current = totalByCurrency[currency] || 0;
                      const budgetAmount = budget[currency] || 0;
                      const willExceed = projected > budgetAmount;

                      return (
                        <div key={currency} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700">{currency}</span>
                            {willExceed && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                          </div>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(projected, currency)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Current: {formatCurrency(current, currency)} • Budget: {formatCurrency(budgetAmount, currency)}
                          </p>
                          {willExceed && (
                            <p className="text-xs text-orange-600 font-medium mt-2">
                              ⚠️ May exceed budget by {formatCurrency(projected - budgetAmount, currency)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    * Based on {daysWithExpenses} days of tracked expenses, with {remainingDays} days remaining
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Daily Breakdown */}
          {selectedView === 'daily' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Expense Breakdown</h2>
              {dailyData.map(day => (
                <div
                  key={day.day}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    day.expenseCount > 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-gray-900">Day {day.day}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        {day.place && (
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ backgroundColor: `${day.place.color}20`, color: day.place.color }}
                          >
                            {day.place.emoji} {day.place.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{day.title}</p>
                      {day.expenseCount > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {Object.entries(day.totals).map(([currency, total]) => (
                            <div key={currency}>
                              <span className="text-xl font-bold text-travel-teal">
                                {formatCurrency(total, currency)}
                              </span>
                              <span className="text-xs text-gray-500 ml-1">{currency}</span>
                            </div>
                          ))}
                          <span className="text-sm text-gray-500">• {day.expenseCount} transactions</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No expenses recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories */}
          {selectedView === 'categories' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Spending by Category</h2>
              {categoryData.map(cat => (
                <div
                  key={cat.id}
                  className="border-2 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  style={{ borderColor: `${cat.color}40` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{cat.emoji}</span>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{cat.name}</h3>
                        <p className="text-sm text-gray-500">{cat.count} transactions</p>
                      </div>
                    </div>
                    {Object.entries(cat.totals).map(([currency, total]) => (
                      <div key={currency} className="text-right">
                        <p className="text-3xl font-bold" style={{ color: cat.color }}>
                          {formatCurrency(total, currency)}
                        </p>
                        <p className="text-sm text-gray-500">{currency}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top expenses in this category */}
                  {cat.expenses.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Transactions:</h4>
                      <div className="space-y-2">
                        {cat.expenses.slice(0, 5).map((expense, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{expense.description}</span>
                            <span className="font-medium" style={{ color: cat.color }}>
                              {formatCurrency(expense.amount, expense.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* By Location */}
          {selectedView === 'places' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Spending by Location</h2>
              {placeData.map(place => (
                <div
                  key={place.name}
                  className="border-l-4 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
                  style={{ borderColor: place.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{place.emoji}</span>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{place.name}</h3>
                        <p className="text-sm text-gray-500">
                          Days {place.dayStart}-{place.dayEnd} • {place.daysCount} days • {place.count} transactions
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Total Spent</p>
                      {Object.entries(place.totals).map(([currency, total]) => (
                        <div key={currency} className="mb-1">
                          <span className="text-2xl font-bold" style={{ color: place.color }}>
                            {formatCurrency(total, currency)}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">{currency}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">Average Per Day</p>
                      {Object.entries(place.avgPerDay).map(([currency, avg]) => (
                        <div key={currency} className="mb-1">
                          <span className="text-2xl font-bold text-gray-700">
                            {formatCurrency(avg, currency)}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">{currency}/day</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category breakdown for this place */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Spending Breakdown:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {EXPENSE_CATEGORIES.map(cat => {
                        const placeExpenses = place.expenses.filter(e => e.category === cat.id);
                        if (placeExpenses.length === 0) return null;
                        const total = placeExpenses.reduce((sum, e) => sum + e.amount, 0);
                        return (
                          <div key={cat.id} className="text-center p-2 bg-gray-50 rounded">
                            <span className="text-xl">{cat.emoji}</span>
                            <p className="text-xs text-gray-500 mt-1">{cat.name}</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{placeExpenses.length}x</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trends & Insights */}
          {selectedView === 'trends' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Trends & Insights</h2>

              {/* Spending Trend */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-travel-teal" />
                  7-Day Spending Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(trendData).map(([currency, data]) => (
                    <div key={currency} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-700">{currency}</span>
                        {data.direction === 'up' ? (
                          <TrendingUp className="w-5 h-5 text-red-500" />
                        ) : data.direction === 'down' ? (
                          <TrendingDown className="w-5 h-5 text-green-500" />
                        ) : (
                          <Check className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{data.change.toFixed(1)}%</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {data.direction === 'up' ? 'Increase' : data.direction === 'down' ? 'Decrease' : 'No change'} vs previous week
                      </p>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last 7 days:</span>
                          <span className="font-medium">{formatCurrency(last7Total[currency] || 0, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Previous 7 days:</span>
                          <span className="font-medium">{formatCurrency(previous7Total[currency] || 0, currency)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Spending Days */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-travel-teal" />
                  Top 5 Spending Days
                </h3>
                <div className="space-y-3">
                  {topSpendingDays.map((day, idx) => {
                    const totalAmount = Object.values(day.totals).reduce((sum, v) => sum + v, 0);
                    if (totalAmount === 0) return null;
                    return (
                      <div key={day.day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-travel-teal text-white font-bold text-sm">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Day {day.day}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {day.place && (
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: `${day.place.color}20`, color: day.place.color }}
                              >
                                {day.place.emoji} {day.place.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{day.expenseCount} transactions</p>
                        </div>
                        <div className="text-right">
                          {Object.entries(day.totals).map(([currency, total]) => (
                            <p key={currency} className="text-lg font-bold text-travel-teal">
                              {formatCurrency(total, currency)}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Money Saving Tips
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• Most expensive location: {placeData.sort((a, b) => {
                      const aTotal = Object.values(a.totals).reduce((sum, v) => sum + v, 0);
                      const bTotal = Object.values(b.totals).reduce((sum, v) => sum + v, 0);
                      return bTotal - aTotal;
                    })[0]?.name || 'N/A'}</li>
                    <li>• Most expensive category: {categoryData.sort((a, b) => {
                      const aTotal = Object.values(a.totals).reduce((sum, v) => sum + v, 0);
                      const bTotal = Object.values(b.totals).reduce((sum, v) => sum + v, 0);
                      return bTotal - aTotal;
                    })[0]?.name || 'N/A'}</li>
                    <li>• Consider budgeting more for peak spending categories</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Quick Stats
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Days with expenses: {daysWithExpenses} / {tripData.days.length}</li>
                    <li>• Average transactions per day: {(allExpenses.length / daysWithExpenses).toFixed(1)}</li>
                    <li>• Most active day: {topSpendingDays[0] ? `Day ${topSpendingDays[0].day}` : 'N/A'}</li>
                    <li>• Tracking {Object.keys(totalByCurrency).length} currencies</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
