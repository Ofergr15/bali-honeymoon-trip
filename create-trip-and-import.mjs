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

// Trip structure based on your ACTUAL_TRIP_ROUTE.md
const tripStructure = {
  title: "Our Bali Honeymoon",
  destination: "Bali, Indonesia & Bangkok, Thailand",
  startDate: "2026-05-04",
  endDate: "2026-06-02",
  days: [
    { day: 1, date: "2026-05-04", title: "Departure" },
    { day: 2, date: "2026-05-05", title: "Bangkok" },
    { day: 3, date: "2026-05-06", title: "Canggu" },
    { day: 4, date: "2026-05-07", title: "Canggu" },
    { day: 5, date: "2026-05-08", title: "Canggu" },
    { day: 6, date: "2026-05-09", title: "Canggu" },
    { day: 7, date: "2026-05-10", title: "Sidemen" },
    { day: 8, date: "2026-05-11", title: "Sidemen" },
    { day: 9, date: "2026-05-12", title: "Ubud" },
    { day: 10, date: "2026-05-13", title: "Ubud" },
    { day: 11, date: "2026-05-14", title: "Ubud" },
    { day: 12, date: "2026-05-15", title: "Uluwatu" },
    { day: 13, date: "2026-05-16", title: "Uluwatu" },
    { day: 14, date: "2026-05-17", title: "Gili Trawangan" },
    { day: 15, date: "2026-05-18", title: "Gili Trawangan" },
    { day: 16, date: "2026-05-19", title: "Gili Trawangan" },
    { day: 17, date: "2026-05-20", title: "Gili Air" },
    { day: 18, date: "2026-05-21", title: "Nusa Lembongan" },
    { day: 19, date: "2026-05-22", title: "Nusa Lembongan" },
    { day: 20, date: "2026-05-23", title: "Nusa Lembongan" },
    { day: 21, date: "2026-05-24", title: "Kuta" },
    { day: 22, date: "2026-05-25", title: "Komodo" },
    { day: 23, date: "2026-05-26", title: "Komodo" },
    { day: 24, date: "2026-05-27", title: "Uluwatu" },
    { day: 25, date: "2026-05-28", title: "Uluwatu" },
    { day: 26, date: "2026-05-29", title: "Uluwatu" },
    { day: 27, date: "2026-05-30", title: "Bangkok" },
    { day: 28, date: "2026-05-31", title: "Bangkok" },
    { day: 29, date: "2026-06-01", title: "Return Flight" },
    { day: 30, date: "2026-06-02", title: "Arrival Home" }
  ]
};

// Hotel data
const hotelData = [
  { date: '2026-05-05', checkOut: '2026-05-06', name: 'Jono Bangkok Asok Hotel', address: '70 Soi Sukhumvit 16 Sammitr, Klongtoei, Bangkok, Thailand', price: 1105.15, currency: 'THB', nights: 1 },
  { date: '2026-05-06', checkOut: '2026-05-08', name: 'Canggu Village Accommodation', address: '78 Jalan Pantai Batu Bolong, Canggu, Indonesia', price: 156.82, currency: 'USD', nights: 2 },
  { date: '2026-05-08', checkOut: '2026-05-10', name: 'Body Factory Lifestyle Residence Canggu', address: 'Jalan Nelayan No.27c, Kabupaten Badung, Indonesia', price: 4850442, currency: 'IDR', nights: 2 },
  { date: '2026-05-10', checkOut: '2026-05-11', name: 'Kecamatan Selat (Airbnb)', address: 'Sidemen, Bali, Indonesia', price: 204.30, currency: 'USD', nights: 1, notes: 'Hosted by Agus' },
  { date: '2026-05-11', checkOut: '2026-05-12', name: 'Samanvaya Luxury Resort & Spa Adults Only', address: 'Banjar Tabola, Karangasem, Sidemen, Bali, Indonesia', price: 0, currency: 'USD', nights: 1, notes: 'Sundari Villa - Price TBD' },
  { date: '2026-05-12', checkOut: '2026-05-14', name: 'Wapa di Ume Ubud', address: 'Jalan Suweta Banjar Bentuyung Ubud, Bali, Indonesia', price: 0, currency: 'USD', nights: 2, notes: 'Lanai Room - Price TBD' },
  { date: '2026-05-14', checkOut: '2026-05-15', name: 'Mesari Hotel Ubud', address: 'Mesari Hotel Ubud, Kabupaten Gianyar, Indonesia', price: 718605, currency: 'IDR', nights: 1 },
  { date: '2026-05-15', checkOut: '2026-05-17', name: 'Hiraya Uluwatu', address: 'Jl. Batu Kandik, Pecatu, Uluwatu, Bali, Indonesia', price: 292.37, currency: 'ILS', nights: 2 },
  { date: '2026-05-17', checkOut: '2026-05-20', name: 'Kaleydo Villas', address: 'Jalan Ikan Duyung, Gili Trawangan, Indonesia', price: 5173432, currency: 'IDR', nights: 3 },
  { date: '2026-05-20', checkOut: '2026-05-21', name: 'Living Asia Sunset Resort', address: 'Gili Air, Indonesia', price: 1500000, currency: 'IDR', nights: 1 },
  { date: '2026-05-21', checkOut: '2026-05-24', name: 'd\'Nusa Beach Club and Resort', address: 'Light House Beach, Jungutbatu, Nusa Lembongan, Indonesia', price: 3086586, currency: 'IDR', nights: 3 },
  { date: '2026-05-24', checkOut: '2026-05-25', name: 'Quest Hotel Kuta by Aston', address: 'Kuta, Bali, Indonesia', price: 20.55, currency: 'USD', nights: 1 },
  { date: '2026-05-25', checkOut: '2026-05-26', name: 'Overnight Boat Trip', address: 'Komodo National Park, Indonesia', price: 0, currency: 'USD', nights: 1, notes: 'Paid in cash' },
  { date: '2026-05-26', checkOut: '2026-05-27', name: 'Wae Molas Bed & Breakfast', address: 'Jl Air Kemiri, Labuan Bajo, Indonesia', price: 787500, currency: 'IDR', nights: 1 },
  { date: '2026-05-27', checkOut: '2026-05-30', name: 'Radisson Blu Resort & Villas', address: 'Uluwatu, Bali, Indonesia', price: 606.21, currency: 'USD', nights: 3 },
  { date: '2026-05-30', checkOut: '2026-06-01', name: 'Bangkok Marriott Marquis Queens Park', address: '199 Sukhumvit Soi 22, Bangkok, Thailand', price: 14594.80, currency: 'THB', nights: 2 }
];

// Daily expenses from PDF
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

// Fixed costs
const fixedCosts = [
  { category: 'other', description: 'Visas', amount: 7240.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' },
  { category: 'transport', description: 'Domestic flights in Thailand', amount: 3398.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' },
  { category: 'transport', description: 'El Al international flights', amount: 4370.00, currency: 'ILS', notes: 'Fixed/pre-trip cost' }
];

async function createTripAndImport() {
  console.log('🚀 Creating trip and importing all data...\n');

  // Step 1: Create trip
  console.log('📝 Creating trip...');
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      title: tripStructure.title,
      destination: tripStructure.destination,
      start_date: tripStructure.startDate,
      end_date: tripStructure.endDate
    })
    .select()
    .single();

  if (tripError) {
    console.error('❌ Error creating trip:', tripError);
    return;
  }

  const tripId = trip.id;
  console.log(`✅ Trip created: ${tripId}\n`);

  // Step 2: Create days
  console.log('📅 Creating days...');
  const daysToInsert = tripStructure.days.map(day => ({
    trip_id: tripId,
    day_number: day.day,
    date: day.date,
    title: day.title
  }));

  const { data: createdDays, error: daysError } = await supabase
    .from('days')
    .insert(daysToInsert)
    .select();

  if (daysError) {
    console.error('❌ Error creating days:', daysError);
    return;
  }

  console.log(`✅ Created ${createdDays.length} days\n`);

  // Create date map
  const dateMap = new Map();
  createdDays.forEach(day => {
    const dateStr = new Date(day.date).toISOString().split('T')[0];
    dateMap.set(dateStr, { id: day.id, dayNumber: day.day_number });
  });

  // Step 3: Import hotel expenses
  console.log('🏨 Importing hotel bookings...');
  let hotelExpenses = [];

  for (const hotel of hotelData) {
    const dayInfo = dateMap.get(hotel.date);
    if (!dayInfo) continue;

    if (hotel.price > 0) {
      const description = hotel.notes
        ? `${hotel.name} (${hotel.nights} night${hotel.nights > 1 ? 's' : ''}) - ${hotel.notes}`
        : `${hotel.name} (${hotel.nights} night${hotel.nights > 1 ? 's' : ''})`;

      hotelExpenses.push({
        day_id: dayInfo.id,
        category: 'accommodation',
        description: description,
        amount: hotel.price,
        currency: hotel.currency
      });
    }
  }

  if (hotelExpenses.length > 0) {
    const { error } = await supabase.from('expenses').insert(hotelExpenses);
    if (error) {
      console.error('❌ Error inserting hotels:', error);
    } else {
      console.log(`✅ Inserted ${hotelExpenses.length} hotel bookings\n`);
    }
  }

  // Step 4: Import daily expenses
  console.log('💰 Importing daily expenses...');
  let expenseRecords = [];

  for (const dayData of dailyExpenses) {
    const dayInfo = dateMap.get(dayData.date);
    if (!dayInfo) continue;

    const categories = [
      { key: 'dailyExpenses', category: 'food', description: 'Food, entertainment and daily expenses' },
      { key: 'hotels', category: 'accommodation', description: 'Additional hotel charges' },
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
    if (error) {
      console.error('❌ Error inserting daily expenses:', error);
    } else {
      console.log(`✅ Inserted ${expenseRecords.length} daily expenses\n`);
    }
  }

  // Step 5: Import fixed costs
  console.log('✈️  Importing fixed costs...');
  const fixedExpenses = fixedCosts.map(fixed => ({
    day_id: null,
    category: fixed.category,
    description: `${fixed.description} - ${fixed.notes}`,
    amount: fixed.amount,
    currency: fixed.currency
  }));

  if (fixedExpenses.length > 0) {
    const { error } = await supabase.from('expenses').insert(fixedExpenses);
    if (error) {
      console.error('❌ Error inserting fixed costs:', error);
    } else {
      console.log(`✅ Inserted ${fixedExpenses.length} fixed costs\n`);
    }
  }

  // Summary
  const totalExpenses = hotelExpenses.length + expenseRecords.length + fixedExpenses.length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 IMPORT COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Trip created with ${createdDays.length} days`);
  console.log(`✅ ${hotelExpenses.length} hotel bookings imported`);
  console.log(`✅ ${expenseRecords.length} daily expenses imported`);
  console.log(`✅ ${fixedExpenses.length} fixed costs imported`);
  console.log(`✅ Total: ${totalExpenses} expense records`);
  console.log('\n🌐 Visit your site to see the data:');
  console.log('   https://bali-honeymoon-trip.vercel.app');
  console.log('\n💡 Open Budget Dashboard to view expense analysis!');
}

createTripAndImport().catch(console.error);
