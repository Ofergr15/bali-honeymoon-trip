import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🔍 Verifying Hotel Data\n');

// Get trip
const { data: trips } = await supabase.from('trips').select('*');
const trip = trips?.[0];
console.log('Trip:', trip?.title);

// Get days
const { data: days } = await supabase.from('days').select('*').eq('trip_id', trip.id).order('day_number');
console.log('Total days:', days?.length);

// Get all expenses
const dayIds = days?.map(d => d.id) || [];
const { data: expenses } = await supabase
  .from('expenses')
  .select('*')
  .or(`day_id.in.(${dayIds.join(',')}),day_id.is.null`);

const accommodations = expenses?.filter(e => e.category === 'accommodation') || [];
console.log('\n📊 Accommodation Expenses:', accommodations.length);

// Group by hotel
const hotelGroups = {};
accommodations.forEach(exp => {
  const day = days?.find(d => d.id === exp.day_id);
  if (!day) return;

  const hotelName = exp.description
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*-\s*.*$/, '')
    .trim();

  if (!hotelGroups[hotelName]) {
    hotelGroups[hotelName] = [];
  }

  hotelGroups[hotelName].push({
    dayNumber: day.day_number,
    date: day.date,
    amount: exp.amount,
    currency: exp.currency,
    description: exp.description
  });
});

// Display grouped hotels
console.log('\n🏨 Hotels by Name:\n');
Object.entries(hotelGroups).forEach(([hotel, nights]) => {
  nights.sort((a, b) => a.dayNumber - b.dayNumber);

  console.log(`\n${hotel}:`);
  console.log(`  Nights: ${nights.length}`);
  console.log(`  Days: ${nights.map(n => n.dayNumber).join(', ')}`);
  console.log(`  Dates: ${nights[0].date} to ${nights[nights.length - 1].date}`);
  console.log(`  Details:`);
  nights.forEach(n => {
    console.log(`    Day ${n.dayNumber} (${n.date}): ${n.amount} ${n.currency}`);
  });

  // Check if consecutive
  const isConsecutive = nights.every((n, i) =>
    i === 0 || n.dayNumber === nights[i-1].dayNumber + 1
  );
  console.log(`  Consecutive: ${isConsecutive ? '✅' : '❌'}`);
});

// Check specific hotels from report
console.log('\n\n🔎 Checking Specific Hotels:\n');

const cangguVillage = accommodations.filter(e =>
  e.description.includes('Canggu Village')
);
console.log('Canggu Village Accommodation:', cangguVillage.length, 'records');
cangguVillage.forEach(exp => {
  const day = days?.find(d => d.id === exp.day_id);
  console.log(`  Day ${day?.day_number} (${day?.date}): ${exp.amount} ${exp.currency}`);
});

const bodyFactory = accommodations.filter(e =>
  e.description.includes('Body Factory')
);
console.log('\nBody Factory Lifestyle Residence:', bodyFactory.length, 'records');
bodyFactory.forEach(exp => {
  const day = days?.find(d => d.id === exp.day_id);
  console.log(`  Day ${day?.day_number} (${day?.date}): ${exp.amount} ${exp.currency}`);
});
