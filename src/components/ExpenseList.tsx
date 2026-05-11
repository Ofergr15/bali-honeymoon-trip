import type { DayExpense } from '../types/trip';
import { Trash2 } from 'lucide-react';

interface ExpenseListProps {
  expenses: DayExpense[];
  onDelete?: (expenseId: string) => void;
  canEdit?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  THB: '฿',
  IDR: 'Rp',
  ILS: '₪',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏨',
  activities: '🎯',
  shopping: '🛍️',
  other: '💰',
};

export default function ExpenseList({ expenses, onDelete, canEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No expenses recorded yet
      </div>
    );
  }

  // Group expenses by currency
  const totalsByCurrency = expenses.reduce((acc, expense) => {
    acc[expense.currency] = (acc[expense.currency] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">
                {CATEGORY_EMOJIS[expense.category] || '💰'}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {expense.description}
              </span>
            </div>
            <div className="text-xs text-gray-500 ml-7">
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {CURRENCY_SYMBOLS[expense.currency] || expense.currency}{' '}
                {expense.amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {canEdit && onDelete && (
              <button
                onClick={() => onDelete(expense.id)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete expense"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Total Summary */}
      <div className="border-t border-gray-200 pt-3 mt-4">
        <div className="text-sm font-semibold text-gray-700 mb-2">Total</div>
        {Object.entries(totalsByCurrency).map(([currency, total]) => (
          <div
            key={currency}
            className="flex justify-between text-sm font-medium text-gray-900 mb-1"
          >
            <span>{currency}</span>
            <span>
              {CURRENCY_SYMBOLS[currency] || currency}{' '}
              {total.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
