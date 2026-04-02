import { useState } from 'react';
import { Plus, Trash2, DollarSign, Tag, Calendar } from 'lucide-react';
import type { TripData, DayExpense } from '../types/trip';

interface DailyExpensesTrackerProps {
  tripData: TripData;
  onUpdateExpenses: (dayNumber: number, expenses: DayExpense[]) => void;
}

const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Drinks', emoji: '🍽️', color: '#EF4444' },
  { id: 'transport', name: 'Transportation', emoji: '🚗', color: '#3B82F6' },
  { id: 'activities', name: 'Activities', emoji: '🎯', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', color: '#F59E0B' },
  { id: 'accommodation', name: 'Accommodation', emoji: '🏨', color: '#8B5CF6' },
  { id: 'other', name: 'Other', emoji: '💰', color: '#6B7280' },
];

const CURRENCIES = ['USD', 'IDR', 'EUR', 'GBP'];

export default function DailyExpensesTracker({ tripData, onUpdateExpenses }: DailyExpensesTrackerProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'food',
    description: '',
    amount: '',
    currency: 'USD',
  });

  const currentDay = tripData.days.find(d => d.day === selectedDay);
  const expenses = currentDay?.expenses || [];

  // Calculate totals by currency
  const totalsByCurrency = expenses.reduce((acc, exp) => {
    if (!acc[exp.currency]) {
      acc[exp.currency] = 0;
    }
    acc[exp.currency] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total for all days
  const allExpenses = tripData.days.flatMap(d => d.expenses || []);
  const grandTotalByCurrency = allExpenses.reduce((acc, exp) => {
    if (!acc[exp.currency]) {
      acc[exp.currency] = 0;
    }
    acc[exp.currency] += exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill in description and amount');
      return;
    }

    const expense: DayExpense = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      currency: newExpense.currency,
    };

    const updatedExpenses = [...expenses, expense];
    onUpdateExpenses(selectedDay, updatedExpenses);

    // Reset form
    setNewExpense({
      category: 'food',
      description: '',
      amount: '',
      currency: 'USD',
    });
    setShowAddForm(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Delete this expense?')) {
      const updatedExpenses = expenses.filter(e => e.id !== expenseId);
      onUpdateExpenses(selectedDay, updatedExpenses);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || EXPENSE_CATEGORIES[5];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Daily Expenses
          </h3>
          <p className="text-sm text-gray-600 mt-1">Track your spending</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-2 bg-travel-teal text-white rounded-lg hover:bg-[#0c8c8c] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Grand Total */}
      <div className="mb-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
        <p className="text-xs font-medium text-gray-600 mb-1">Total Trip Expenses</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(grandTotalByCurrency).map(([currency, total]) => (
            <div key={currency} className="flex items-center gap-1">
              <span className="text-xl font-bold text-travel-teal">
                {currency === 'USD' && '$'}
                {currency === 'EUR' && '€'}
                {currency === 'GBP' && '£'}
                {total.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-gray-600">{currency}</span>
            </div>
          ))}
          {Object.keys(grandTotalByCurrency).length === 0 && (
            <span className="text-sm text-gray-500">No expenses yet</span>
          )}
        </div>
      </div>

      {/* Day Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
        >
          {tripData.days.map(day => (
            <option key={day.day} value={day.day}>
              Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">New Expense</h4>

          {/* Category */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    newExpense.category === cat.id
                      ? 'border-travel-teal bg-travel-teal/10 scale-105 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                  }`}
                  style={newExpense.category === cat.id ? {
                    borderColor: cat.color,
                    backgroundColor: `${cat.color}15`
                  } : {}}
                >
                  <span className={`text-2xl block ${newExpense.category === cat.id ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s', animationIterationCount: '1' }}>
                    {cat.emoji}
                  </span>
                  <span className={`text-xs block mt-1 font-medium ${newExpense.category === cat.id ? 'text-gray-900' : 'text-gray-600'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="e.g., Lunch at Locavore"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={newExpense.currency}
                onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-travel-teal focus:border-travel-teal"
              >
                {CURRENCIES.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddExpense}
              className="flex-1 px-4 py-2 bg-travel-teal text-white rounded-lg hover:bg-[#0c8c8c] transition-colors font-medium"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Day Total */}
      {Object.keys(totalsByCurrency).length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-1">Day {selectedDay} Total</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsByCurrency).map(([currency, total]) => (
              <span key={currency} className="text-lg font-bold text-gray-900">
                {currency === 'USD' && '$'}
                {currency === 'EUR' && '€'}
                {currency === 'GBP' && '£'}
                {total.toLocaleString()} {currency}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No expenses for this day</p>
            <p className="text-xs mt-1">Click "Add Expense" to start tracking</p>
          </div>
        ) : (
          expenses.map(expense => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <div
                key={expense.id}
                className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                {/* Category Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${catInfo.color}20` }}
                >
                  <span className="text-xl">{catInfo.emoji}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{catInfo.name}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-lg font-bold mt-1" style={{ color: catInfo.color }}>
                    {expense.currency === 'USD' && '$'}
                    {expense.currency === 'EUR' && '€'}
                    {expense.currency === 'GBP' && '£'}
                    {expense.amount.toLocaleString()} {expense.currency}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
