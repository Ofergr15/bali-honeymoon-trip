import { useState } from 'react';
import { Upload, FileText, Sparkles, Check, X, Edit2, Trash2, Download, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [showManualForm, setShowManualForm] = useState(false);
  const [importMode, setImportMode] = useState<'paste' | 'file' | 'manual'>('paste');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);

  // Filters for reviewing expenses
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'errors' | 'unconfirmed' | 'confirmed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [groupByMerchant, setGroupByMerchant] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Manual form state
  const [manualExpense, setManualExpense] = useState({
    date: '',
    day: undefined as number | undefined,
    place: '',
    category: 'food' as ParsedExpense['category'],
    description: '',
    amount: 0,
    currency: 'ILS',
  });

  // Map Israeli credit card categories to our categories
  const mapIsraeliCategory = (hebrewCategory?: string): string => {
    if (!hebrewCategory) return '';

    const categoryMap: Record<string, string> = {
      'תיירות': 'tourism',
      'מלונאות ואירוח': 'hotel',
      'מסעדות': 'food',
      'רכב ותחבורה': 'transport',
      'פנאי בילוי': 'activity',
      'ביטוח ופיננסים': 'other',
      'תקשורת ומחשבים': 'other',
      'רפואה ובריאות': 'other',
      'עמותות ותרומות': 'other',
      'מוסדות': 'other',
      'אופנה': 'shopping',
      'אנרגיה': 'other',
    };

    return categoryMap[hebrewCategory] || '';
  };

  // Auto-calculate trip day from date
  const calculateTripDay = (dateStr: string): number | undefined => {
    if (!dateStr || !tripData.startDate) return undefined;

    const expenseDate = new Date(dateStr);
    const tripStart = new Date(tripData.startDate);

    const daysDiff = Math.floor((expenseDate.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff < tripData.days.length) {
      return daysDiff + 1;
    }

    return undefined;
  };

  // AI-powered expense parser
  const analyzeExpenses = async () => {
    if (!rawInput.trim()) return;

    setIsAnalyzing(true);

    // Simulate AI processing (in real app, call an API or use local model)
    setTimeout(() => {
      const lines = rawInput.split('\n').filter(line => line.trim());
      const allParsed: ParsedExpense[] = lines.map((line, index) => {
        return parseExpenseLine(line, index);
      });

      // Filter to only include expenses within trip dates
      const tripStartDate = new Date(tripData.startDate);
      const tripEndDate = new Date(tripData.endDate);

      const filtered = allParsed.filter(expense => {
        if (!expense.date) return true; // Keep expenses without dates

        const expenseDate = parseDate(expense.date);
        if (!expenseDate) return true; // Keep if date couldn't be parsed

        return expenseDate >= tripStartDate && expenseDate <= tripEndDate;
      });

      console.log(`📅 Filtered expenses: ${allParsed.length} total → ${filtered.length} within trip dates (${tripData.startDate} to ${tripData.endDate})`);

      if (filtered.length < allParsed.length) {
        const excluded = allParsed.length - filtered.length;
        alert(`ℹ️ Auto-filtered ${excluded} expense(s) outside trip dates.\n\nTrip dates: ${tripData.startDate} to ${tripData.endDate}\nShowing only expenses within this range.`);
      }

      setParsedExpenses(filtered);
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

  const processFile = async (file: File) => {
    if (!file) return;

    // Store file info
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop() || 'unknown',
    });

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      // Check if it's an Israeli credit card statement (Hebrew headers)
      const isIsraeliCreditCard = file.name.includes('פירוט') || file.name.includes('חיובים');

      if (isIsraeliCreditCard) {
        // Use Israeli credit card parser
        try {
          const { parseIsraeliCreditCard } = await import('../utils/israeliCreditCardParser');
          const transactions = await parseIsraeliCreditCard(file);

          console.log(`✅ Parsed ${transactions.length} transactions from Israeli credit card`);

          // Convert to expense format (one line per transaction)
          const text = transactions.map(t => {
            const category = mapIsraeliCategory(t.category);
            return `${t.date} ${t.merchant} ${t.amount} ₪ ${category || ''}`.trim();
          }).join('\n');

          setRawInput(text);
        } catch (error) {
          console.error('Error parsing Israeli credit card file:', error);
          alert('❌ Error parsing Israeli credit card file. Please make sure it\'s a valid statement from One Zero, CAL, or Isracard.');
          setUploadedFile(null);
        }
      } else {
        // Handle generic Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to text format (each row as a line)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            // Convert to text format: join cells with spaces, rows with newlines
            const text = jsonData
              .filter(row => row.some(cell => cell)) // Skip empty rows
              .map(row => row.join(' '))
              .join('\n');

            setRawInput(text);
          } catch (error) {
            console.error('Error parsing Excel file:', error);
            alert('❌ Error parsing Excel file. Please make sure it\'s a valid .xlsx or .xls file.');
            setUploadedFile(null);
          }
        };

        reader.readAsBinaryString(file);
      }
    } else {
      // Handle text/CSV files
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawInput(text);
      };

      reader.readAsText(file);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if leaving the drop zone itself, not child elements
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's a supported file type
      const supportedTypes = ['.csv', '.txt', '.xls', '.xlsx'];
      const isSupported = supportedTypes.some(type => file.name.toLowerCase().endsWith(type));

      if (isSupported) {
        await processFile(file);
      } else {
        alert('⚠️ Unsupported file type. Please upload .csv, .txt, .xls, or .xlsx files.');
        setUploadedFile(null);
      }
    }
  };

  const handleAddManualExpense = () => {
    // Validate
    if (!manualExpense.description.trim()) {
      alert('⚠️ Please enter a description');
      return;
    }
    if (manualExpense.amount <= 0) {
      alert('⚠️ Please enter a valid amount');
      return;
    }

    // Create new expense
    const newExpense: ParsedExpense = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      rawText: `${manualExpense.description} - ${manualExpense.amount} ${manualExpense.currency}`,
      date: manualExpense.date || undefined,
      day: manualExpense.day,
      place: manualExpense.place || undefined,
      category: manualExpense.category,
      description: manualExpense.description,
      amount: manualExpense.amount,
      currency: manualExpense.currency,
      confidence: 'high',
      status: 'pending',
    };

    // Validate
    newExpense.validationError = validateExpense(newExpense);

    // Add to list
    setParsedExpenses(prev => [...prev, newExpense]);

    // Reset form
    setManualExpense({
      date: '',
      day: undefined,
      place: '',
      category: 'food',
      description: '',
      amount: 0,
      currency: 'ILS',
    });

    // Close form
    setShowManualForm(false);
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
              <p className="text-xs font-semibold text-gray-700 mb-1">📋 How It Works:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li>• <strong>Date:</strong> Enter expense date → Trip day auto-calculated</li>
                <li>• <strong>General expenses:</strong> Flights, visas (not tied to specific day)</li>
                <li>• <strong>Day expenses:</strong> Hotels, food, activities (auto-assigned by date)</li>
                <li>• <strong>Rule:</strong> Expenses over ₪100 must have clear description</li>
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

      {/* Mode Selector */}
      {parsedExpenses.length === 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => {
              setImportMode('paste');
              setShowManualForm(false);
            }}
            className={`py-3 px-4 rounded-xl font-semibold transition-all ${
              importMode === 'paste'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Paste Text
          </button>
          <button
            onClick={() => {
              setImportMode('file');
              setShowManualForm(false);
            }}
            className={`py-3 px-4 rounded-xl font-semibold transition-all ${
              importMode === 'file'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload File
          </button>
          <button
            onClick={() => {
              setImportMode('manual');
              setShowManualForm(true);
            }}
            className={`py-3 px-4 rounded-xl font-semibold transition-all ${
              importMode === 'manual'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add Manually
          </button>
        </div>
      )}

      {/* Manual Form */}
      {parsedExpenses.length === 0 && showManualForm && (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-6 space-y-5">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600" />
            Add Single Expense
          </h3>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={manualExpense.date}
              onChange={(e) => {
                const newDate = e.target.value;
                const calculatedDay = calculateTripDay(newDate);
                setManualExpense({
                  ...manualExpense,
                  date: newDate,
                  day: calculatedDay,
                });
              }}
              min={tripData.startDate}
              max={tripData.endDate}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            />
            <p className="text-xs text-gray-600 mt-2">
              {manualExpense.date && manualExpense.day
                ? `✅ Automatically assigned to Day ${manualExpense.day}: ${tripData.days[manualExpense.day - 1]?.title}`
                : manualExpense.date && !manualExpense.day
                  ? '⚠️ Date is outside trip dates (May 4 - June 2)'
                  : '💡 Select date to auto-assign trip day'
              }
              {(manualExpense.category === 'flight' || manualExpense.category === 'visa') && (
                <span className="block mt-0.5">✈️ Flights/visas are always general expenses</span>
              )}
            </p>
          </div>

          {/* Category - Visual Grid (like DailyExpensesTracker) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.slice(0, 6).map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setManualExpense({ ...manualExpense, category: cat.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    manualExpense.category === cat.value
                      ? 'scale-105 shadow-lg'
                      : 'hover:scale-102 hover:shadow-md'
                  }`}
                  style={manualExpense.category === cat.value ? {
                    borderColor: cat.color,
                    backgroundColor: `${cat.color}20`
                  } : {
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white'
                  }}
                >
                  <span className={`text-3xl block mb-1 ${manualExpense.category === cat.value ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s', animationIterationCount: '1' }}>
                    {cat.label.split(' ')[0]}
                  </span>
                  <span className={`text-xs block font-semibold ${manualExpense.category === cat.value ? 'text-gray-900' : 'text-gray-600'}`}>
                    {cat.label.split(' ').slice(1).join(' ')}
                  </span>
                </button>
              ))}
            </div>
            {/* Additional categories */}
            <div className="mt-2 flex gap-2">
              {CATEGORIES.slice(6).map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setManualExpense({ ...manualExpense, category: cat.value as any })}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    manualExpense.category === cat.value
                      ? 'scale-105 shadow-md'
                      : 'hover:scale-102'
                  }`}
                  style={manualExpense.category === cat.value ? {
                    borderColor: cat.color,
                    backgroundColor: `${cat.color}20`,
                    color: cat.color
                  } : {
                    borderColor: '#E5E7EB',
                    backgroundColor: 'white',
                    color: '#4B5563'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={manualExpense.description}
              onChange={(e) => setManualExpense({ ...manualExpense, description: e.target.value })}
              placeholder="e.g., Lunch at Locavore"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium placeholder:text-gray-400"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={manualExpense.amount || ''}
                onChange={(e) => setManualExpense({ ...manualExpense, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={manualExpense.currency}
                onChange={(e) => setManualExpense({ ...manualExpense, currency: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium text-lg"
              >
                <option value="ILS">₪ ILS</option>
                <option value="USD">$ USD</option>
                <option value="IDR">IDR</option>
                <option value="THB">฿ THB</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          {/* Location (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <select
              value={manualExpense.place}
              onChange={(e) => setManualExpense({ ...manualExpense, place: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
            >
              <option value="">Select location...</option>
              {PLACES.map(p => (
                <option key={p.value} value={p.value}>
                  {p.emoji} {p.value}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowManualForm(false);
                setManualExpense({
                  date: '',
                  day: undefined,
                  place: '',
                  category: 'food',
                  description: '',
                  amount: 0,
                  currency: 'ILS',
                });
              }}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddManualExpense}
              disabled={!manualExpense.description || manualExpense.amount <= 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {parsedExpenses.length === 0 && importMode === 'file' && !uploadedFile && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-100 scale-105 shadow-xl'
                : 'border-blue-300 hover:border-blue-500'
            }`}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 transition-transform ${
              isDragging ? 'text-blue-600 scale-125' : 'text-blue-500'
            }`} />
            <h3 className={`text-lg font-bold mb-2 transition-colors ${
              isDragging ? 'text-blue-700' : 'text-gray-900'
            }`}>
              {isDragging ? '📥 Drop file here!' : '📊 Upload Expense Report'}
            </h3>
            <p className={`text-sm mb-4 transition-colors ${
              isDragging ? 'text-blue-700 font-semibold' : 'text-gray-600'
            }`}>
              {isDragging
                ? 'Release to upload your file'
                : 'Drag & drop or click to upload bank statement, credit card report, or expense spreadsheet'
              }
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".csv,.txt,.xls,.xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Choose File
              </span>
            </label>

            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-xs font-bold text-gray-700">Excel</div>
                <div className="text-xs text-gray-500">.xlsx, .xls</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-2xl mb-1">📄</div>
                <div className="text-xs font-bold text-gray-700">CSV / Text</div>
                <div className="text-xs text-gray-500">.csv, .txt</div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              💡 <strong>Tip:</strong> Export from your bank or credit card as Excel/CSV,
              then upload here. AI will automatically categorize each expense!
            </p>
          </div>
        </div>
      )}

      {/* File Uploaded - Preview & Confirm */}
      {parsedExpenses.length === 0 && importMode === 'file' && uploadedFile && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">File Uploaded Successfully!</h3>
                </div>
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-semibold text-gray-900">📄 {uploadedFile.name}</p>
                  <p className="text-xs text-gray-600">
                    Size: {(uploadedFile.size / 1024).toFixed(1)} KB •
                    Type: {uploadedFile.type.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600">
                    Found {rawInput.split('\n').filter(l => l.trim()).length} lines of data
                  </p>
                </div>

                {/* Preview first few lines */}
                <div className="bg-white rounded-lg p-3 mb-4 border border-green-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">📋 Preview (first 5 lines):</p>
                  <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
                    {rawInput.split('\n').slice(0, 5).join('\n')}
                    {rawInput.split('\n').length > 5 && '\n...'}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setRawInput('');
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ❌ Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsAnalyzing(true);
                      setTimeout(() => {
                        analyzeExpenses();
                        setUploadedFile(null);
                      }, 500);
                    }}
                    disabled={isAnalyzing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        ✨ Analyze with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paste Text Section */}
      {parsedExpenses.length === 0 && importMode === 'paste' && (
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

          {rawInput.trim() && (
            <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                ✅ Ready to analyze: {rawInput.split('\n').filter(l => l.trim()).length} lines
              </p>
            </div>
          )}

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
                ✨ Analyze & Categorize
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview Cards */}
      {parsedExpenses.length > 0 && (
        <div className="space-y-4">
          {/* Header with Stats */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Review & Edit</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {parsedExpenses.filter(e => e.status === 'confirmed' || e.status === 'edited').length} of {parsedExpenses.length} confirmed
                </p>
                <p className="text-xs text-teal-700 mt-0.5 font-semibold">
                  📅 Filtered to trip dates: {new Date(tripData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tripData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmAll}
                  className="px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                >
                  <Check className="w-5 h-5" />
                  Confirm All
                </button>
                <button
                  onClick={() => setParsedExpenses([])}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Stats Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                ❌ {parsedExpenses.filter(e => e.validationError).length} Errors
              </div>
              <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                ⚠️ {parsedExpenses.filter(e => !e.validationError && e.status === 'pending').length} Need Review
              </div>
              <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                ✅ {parsedExpenses.filter(e => e.status === 'confirmed' || e.status === 'edited').length} Confirmed
              </div>
              <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                ✈️ {parsedExpenses.filter(e => !e.day).length} General
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mt-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Expenses</option>
                <option value="errors">❌ Errors Only</option>
                <option value="unconfirmed">⚠️ Unconfirmed</option>
                <option value="confirmed">✅ Confirmed</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={groupByMerchant}
                  onChange={(e) => setGroupByMerchant(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-semibold text-gray-700">Group Similar</span>
              </label>
            </div>
          </div>

          {/* Compact List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {(() => {
              // Apply filters
              let filtered = parsedExpenses;

              if (filterStatus === 'errors') {
                filtered = filtered.filter(e => e.validationError);
              } else if (filterStatus === 'unconfirmed') {
                filtered = filtered.filter(e => e.status === 'pending' && !e.validationError);
              } else if (filterStatus === 'confirmed') {
                filtered = filtered.filter(e => e.status === 'confirmed' || e.status === 'edited');
              }

              if (filterCategory !== 'all') {
                filtered = filtered.filter(e => e.category === filterCategory);
              }

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-semibold">No expenses match your filters</p>
                    <p className="text-sm mt-1">Try adjusting the filters above</p>
                  </div>
                );
              }

              // Group by merchant if enabled
              if (groupByMerchant) {
                // Normalize merchant name for grouping
                const normalizeKey = (desc: string) => {
                  return desc.toLowerCase().trim().replace(/\s+/g, ' ').substring(0, 30);
                };

                const groups = new Map<string, ParsedExpense[]>();
                filtered.forEach(expense => {
                  const key = normalizeKey(expense.description);
                  if (!groups.has(key)) {
                    groups.set(key, []);
                  }
                  groups.get(key)!.push(expense);
                });

                // Render groups
                return Array.from(groups.entries()).map(([key, expenses]) => {
                  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
                  const currency = expenses[0].currency;
                  const categoryInfo = CATEGORIES.find(c => c.value === expenses[0].category);
                  const allConfirmed = expenses.every(e => e.status === 'confirmed' || e.status === 'edited');
                  const hasErrors = expenses.some(e => e.validationError);
                  const isGroupExpanded = expandedGroups.has(key);

                  if (expenses.length === 1) {
                    // Single item - render normally
                    const expense = expenses[0];
                    const isGeneral = expense.category === 'flight' || expense.category === 'visa' || !expense.day;
                    const isExpanded = expandedId === expense.id;

                    return (
                      <div
                        key={expense.id}
                        className={`border-2 rounded-xl transition-all ${
                          expense.status === 'confirmed'
                            ? 'bg-green-50 border-green-300'
                            : expense.validationError
                            ? 'bg-red-50 border-red-400'
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                              style={{ backgroundColor: `${categoryInfo?.color}20` }}
                            >
                              {categoryInfo?.label.split(' ')[0] || '💰'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-bold" style={{ color: categoryInfo?.color }}>
                                  {currency === 'ILS' && '₪'}
                                  {currency === 'USD' && '$'}
                                  {currency === 'EUR' && '€'}
                                  {expense.amount}
                                </span>
                                <span className="text-sm text-gray-500">• {expense.date || 'No date'}</span>
                                {isGeneral && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">General</span>}
                                {expense.validationError && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">Error</span>}
                              </div>
                              <p className="text-sm text-gray-700 truncate">{expense.description || 'No description'}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {expense.status !== 'confirmed' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmExpense(expense.id);
                                  }}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  ✓ Confirm
                                </button>
                              )}
                              {expense.status === 'confirmed' && (
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                  ✓ Done
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteExpense(expense.id);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            <div className="pt-4 space-y-3">
                              <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
                                <input
                                  type="text"
                                  value={expense.description}
                                  onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                                  placeholder="What was this expense for?"
                                  className="w-full px-3 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                                {expense.validationError && (
                                  <p className="text-xs text-red-600 font-semibold mt-1">{expense.validationError}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                                  <select
                                    value={expense.category}
                                    onChange={(e) => updateExpense(expense.id, { category: e.target.value as any })}
                                    className="w-full px-2 py-2 text-xs font-semibold border-2 border-gray-300 rounded-lg"
                                    style={{ color: categoryInfo?.color }}
                                  >
                                    {CATEGORIES.map(cat => (
                                      <option key={cat.value} value={cat.value}>{cat.label.split(' ').slice(1).join(' ')}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
                                  <input
                                    type="text"
                                    value={expense.date || ''}
                                    onChange={(e) => updateExpense(expense.id, { date: e.target.value })}
                                    placeholder="DD/MM/YYYY"
                                    className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Amount</label>
                                  <input
                                    type="number"
                                    value={expense.amount}
                                    onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                                    step="0.01"
                                    className="w-full px-2 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Currency</label>
                                  <select
                                    value={expense.currency}
                                    onChange={(e) => updateExpense(expense.id, { currency: e.target.value })}
                                    className="w-full px-2 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg"
                                  >
                                    <option value="ILS">₪ ILS</option>
                                    <option value="USD">$ USD</option>
                                    <option value="IDR">IDR</option>
                                    <option value="THB">฿ THB</option>
                                    <option value="EUR">€ EUR</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Place</label>
                                  <select
                                    value={expense.place || ''}
                                    onChange={(e) => updateExpense(expense.id, { place: e.target.value })}
                                    className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg"
                                  >
                                    <option value="">Select...</option>
                                    {PLACES.map(p => (
                                      <option key={p.value} value={p.value}>{p.emoji} {p.value}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trip Day</label>
                                  <input
                                    type="number"
                                    value={expense.day || ''}
                                    onChange={(e) => updateExpense(expense.id, { day: parseInt(e.target.value) || undefined })}
                                    placeholder="General"
                                    min="1"
                                    max={tripData.days.length}
                                    disabled={expense.category === 'flight' || expense.category === 'visa'}
                                    className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg disabled:bg-gray-100"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Group with multiple items
                  return (
                    <div
                      key={key}
                      className={`border-2 rounded-xl transition-all ${
                        allConfirmed
                          ? 'bg-green-50 border-green-300'
                          : hasErrors
                          ? 'bg-red-50 border-red-400'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      {/* Group Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          const newSet = new Set(expandedGroups);
                          if (isGroupExpanded) {
                            newSet.delete(key);
                          } else {
                            newSet.add(key);
                          }
                          setExpandedGroups(newSet);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ backgroundColor: `${categoryInfo?.color}20` }}
                          >
                            {categoryInfo?.label.split(' ')[0] || '💰'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-bold" style={{ color: categoryInfo?.color }}>
                                {currency === 'ILS' && '₪'}
                                {currency === 'USD' && '$'}
                                {currency === 'EUR' && '€'}
                                {total.toFixed(2)}
                              </span>
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">
                                {expenses.length}× items
                              </span>
                              {hasErrors && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">Has Errors</span>}
                            </div>
                            <p className="text-sm text-gray-700 truncate">{expenses[0].description}</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!allConfirmed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  expenses.forEach(exp => {
                                    if (exp.status !== 'confirmed' && !exp.validationError) {
                                      confirmExpense(exp.id);
                                    }
                                  });
                                }}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✓ Confirm All
                              </button>
                            )}
                            {allConfirmed && (
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                ✓ All Done
                              </span>
                            )}
                            <span className="text-gray-400">{isGroupExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Group Items */}
                      {isGroupExpanded && (
                        <div className="border-t border-gray-300 bg-white">
                          {expenses.map((expense, idx) => {
                            const isExpanded = expandedId === expense.id;
                            const isGeneral = expense.category === 'flight' || expense.category === 'visa' || !expense.day;

                            return (
                              <div key={expense.id} className={`${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                                <div
                                  className="p-3 cursor-pointer hover:bg-gray-50"
                                  onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-400 w-6">#{idx + 1}</span>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base font-bold" style={{ color: categoryInfo?.color }}>
                                          {currency === 'ILS' && '₪'}
                                          {currency === 'USD' && '$'}
                                          {currency === 'EUR' && '€'}
                                          {expense.amount}
                                        </span>
                                        <span className="text-xs text-gray-500">• {expense.date || 'No date'}</span>
                                        {isGeneral && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">General</span>}
                                        {expense.validationError && <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">Error</span>}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {expense.status !== 'confirmed' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            confirmExpense(expense.id);
                                          }}
                                          className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700"
                                        >
                                          ✓
                                        </button>
                                      )}
                                      {expense.status === 'confirmed' && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                          ✓
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteExpense(expense.id);
                                        }}
                                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                      <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-3 bg-gray-50">
                                    <div className="space-y-2">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
                                        <input
                                          type="text"
                                          value={expense.description}
                                          onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                                          className="w-full px-2 py-1.5 text-xs font-medium border-2 border-gray-300 rounded-lg"
                                        />
                                        {expense.validationError && (
                                          <p className="text-xs text-red-600 font-semibold mt-1">{expense.validationError}</p>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-4 gap-2">
                                        <div>
                                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                                          <select
                                            value={expense.category}
                                            onChange={(e) => updateExpense(expense.id, { category: e.target.value as any })}
                                            className="w-full px-1 py-1.5 text-xs font-semibold border-2 border-gray-300 rounded-lg"
                                          >
                                            {CATEGORIES.map(cat => (
                                              <option key={cat.value} value={cat.value}>{cat.label.split(' ').slice(1).join(' ')}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
                                          <input
                                            type="text"
                                            value={expense.date || ''}
                                            onChange={(e) => updateExpense(expense.id, { date: e.target.value })}
                                            placeholder="DD/MM/YY"
                                            className="w-full px-1 py-1.5 text-xs font-medium border-2 border-gray-300 rounded-lg"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Amount</label>
                                          <input
                                            type="number"
                                            value={expense.amount}
                                            onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                                            step="0.01"
                                            className="w-full px-1 py-1.5 text-xs font-bold border-2 border-gray-300 rounded-lg"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Day</label>
                                          <input
                                            type="number"
                                            value={expense.day || ''}
                                            onChange={(e) => updateExpense(expense.id, { day: parseInt(e.target.value) || undefined })}
                                            placeholder="Gen"
                                            min="1"
                                            max={tripData.days.length}
                                            className="w-full px-1 py-1.5 text-xs font-medium border-2 border-gray-300 rounded-lg"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              }

              // No grouping - render individual items
              return filtered.map((expense) => {
                const categoryInfo = CATEGORIES.find(c => c.value === expense.category);
                const isGeneral = expense.category === 'flight' || expense.category === 'visa' || !expense.day;
                const isExpanded = expandedId === expense.id;

                return (
                  <div
                    key={expense.id}
                    className={`border-2 rounded-xl transition-all ${
                      expense.status === 'confirmed'
                        ? 'bg-green-50 border-green-300'
                        : expense.validationError
                        ? 'bg-red-50 border-red-400'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Compact Row - Always Visible */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Category Icon */}
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: `${categoryInfo?.color}20` }}
                        >
                          {categoryInfo?.label.split(' ')[0] || '💰'}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold" style={{ color: categoryInfo?.color }}>
                              {expense.currency === 'ILS' && '₪'}
                              {expense.currency === 'USD' && '$'}
                              {expense.currency === 'EUR' && '€'}
                              {expense.amount}
                            </span>
                            <span className="text-sm text-gray-500">• {expense.date || 'No date'}</span>
                            {isGeneral && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">General</span>}
                            {expense.validationError && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">Error</span>}
                          </div>
                          <p className="text-sm text-gray-700 truncate">{expense.description || 'No description'}</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {expense.status !== 'confirmed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmExpense(expense.id);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                            >
                              ✓ Confirm
                            </button>
                          )}
                          {expense.status === 'confirmed' && (
                            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                              ✓ Done
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExpense(expense.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                        <div className="pt-4 space-y-3">
                          {/* Description */}
                          <div>
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label>
                            <input
                              type="text"
                              value={expense.description}
                              onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                              placeholder="What was this expense for?"
                              className="w-full px-3 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                            {expense.validationError && (
                              <p className="text-xs text-red-600 font-semibold mt-1">{expense.validationError}</p>
                            )}
                          </div>

                          {/* Grid: Category, Date, Amount, Currency */}
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                              <select
                                value={expense.category}
                                onChange={(e) => updateExpense(expense.id, { category: e.target.value as any })}
                                className="w-full px-2 py-2 text-xs font-semibold border-2 border-gray-300 rounded-lg"
                                style={{ color: categoryInfo?.color }}
                              >
                                {CATEGORIES.map(cat => (
                                  <option key={cat.value} value={cat.value}>{cat.label.split(' ').slice(1).join(' ')}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date</label>
                              <input
                                type="text"
                                value={expense.date || ''}
                                onChange={(e) => updateExpense(expense.id, { date: e.target.value })}
                                placeholder="DD/MM/YYYY"
                                className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Amount</label>
                              <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) => updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                className="w-full px-2 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Currency</label>
                              <select
                                value={expense.currency}
                                onChange={(e) => updateExpense(expense.id, { currency: e.target.value })}
                                className="w-full px-2 py-2 text-xs font-bold border-2 border-gray-300 rounded-lg"
                              >
                                <option value="ILS">₪ ILS</option>
                                <option value="USD">$ USD</option>
                                <option value="IDR">IDR</option>
                                <option value="THB">฿ THB</option>
                                <option value="EUR">€ EUR</option>
                              </select>
                            </div>
                          </div>

                          {/* Place & Trip Day */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Place</label>
                              <select
                                value={expense.place || ''}
                                onChange={(e) => updateExpense(expense.id, { place: e.target.value })}
                                className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg"
                              >
                                <option value="">Select...</option>
                                {PLACES.map(p => (
                                  <option key={p.value} value={p.value}>{p.emoji} {p.value}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trip Day</label>
                              <input
                                type="number"
                                value={expense.day || ''}
                                onChange={(e) => updateExpense(expense.id, { day: parseInt(e.target.value) || undefined })}
                                placeholder="General"
                                min="1"
                                max={tripData.days.length}
                                disabled={expense.category === 'flight' || expense.category === 'visa'}
                                className="w-full px-2 py-2 text-xs font-medium border-2 border-gray-300 rounded-lg disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Summary - kept as table for backward compatibility */}
          <div className="hidden">
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      Trip Day
                      <div className="text-xs font-normal text-gray-500 normal-case">Empty = General</div>
                    </th>
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
                          placeholder="General"
                          min="1"
                          max={tripData.days.length}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        {(expense.category === 'flight' || expense.category === 'visa' || !expense.day) && (
                          <div className="text-xs text-blue-600 font-semibold mt-0.5">
                            ✈️ General
                          </div>
                        )}
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
