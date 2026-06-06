import { useState } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImportHoneymoonExpensesProps {
  tripId: string;
  onComplete: () => void;
}

export default function ImportHoneymoonExpenses({ tripId, onComplete }: ImportHoneymoonExpensesProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const hotelData = [
    { date: '2026-05-05', name: 'Jono Bangkok Asok Hotel', price: 1105.15, currency: 'THB', nights: 1 },
    { date: '2026-05-06', name: 'Canggu Village Accommodation', price: 156.82, currency: 'USD', nights: 2 },
    { date: '2026-05-08', name: 'Body Factory Lifestyle Residence Canggu', price: 4850442, currency: 'IDR', nights: 2 },
    { date: '2026-05-10', name: 'Kecamatan Selat (Airbnb)', price: 204.30, currency: 'USD', nights: 1, notes: 'Hosted by Agus' },
    { date: '2026-05-11', name: 'Samanvaya Luxury Resort & Spa', price: 0, currency: 'USD', nights: 1, notes: 'Sundari Villa' },
    { date: '2026-05-12', name: 'Wapa di Ume Ubud', price: 0, currency: 'USD', nights: 2, notes: 'Lanai Room' },
    { date: '2026-05-14', name: 'Mesari Hotel Ubud', price: 718605, currency: 'IDR', nights: 1 },
    { date: '2026-05-15', name: 'Hiraya Uluwatu', price: 292.37, currency: 'ILS', nights: 2 },
    { date: '2026-05-17', name: 'Kaleydo Villas', price: 5173432, currency: 'IDR', nights: 3 },
    { date: '2026-05-20', name: 'Living Asia Sunset Resort', price: 1500000, currency: 'IDR', nights: 1 },
    { date: '2026-05-21', name: 'd\'Nusa Beach Club and Resort', price: 3086586, currency: 'IDR', nights: 3 },
    { date: '2026-05-24', name: 'Quest Hotel Kuta by Aston', price: 20.55, currency: 'USD', nights: 1 },
    { date: '2026-05-25', name: 'Overnight Boat Trip', price: 0, currency: 'USD', nights: 1, notes: 'Paid in cash' },
    { date: '2026-05-26', name: 'Wae Molas Bed & Breakfast', price: 787500, currency: 'IDR', nights: 1 },
    { date: '2026-05-27', name: 'Radisson Blu Resort & Villas', price: 606.21, currency: 'USD', nights: 3 },
    { date: '2026-05-30', name: 'Bangkok Marriott Marquis Queens Park', price: 14594.80, currency: 'THB', nights: 2 }
  ];

  const dailyExpenses = [
    { date: '2026-05-04', dailyExpenses: 0, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 413.57, other: 0, notes: 'Duty free; SIM' },
    { date: '2026-05-05', dailyExpenses: 0, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 100.47, food: 41.56, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-06', dailyExpenses: 0, hotels: 0, flights: 0, transport: 74.57, cash: 0, entertainment: 207.36, food: 156.09, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-07', dailyExpenses: 46.18, hotels: 0, flights: 0, transport: 0, cash: 518.91, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Cash withdrawal' },
    { date: '2026-05-08', dailyExpenses: 495.26, hotels: 0, flights: 0, transport: 8.74, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-09', dailyExpenses: 879.36, hotels: 506.05, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-10', dailyExpenses: 330.86, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 528.28, food: 0, shopping: 0, other: 0, notes: 'Party/event' },
    { date: '2026-05-11', dailyExpenses: 46.31, hotels: 615.82, flights: 0, transport: 12.57, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Hotel-heavy day' },
    { date: '2026-05-12', dailyExpenses: 1807.98, hotels: 122.53, flights: 0, transport: 43.81, cash: 275.91, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Cash withdrawal' },
    { date: '2026-05-13', dailyExpenses: 1043.82, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-14', dailyExpenses: 301.80, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-15', dailyExpenses: 541.96, hotels: 0, flights: 0, transport: 5.26, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-16', dailyExpenses: 579.67, hotels: 0, flights: 0, transport: 247.92, cash: 0, entertainment: 88.31, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-17', dailyExpenses: 211.40, hotels: 608.24, flights: 0, transport: 11.49, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Hotel-heavy day' },
    { date: '2026-05-18', dailyExpenses: 490.90, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-19', dailyExpenses: 244.17, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-20', dailyExpenses: 432.76, hotels: 0, flights: 887.44, transport: 263.01, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Flight-related' },
    { date: '2026-05-21', dailyExpenses: 595.94, hotels: 175.93, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-22', dailyExpenses: 652.47, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-23', dailyExpenses: 444.10, hotels: 535.08, flights: 0, transport: 125.62, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-24', dailyExpenses: 1179.81, hotels: 0, flights: 49.23, transport: 60.07, cash: 339.93, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Cash withdrawal' },
    { date: '2026-05-25', dailyExpenses: 43.13, hotels: 1429.83, flights: 0, transport: 6.56, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Hotel-heavy day' },
    { date: '2026-05-26', dailyExpenses: 51.00, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-27', dailyExpenses: 1308.93, hotels: 1298.37, flights: 0, transport: 56.43, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Hotel-heavy day' },
    { date: '2026-05-28', dailyExpenses: 747.96, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-29', dailyExpenses: 902.91, hotels: 0, flights: 0, transport: 0, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 25.64, notes: 'Medical' },
    { date: '2026-05-30', dailyExpenses: 835.10, hotels: 0, flights: 0, transport: 61.08, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-05-31', dailyExpenses: 268.53, hotels: 0, flights: 0, transport: 65.99, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-06-01', dailyExpenses: 792.58, hotels: 0, flights: 0, transport: 58.40, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: '' },
    { date: '2026-06-02', dailyExpenses: 0, hotels: 0, flights: 0, transport: 216.10, cash: 0, entertainment: 0, food: 0, shopping: 0, other: 0, notes: 'Return transfer' }
  ];

  const fixedCosts = [
    { category: 'other', description: 'Visas - Fixed/pre-trip cost', amount: 7240.00, currency: 'ILS' },
    { category: 'transport', description: 'Domestic flights in Thailand - Fixed/pre-trip cost', amount: 3398.00, currency: 'ILS' },
    { category: 'transport', description: 'El Al international flights - Fixed/pre-trip cost', amount: 4370.00, currency: 'ILS' }
  ];

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      // Get all days
      const { data: days, error: daysError } = await supabase
        .from('days')
        .select('id, day_number, date')
        .eq('trip_id', tripId)
        .order('day_number');

      if (daysError) throw daysError;

      // Create date map
      const dateMap = new Map();
      days?.forEach(day => {
        dateMap.set(day.date, { id: day.id, dayNumber: day.day_number });
      });

      // Clear existing expenses
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      let totalInserted = 0;

      // Import hotel expenses
      const hotelExpenses = [];
      for (const hotel of hotelData) {
        const dayInfo = dateMap.get(hotel.date);
        if (!dayInfo) continue;

        const desc = hotel.notes
          ? `${hotel.name} - ${hotel.notes}`
          : hotel.name;

        // Include all hotels, even if price is 0 (paid in cash or included)
        hotelExpenses.push({
          day_id: dayInfo.id,
          category: 'accommodation',
          description: desc,
          amount: hotel.price,
          currency: hotel.currency,
          nights: hotel.nights
        });
      }

      if (hotelExpenses.length > 0) {
        const { error } = await supabase.from('expenses').insert(hotelExpenses);
        if (error) throw error;
        totalInserted += hotelExpenses.length;
      }

      // Import daily expenses
      const expenseRecords = [];
      for (const dayData of dailyExpenses) {
        const dayInfo = dateMap.get(dayData.date);
        if (!dayInfo) continue;

        const categories = [
          { key: 'dailyExpenses', category: 'food', desc: 'Food, entertainment and daily expenses' },
          { key: 'hotels', category: 'accommodation', desc: 'Additional hotel charges' },
          { key: 'flights', category: 'transport', desc: 'Domestic flights' },
          { key: 'transport', category: 'transport', desc: 'Transportation / taxis / transfers' },
          { key: 'cash', category: 'other', desc: 'Cash withdrawals' },
          { key: 'entertainment', category: 'activities', desc: 'Entertainment / bars / spa' },
          { key: 'food', category: 'food', desc: 'Food / restaurants / cafes' },
          { key: 'shopping', category: 'shopping', desc: 'Shopping / duty free / SIM' },
          { key: 'other', category: 'other', desc: 'Medical and other expenses' }
        ];

        for (const cat of categories) {
          const amount = (dayData as any)[cat.key];
          if (amount > 0) {
            const description = dayData.notes ? `${cat.desc} - ${dayData.notes}` : cat.desc;
            expenseRecords.push({
              day_id: dayInfo.id,
              category: cat.category,
              description: description,
              amount: amount,
              currency: 'ILS'
            });
          }
        }
      }

      if (expenseRecords.length > 0) {
        const { error } = await supabase.from('expenses').insert(expenseRecords);
        if (error) throw error;
        totalInserted += expenseRecords.length;
      }

      // Import fixed costs
      const fixedExpenses = fixedCosts.map(f => ({
        day_id: null,
        category: f.category,
        description: f.description,
        amount: f.amount,
        currency: f.currency
      }));

      if (fixedExpenses.length > 0) {
        const { error } = await supabase.from('expenses').insert(fixedExpenses);
        if (error) throw error;
        totalInserted += fixedExpenses.length;
      }

      setResult({
        success: true,
        message: `✅ Successfully imported ${totalInserted} expenses! (${hotelExpenses.length} hotels, ${expenseRecords.length} daily expenses, ${fixedExpenses.length} fixed costs)`
      });

      // Call onComplete after a delay so user can see the success message
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: `❌ Error importing expenses: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Import Honeymoon Expenses</h3>
          <p className="text-sm text-gray-600 mb-4">
            This will import all your honeymoon expenses including hotels, daily expenses, and flight costs.
            This will replace any existing expense data.
          </p>

          <div className="text-sm text-gray-700 mb-4 space-y-1">
            <div>• 16 hotel bookings across all locations</div>
            <div>• Daily expenses for all 30 days</div>
            <div>• Fixed costs (visas, flights)</div>
            <div>• Total: ~180 expense records</div>
          </div>

          {result && (
            <div className={`p-3 rounded-lg mb-4 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {result.message}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transition-all"
          >
            {importing ? 'Importing...' : 'Import All Expenses'}
          </button>
        </div>
      </div>
    </div>
  );
}
