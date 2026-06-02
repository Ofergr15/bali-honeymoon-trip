import { useState } from 'react';
import { Upload, FileText, Sparkles, Check, X, Edit2, Trash2, Download } from 'lucide-react';
import type { TripData } from '../types/trip';

interface ExpenseImporterProps {
  tripData: TripData;
  onImport: (expenses: ParsedExpense[]) => void;
}

export interface ParsedExpense {
  id: string;
  rawText: string;
  date?: string;
  day?: number;
  place?: string;
  category: 'hotel' | 'food' | 'activity' | 'transport' | 'flight' | 'visa' | 'shopping' | 'food-misc' | 'unidentified';
  description: string;
  amount: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'pending' | 'confirmed' | 'edited' | 'rejected';
  validationError?: string;
}

const CATEGORIES = [
  { value: 'flight', label: '✈️ Flight', color: '#6366F1' },
  { value: 'visa', label: '🛂 Visa', color: '#8B5CF6' },
  { value: 'hotel', label: '🏨 Hotel / Accommodation', color: '#3B82F6' },
  { value: 'transport', label: '🚗 Transportation', color: '#F59E0B' },
  { value: 'food', label: '🍽️ Food', color: '#EF4444' },
  { value: 'activity', label: '🎯 Attractions / Activities', color: '#10B981' },
  { value: 'shopping', label: '🛍️ Shopping', color: '#EC4899' },
  { value: 'food-misc', label: '🍴 Food + Attractions + Misc', color: '#F97316' },
  { value: 'unidentified', label: '❓ Unidentified (requires description)', color: '#6B7280' },
] as const;

const PLACES = [
  { value: 'Bangkok', emoji: '🇹🇭' },
  { value: 'Canggu', emoji: '🏖️' },
  { value: 'Sidemen', emoji: '🌾' },
  { value: 'Ubud', emoji: '🌿' },
  { value: 'Uluwatu', emoji: '🌅' },
  { value: 'Gili Trawangan', emoji: '🏝️' },
  { value: 'Gili Air', emoji: '🌊' },
  { value: 'Nusa Lembongan', emoji: '⛰️' },
  { value: 'Kuta', emoji: '🏄' },
  { value: 'Komodo', emoji: '🐉' },
];

export default function ExpenseImporter({ tripData, onImport }: ExpenseImporterProps) {
  const [rawInput, setRawInput] = useState('');
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // AI-powered expense parser
  const analyzeExpenses = async () => {
    if (!rawInput.trim()) return;

    setIsAnalyzing(true);

    // Simulate AI processing (in real app, call an API or use local model)
    setTimeout(() => {
      const lines = rawInput.split('\n').filter(line => line.trim());
      const parsed: ParsedExpense[] = lines.map((line, index) => {
        return parseExpenseLine(line, index);
      });

      setParsedExpenses(parsed);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Smart parser for expense lines
  const parseExpenseLine = (line: string, index: number): ParsedExpense => {
    const lowerLine = line.toLowerCase();

    // Extract amount and currency (including ILS symbol)
    const amountMatch = line.match(/(\d+[,.]?\d*)\s*(usd|idr|thb|eur|ils|₪|\$|฿)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 0;
    const currency = amountMatch ? detectCurrency(amountMatch[2]) : 'ILS'; // Default to ILS

    // Extract date if present
    const dateMatch = line.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](?:\d{2}|\d{4}))/);
    const date = dateMatch ? dateMatch[1] : undefined;

    // Detect category
    let category: ParsedExpense['category'] = 'unidentified';
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Check for visa first
    if (lowerLine.includes('visa') || lowerLine.includes('ויזה')) {
      category = 'visa';
      confidence = 'high';
    }
    // Check for flights
    else if (lowerLine.includes('flight') || lowerLine.includes('airline') || lowerLine.includes('airasia') || lowerLine.includes('garuda') || lowerLine.includes('thai air') || lowerLine.includes('טיסה')) {
      category = 'flight';
      confidence = 'high';
    }
    // Check for hotel
    else if (lowerLine.includes('hotel') || lowerLine.includes('resort') || lowerLine.includes('villa') || lowerLine.includes('accommodation') || lowerLine.includes('מלון')) {
      category = 'hotel';
      confidence = 'high';
    }
    // Check for transportation
    else if (lowerLine.includes('taxi') || lowerLine.includes('grab') || lowerLine.includes('uber') || lowerLine.includes('driver') || lowerLine.includes('scooter') || lowerLine.includes('rental') || lowerLine.includes('boat') || lowerLine.includes('transfer') || lowerLine.includes('תחבורה')) {
      category = 'transport';
      confidence = 'high';
    }
    // Check for food
    else if (lowerLine.includes('restaurant') || lowerLine.includes('cafe') || lowerLine.includes('food') || lowerLine.includes('warung') || lowerLine.includes('dinner') || lowerLine.includes('lunch') || lowerLine.includes('breakfast') || lowerLine.includes('אוכל') || lowerLine.includes('מסעדה')) {
      category = 'food';
      confidence = 'high';
    }
    // Check for activities
    else if (lowerLine.includes('tour') || lowerLine.includes('ticket') || lowerLine.includes('entrance') || lowerLine.includes('temple') || lowerLine.includes('spa') || lowerLine.includes('massage') || lowerLine.includes('snorkel') || lowerLine.includes('dive') || lowerLine.includes('attraction') || lowerLine.includes('אטרקציה')) {
      category = 'activity';
      confidence = 'high';
    }
    // Check for shopping
    else if (lowerLine.includes('shop') || lowerLine.includes('market') || lowerLine.includes('souvenir') || lowerLine.includes('mall') || lowerLine.includes('קניות')) {
      category = 'shopping';
      confidence = 'medium';
    }
    // Default to food-misc for unidentifiable small expenses
    else if (amount > 0 && amount < 100) {
      category = 'food-misc';
      confidence = 'low';
    }

    // Detect place
    let place: string | undefined;
    for (const p of PLACES) {
      if (lowerLine.includes(p.value.toLowerCase())) {
        place = p.value;
        confidence = 'high';
        break;
      }
    }

    // Try to match day based on date
    let day: number | undefined;
    if (date && tripData.startDate) {
      // Simple day calculation (can be improved)
      const tripStart = new Date(tripData.startDate);
      const expenseDate = parseDate(date);
      if (expenseDate) {
        const daysDiff = Math.floor((expenseDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < tripData.days.length) {
          day = daysDiff + 1;
        }
      }
    }

    const expense: ParsedExpense = {
      id: `expense-${index}-${Date.now()}`,
      rawText: line,
      date,
      day,
      place,
      category,
      description: cleanDescription(line),
      amount,
      currency,
      confidence,
      status: 'pending',
    };

    // Validate the expense
    expense.validationError = validateExpense(expense);

    return expense;
  };

  const detectCurrency = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('ils') || lower.includes('₪')) return 'ILS';
    if (lower.includes('usd') || lower.includes('$')) return 'USD';
    if (lower.includes('idr') || lower.includes('rp')) return 'IDR';
    if (lower.includes('thb') || lower.includes('฿')) return 'THB';
    if (lower.includes('eur') || lower.includes('€')) return 'EUR';
    return 'ILS'; // Default to ILS
  };

  const cleanDescription = (text: string): string => {
    // Remove amounts and dates for cleaner description
    return text
      .replace(/\d+[,.]?\d*\s*(usd|idr|thb|eur|ils|₪|\$|฿)/gi, '')
      .replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](?:\d{2}|\d{4})/g, '')
      .trim();
  };

  const parseDate = (dateStr: string): Date | null => {
    // Simple date parser (can be improved)
    try {
      const parts = dateStr.split(/[\/\-\.]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year < 100 ? 2000 + year : year, month, day);
      }
    } catch {
      return null;
    }
    return null;
  };

  // Validate expense based on rules
  const validateExpense = (expense: ParsedExpense): string | undefined => {
    // Convert to ILS if needed for validation (approximate)
    const amountInILS = expense.currency === 'ILS' || expense.currency === '₪'
      ? expense.amount
      : expense.currency === 'USD'
        ? expense.amount * 3.5 // Rough conversion
        : expense.currency === 'IDR'
          ? expense.amount * 0.00023 // Rough conversion
          : expense.currency === 'THB'
            ? expense.amount * 0.1 // Rough conversion
            : expense.amount;

    // Rule: Expenses over ₪100 cannot be unidentified without description
    if (amountInILS > 100) {
      if (expense.category === 'unidentified' || expense.category === 'food-misc') {
        if (!expense.description || expense.description.trim().length < 3) {
          return `⚠️ Expenses over ₪100 require a clear description`;
        }
      }
    }

    return undefined;
  };

  const updateExpense = (id: string, updates: Partial<ParsedExpense>) => {
    setParsedExpenses(prev =>
      prev.map(exp => {
        if (exp.id === id) {
          const updated = { ...exp, ...updates, status: 'edited' as const };
          // Validate after update
          updated.validationError = validateExpense(updated);
          return updated;
        }
        return exp;
      })
    );
  };

  const confirmExpense = (id: string) => {
    const expense = parsedExpenses.find(e => e.id === id);
    if (expense?.validationError) {
      alert(expense.validationError);
      return;
    }
    updateExpense(id, { status: 'confirmed' });
  };

  const rejectExpense = (id: string) => {
    updateExpense(id, { status: 'rejected' });
  };

  const deleteExpense = (id: string) => {
    setParsedExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const confirmAll = () => {
    // Check if any expenses have validation errors
    const invalidExpenses = parsedExpenses.filter(e => e.validationError);
    if (invalidExpenses.length > 0) {
      alert(`⚠️ Cannot confirm all expenses\n\n${invalidExpenses.length} expense(s) have validation errors:\n\n${invalidExpenses.map(e => `• ${e.description}: ${e.validationError}`).join('\n')}`);
      return;
    }

    setParsedExpenses(prev =>
      prev.map(exp => ({ ...exp, status: 'confirmed' as const }))
    );
  };

  const handleImport = () => {
    const confirmed = parsedExpenses.filter(exp => exp.status === 'confirmed' || exp.status === 'edited');
    onImport(confirmed);
    setRawInput('');
    setParsedExpenses([]);
  };

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || '#6B7280';
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || '📍 Other';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 border-2 border-purple-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ✨ AI-Powered Expense Import
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Paste your expense report below. Our AI will automatically categorize each expense by type, location, and day. Review and edit suggestions before importing.
            </p>
            <div className="bg-white/80 rounded-lg p-3 mb-3 border border-purple-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">📋 Expense Rules:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Couple budget:</strong> All expenses tracked together (not split)</li>
                <li>• <strong>Expenses over ₪100:</strong> Must have clear description (cannot be unidentified)</li>
                <li>• <strong>Categories:</strong> Flight, Visa, Hotel, Transport, Food, Activities, Shopping</li>
                <li>• <strong>Small unidentifiable:</strong> Can use "Food + Attractions + Misc"</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <span
                  key={cat.value}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-white"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      {parsedExpenses.length === 0 && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Paste Your Expense Data
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Examples:
Flight Tel Aviv → Bangkok ₪4,370
Visa for both ₪7,239
15/05/2026 Hotel Ubud Resort - 150 USD
16/05/2026 Warung lunch 12.50 USD
17/05/2026 Grab taxi 5 USD
18/05/2026 Snorkeling Gili T 45 USD

Any format works - paste from bank statement, spreadsheet, or type manually
Supports: ₪ (ILS), USD, IDR, THB, EUR"
              className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={analyzeExpenses}
            disabled={!rawInput.trim() || isAnalyzing}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze & Categorize Expenses
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview Table */}
      {parsedExpenses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              Review & Edit ({parsedExpenses.length} expenses)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={confirmAll}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm All
              </button>
              <button
                onClick={() => setParsedExpenses([])}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Place</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parsedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className={`
                        ${expense.status === 'rejected' ? 'opacity-40 bg-red-50' : ''}
                        ${expense.status === 'confirmed' ? 'bg-green-50' : ''}
                        ${expense.status === 'edited' ? 'bg-yellow-50' : ''}
                        ${expense.validationError ? 'border-l-4 border-red-500 bg-red-50/50' : ''}
                        hover:bg-gray-50 transition-colors
                      `}
                    >
                      <td className="px-4 py-3">
                        {expense.validationError ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700" title={expense.validationError}>
                            ❌ Error
                          </span>
                        ) : expense.confidence === 'high' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                            <Check className="w-3 h-3" /> High
                          </span>
                        ) : expense.confidence === 'medium' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700">
                            ⚠️ Medium
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700">
                            ⚠️ Low
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={expense.date || ''}
                          onChange={(e) => updateExpense(expense.id, { date: e.target.value })}
                          placeholder="DD/MM/YYYY"
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={expense.day || ''}
                          onChange={(e) => updateExpense(expense.id, { day: parseInt(e.target.value) || undefined })}
                          placeholder="Day"
                          min="1"
                          max={tripData.days.length}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={expense.place || ''}
                          onChange={(e) => updateExpense(expense.id, { place: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select...</option>
                          {PLACES.map(p => (
                            <option key={p.value} value={p.value}>
                              {p.emoji} {p.value}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={expense.category}
                          onChange={(e) => updateExpense(expense.id, { category: e.target.value as any })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          style={{ color: getCategoryColor(expense.category) }}
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={expense.description}
                            onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                            placeholder={expense.validationError ? "Required!" : "Description..."}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-purple-500 ${
                              expense.validationError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {expense.validationError && (
                            <div className="absolute top-full left-0 mt-1 text-xs text-red-600 whitespace-nowrap bg-red-50 px-2 py-1 rounded border border-red-200 shadow-sm z-10">
                              {expense.validationError}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            step="0.01"
                            className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <select
                            value={expense.currency}
                            onChange={(e) => updateExpense(expense.id, { currency: e.target.value })}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="ILS">₪</option>
                            <option value="USD">$</option>
                            <option value="IDR">IDR</option>
                            <option value="THB">฿</option>
                            <option value="EUR">€</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {expense.status !== 'confirmed' && (
                            <button
                              onClick={() => confirmExpense(expense.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="Confirm"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Button */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
            <div className="text-sm text-gray-600">
              <strong>{parsedExpenses.filter(e => e.status === 'confirmed' || e.status === 'edited').length}</strong> expenses ready to import
            </div>
            <button
              onClick={handleImport}
              disabled={parsedExpenses.filter(e => e.status === 'confirmed' || e.status === 'edited').length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Import to Trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
