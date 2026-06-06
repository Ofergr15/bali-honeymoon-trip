import { supabase } from '../lib/supabase';

export async function verifyHotelData() {
  console.log('🔍 VERIFYING HOTEL DATA FROM DATABASE\n');

  // Get trip
  const { data: trips } = await supabase.from('trips').select('*');
  const trip = trips?.[0];
  console.log('✅ Trip:', trip?.title, trip?.id);

  // Get days
  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', trip.id)
    .order('day_number');

  console.log('✅ Total days:', days?.length);
  console.log('   First day:', days?.[0]?.day_number, days?.[0]?.date);
  console.log('   Last day:', days?.[days.length - 1]?.day_number, days?.[days.length - 1]?.date);

  // Get all expenses
  const dayIds = days?.map(d => d.id) || [];
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .or(`day_id.in.(${dayIds.join(',')}),day_id.is.null`);

  const accommodations = expenses?.filter(e => e.category === 'accommodation') || [];
  console.log('\n📊 Total accommodation expenses:', accommodations.length);

  // Create day lookup
  const dayLookup = new Map();
  days?.forEach(d => {
    dayLookup.set(d.id, { dayNumber: d.day_number, date: d.date, title: d.title });
  });

  // Group by hotel name
  const hotelGroups = new Map();

  accommodations.forEach(exp => {
    const dayInfo = dayLookup.get(exp.day_id);
    if (!dayInfo) {
      console.warn('⚠️ Expense without matching day:', exp.id);
      return;
    }

    // Clean hotel name
    const hotelName = exp.description
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*-\s*.*$/, '')
      .trim();

    if (!hotelGroups.has(hotelName)) {
      hotelGroups.set(hotelName, []);
    }

    hotelGroups.get(hotelName).push({
      dayNumber: dayInfo.dayNumber,
      date: dayInfo.date,
      amount: parseFloat(exp.amount),
      currency: exp.currency,
      rawDescription: exp.description,
    });
  });

  console.log('\n🏨 HOTELS GROUPED BY NAME:\n');

  // Sort and display
  const sortedHotels = Array.from(hotelGroups.entries())
    .sort((a, b) => Math.min(...a[1].map(n => n.dayNumber)) - Math.min(...b[1].map(n => n.dayNumber)));

  sortedHotels.forEach(([hotelName, nights]) => {
    nights.sort((a, b) => a.dayNumber - b.dayNumber);

    const dayNumbers = nights.map(n => n.dayNumber);
    const isConsecutive = nights.every((n, i) =>
      i === 0 || n.dayNumber === nights[i - 1].dayNumber + 1
    );

    const totalPrice = nights.reduce((sum, n) => sum + n.amount, 0);
    const currency = nights[0].currency;

    console.log(`\n${hotelName}:`);
    console.log(`  ✓ Total nights: ${nights.length}`);
    console.log(`  ✓ Days: ${dayNumbers.join(', ')}`);
    console.log(`  ✓ Consecutive: ${isConsecutive ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✓ Check-in: ${nights[0].date}`);
    console.log(`  ✓ Check-out: ${new Date(new Date(nights[nights.length - 1].date).getTime() + 86400000).toISOString().split('T')[0]}`);
    console.log(`  ✓ Total price: ${totalPrice} ${currency}`);
    console.log(`  ✓ Per night: ${(totalPrice / nights.length).toFixed(2)} ${currency}`);
    console.log('  Details:');
    nights.forEach(n => {
      console.log(`    - Day ${n.dayNumber} (${n.date}): ${n.amount} ${n.currency}`);
    });
  });

  // Check specific hotels from the report
  console.log('\n\n🔎 CHECKING SPECIFIC HOTELS FROM REPORT:\n');

  const checkHotel = (searchTerm: string, expectedNights: number, expectedDays: number[]) => {
    const hotel = sortedHotels.find(([name]) => name.includes(searchTerm));
    if (!hotel) {
      console.log(`❌ "${searchTerm}" NOT FOUND in database`);
      return;
    }

    const [name, nights] = hotel;
    const dayNumbers = nights.map(n => n.dayNumber).sort((a, b) => a - b);

    console.log(`\n"${searchTerm}":`);
    console.log(`  Expected: ${expectedNights} nights, Days ${expectedDays.join(', ')}`);
    console.log(`  Actual:   ${nights.length} nights, Days ${dayNumbers.join(', ')}`);

    const nightsMatch = nights.length === expectedNights;
    const daysMatch = JSON.stringify(dayNumbers) === JSON.stringify(expectedDays);

    if (nightsMatch && daysMatch) {
      console.log('  ✅ CORRECT');
    } else {
      console.log('  ❌ MISMATCH');
      if (!nightsMatch) console.log(`     - Nights: expected ${expectedNights}, got ${nights.length}`);
      if (!daysMatch) console.log(`     - Days: expected [${expectedDays}], got [${dayNumbers}]`);
    }
  };

  // From the PDF report
  checkHotel('Jono Bangkok', 1, [2]);
  checkHotel('Canggu Village', 2, [3, 4]);
  checkHotel('Body Factory', 2, [5, 6]);
  checkHotel('Kecamatan Selat', 1, [7]);
  checkHotel('Samanvaya', 1, [8]);
  checkHotel('Wapa di Ume', 2, [9, 10]);
  checkHotel('Mesari', 1, [11]);
  checkHotel('Hiraya', 2, [12, 13]);
  checkHotel('Kaleydo', 3, [14, 15, 16]);
  checkHotel('Living Asia', 1, [17]);
  checkHotel('Nusa Beach Club', 3, [18, 19, 20]);
  checkHotel('Quest Hotel', 1, [21]);
  checkHotel('Boat Trip', 1, [22]);
  checkHotel('Wae Molas', 1, [23]);
  checkHotel('Radisson', 3, [24, 25, 26]);
  checkHotel('Marriott', 2, [27, 28]);

  console.log('\n\n📋 SUMMARY:');
  console.log(`Total hotels in DB: ${hotelGroups.size}`);
  console.log(`Total night records: ${accommodations.length}`);
  console.log(`Expected hotels: 16`);
  console.log(`Expected night records: 27`);

  return {
    hotels: sortedHotels,
    totalNights: accommodations.length
  };
}

// Make available globally
(window as any).verifyHotelData = verifyHotelData;

// Auto-run on load
setTimeout(() => {
  console.log('💡 Running automatic hotel data verification...');
  verifyHotelData().then(() => {
    console.log('\n💡 You can run window.verifyHotelData() again anytime');
  });
}, 2000);
