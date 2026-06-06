import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env file manually
const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

// Daily expenses data from the PDF report
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

// Fixed/pre-trip costs (not assigned to specific days)
const fixedCosts = [
  { category: 'other', description: 'Visas', amount: 7240.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' },
  { category: 'flight', description: 'Manual domestic flights in Thailand', amount: 3398.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' },
  { category: 'flight', description: 'El Al international flights', amount: 4370.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' }
];

async function importExpenses() {
  console.log('🚀 Starting expense import...');

  // Get the trip ID
  const { data: trips, error: tripError } = await supabase
    .from('trips')
    .select('id, start_date')
    .order('created_at', { ascending: true })
    .limit(1);

  if (tripError) {
    console.error('❌ Error finding trip:', tripError);
    return;
  }

  if (!trips || trips.length === 0) {
    console.error('❌ No trips found in database. Please create a trip first.');
    return;
  }

  const tripId = trips[0].id;
  const tripStartDate = new Date(trips[0].start_date);
  console.log(`✅ Found trip: ${tripId}`);
  console.log(`📅 Trip start date: ${tripStartDate.toISOString().split('T')[0]}`);

  // Get all days
  const { data: days, error: daysError } = await supabase
    .from('days')
    .select('id, day_number, date')
    .eq('trip_id', tripId)
    .order('day_number');

  if (daysError || !days) {
    console.error('❌ Error loading days:', daysError);
    return;
  }

  console.log(`✅ Loaded ${days.length} days`);

  // Create a map of date -> day_id
  const dateMap = new Map();
  days.forEach(day => {
    const dateStr = new Date(day.date).toISOString().split('T')[0];
    dateMap.set(dateStr, { id: day.id, dayNumber: day.day_number });
  });

  // Clear existing expenses
  console.log('🧹 Clearing existing expenses...');
  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('❌ Error clearing expenses:', deleteError);
    return;
  }

  let totalInserted = 0;
  let expensesToInsert = [];

  // Process daily expenses
  for (const dayData of dailyExpenses) {
    const dayInfo = dateMap.get(dayData.date);

    if (!dayInfo) {
      console.warn(`⚠️  No day found for date ${dayData.date}, skipping`);
      continue;
    }

    const { id: dayId, dayNumber } = dayInfo;

    // Add each category as a separate expense
    const categories = [
      { key: 'dailyExpenses', category: 'food', description: 'Food, entertainment and daily expenses' },
      { key: 'hotels', category: 'accommodation', description: 'Hotel expenses' },
      { key: 'flights', category: 'transport', description: 'Domestic flights' },
      { key: 'transport', category: 'transport', description: 'Transportation / taxis / transfers' },
      { key: 'cash', category: 'other', description: 'Cash withdrawals' },
      { key: 'entertainment', category: 'activities', description: 'Entertainment / bars / spa' },
      { key: 'food', category: 'food', description: 'Food / restaurants / cafes' },
      { key: 'shopping', category: 'shopping', description: 'Shopping / duty free / SIM' },
      { key: 'other', category: 'other', description: 'Medical and other expenses' }
    ];

    for (const cat of categories) {
      const amount = dayData[cat.key];
      if (amount > 0) {
        const description = dayData.notes
          ? `${cat.description} - ${dayData.notes}`
          : cat.description;

        expensesToInsert.push({
          day_id: dayId,
          category: cat.category,
          description: description,
          amount: amount,
          currency: 'ILS'
        });
      }
    }
  }

  // Add fixed costs without day_id (trip-level expenses)
  for (const fixed of fixedCosts) {
    expensesToInsert.push({
      day_id: null,
      category: fixed.category,
      description: `${fixed.description} - ${fixed.notes}`,
      amount: fixed.amount,
      currency: fixed.currency
    });
  }

  // Insert all expenses
  console.log(`📝 Inserting ${expensesToInsert.length} expense records...`);

  const { data: inserted, error: insertError } = await supabase
    .from('expenses')
    .insert(expensesToInsert)
    .select();

  if (insertError) {
    console.error('❌ Error inserting expenses:', insertError);
    return;
  }

  totalInserted = inserted?.length || 0;
  console.log(`✅ Successfully inserted ${totalInserted} expenses`);

  // Summary
  const totalAmount = expensesToInsert.reduce((sum, e) => sum + e.amount, 0);
  const datedAmount = expensesToInsert.filter(e => e.day_id !== null).reduce((sum, e) => sum + e.amount, 0);
  const fixedAmount = expensesToInsert.filter(e => e.day_id === null).reduce((sum, e) => sum + e.amount, 0);

  console.log('\n📊 Import Summary:');
  console.log(`   Total expenses: ${totalInserted}`);
  console.log(`   Total amount: ₪${totalAmount.toLocaleString()}`);
  console.log(`   Dated expenses: ₪${datedAmount.toLocaleString()}`);
  console.log(`   Fixed/pre-trip costs: ₪${fixedAmount.toLocaleString()}`);
  console.log('\n✨ Import complete!');
}

importExpenses().catch(console.error);
