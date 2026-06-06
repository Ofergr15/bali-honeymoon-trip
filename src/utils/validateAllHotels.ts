import { supabase } from '../lib/supabase';

// Original hotel data from the report
const EXPECTED_HOTELS = [
  { date: '2026-05-05', name: 'Jono Bangkok Asok Hotel', price: 1105.15, currency: 'THB', nights: 1, days: [2] },
  { date: '2026-05-06', name: 'Canggu Village Accommodation', price: 156.82, currency: 'USD', nights: 2, days: [3, 4] },
  { date: '2026-05-08', name: 'Body Factory Lifestyle Residence Canggu', price: 4850442, currency: 'IDR', nights: 2, days: [5, 6] },
  { date: '2026-05-10', name: 'Kecamatan Selat (Airbnb)', price: 204.30, currency: 'USD', nights: 1, days: [7] },
  { date: '2026-05-11', name: 'Samanvaya Luxury Resort & Spa', price: 0, currency: 'USD', nights: 1, days: [8] },
  { date: '2026-05-12', name: 'Wapa di Ume Ubud', price: 0, currency: 'USD', nights: 2, days: [9, 10] },
  { date: '2026-05-14', name: 'Mesari Hotel Ubud', price: 718605, currency: 'IDR', nights: 1, days: [11] },
  { date: '2026-05-15', name: 'Hiraya Uluwatu', price: 292.37, currency: 'ILS', nights: 2, days: [12, 13] },
  { date: '2026-05-17', name: 'Kaleydo Villas', price: 5173432, currency: 'IDR', nights: 3, days: [14, 15, 16] },
  { date: '2026-05-20', name: 'Living Asia Sunset Resort', price: 1500000, currency: 'IDR', nights: 1, days: [17] },
  { date: '2026-05-21', name: 'd\'Nusa Beach Club and Resort', price: 3086586, currency: 'IDR', nights: 3, days: [18, 19, 20] },
  { date: '2026-05-24', name: 'Quest Hotel Kuta by Aston', price: 20.55, currency: 'USD', nights: 1, days: [21] },
  { date: '2026-05-25', name: 'Overnight Boat Trip', price: 0, currency: 'USD', nights: 1, days: [22] },
  { date: '2026-05-26', name: 'Wae Molas Bed & Breakfast', price: 787500, currency: 'IDR', nights: 1, days: [23] },
  { date: '2026-05-27', name: 'Radisson Blu Resort & Villas', price: 606.21, currency: 'USD', nights: 3, days: [24, 25, 26] },
  { date: '2026-05-30', name: 'Bangkok Marriott Marquis Queens Park', price: 14594.80, currency: 'THB', nights: 2, days: [27, 28] }
];

const EXCHANGE_RATES: Record<string, number> = {
  'ILS': 1, 'USD': 3.7, 'THB': 0.11, 'IDR': 0.00024,
};

const convertToILS = (amount: number, currency: string) => amount * (EXCHANGE_RATES[currency] || 1);

export async function validateAllHotels() {
  console.log('🔍 COMPREHENSIVE HOTEL VALIDATION\n');
  console.log('Comparing database vs original hotel report\n');
  console.log('='.repeat(80));

  // Get trip and days
  const { data: trips } = await supabase.from('trips').select('*');
  const trip = trips?.[0];

  const { data: days } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', trip.id)
    .order('day_number');

  // Get all accommodation expenses
  const dayIds = days?.map(d => d.id) || [];
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .or(`day_id.in.(${dayIds.join(',')}),day_id.is.null`);

  const accommodations = expenses?.filter(e => e.category === 'accommodation') || [];

  // Create day lookup
  const dayLookup = new Map();
  days?.forEach(d => {
    dayLookup.set(d.id, { dayNumber: d.day_number, date: d.date });
  });

  console.log('\n📊 DATABASE SUMMARY:');
  console.log(`Total accommodation records: ${accommodations.length}`);
  console.log(`Expected records: 27 (sum of all nights)\n`);

  let totalErrors = 0;

  // Validate each expected hotel
  EXPECTED_HOTELS.forEach((expected, idx) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${idx + 1}. ${expected.name}`);
    console.log(`${'='.repeat(80)}`);

    console.log(`\n📋 EXPECTED:`);
    console.log(`   Check-in: ${expected.date}`);
    console.log(`   Nights: ${expected.nights}`);
    console.log(`   Days: ${expected.days.join(', ')}`);
    console.log(`   Total price: ${expected.price} ${expected.currency}`);
    console.log(`   In ILS: ₪${convertToILS(expected.price, expected.currency).toFixed(2)}`);

    // Clean name for matching
    const cleanExpectedName = expected.name
      .replace(/\(Airbnb\)/g, '')
      .trim();

    // Find matching expenses
    const matchingExpenses = accommodations.filter(exp => {
      const dayInfo = dayLookup.get(exp.day_id);
      if (!dayInfo) return false;

      const cleanDbName = exp.description
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s*-\s*.*$/, '')
        .trim();

      return cleanDbName.includes(cleanExpectedName) || cleanExpectedName.includes(cleanDbName);
    });

    console.log(`\n💾 DATABASE:`);

    if (matchingExpenses.length === 0) {
      console.log(`   ❌ NOT FOUND in database!`);
      totalErrors++;
      return;
    }

    const actualDays = matchingExpenses
      .map(e => dayLookup.get(e.day_id)?.dayNumber)
      .filter(Boolean)
      .sort((a, b) => a - b);

    const totalDbPrice = matchingExpenses.reduce((sum, e) =>
      sum + parseFloat(e.amount), 0
    );
    const dbCurrency = matchingExpenses[0].currency;

    console.log(`   Found ${matchingExpenses.length} records`);
    console.log(`   Days: ${actualDays.join(', ')}`);
    console.log(`   Total price: ${totalDbPrice} ${dbCurrency}`);
    console.log(`   In ILS: ₪${convertToILS(totalDbPrice, dbCurrency).toFixed(2)}`);

    // Validate
    const errors = [];

    if (matchingExpenses.length !== expected.nights) {
      errors.push(`Night count: expected ${expected.nights}, got ${matchingExpenses.length}`);
    }

    if (JSON.stringify(actualDays) !== JSON.stringify(expected.days)) {
      errors.push(`Days mismatch: expected [${expected.days}], got [${actualDays}]`);
    }

    const priceDiff = Math.abs(totalDbPrice - expected.price);
    const priceThreshold = expected.price * 0.01; // 1% tolerance
    if (priceDiff > priceThreshold && expected.price > 0) {
      errors.push(`Price: expected ${expected.price}, got ${totalDbPrice} (diff: ${priceDiff.toFixed(2)})`);
    }

    if (errors.length > 0) {
      console.log(`\n   ❌ ERRORS FOUND:`);
      errors.forEach(err => console.log(`      - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log(`\n   ✅ CORRECT`);
    }

    // Show details
    if (matchingExpenses.length > 0) {
      console.log(`\n   Details:`);
      matchingExpenses.forEach(e => {
        const dayInfo = dayLookup.get(e.day_id);
        console.log(`      Day ${dayInfo?.dayNumber} (${dayInfo?.date}): ${e.amount} ${e.currency} - "${e.description}"`);
      });
    }
  });

  // Check for unexpected accommodations
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('CHECKING FOR UNEXPECTED ACCOMMODATIONS IN DATABASE');
  console.log('='.repeat(80));

  const expectedNames = EXPECTED_HOTELS.map(h =>
    h.name.replace(/\(Airbnb\)/g, '').trim().toLowerCase()
  );

  const unexpectedAccommodations = accommodations.filter(exp => {
    const cleanName = exp.description
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*-\s*.*$/, '')
      .trim()
      .toLowerCase();

    // Check if this matches any expected hotel
    return !expectedNames.some(expected =>
      cleanName.includes(expected) || expected.includes(cleanName)
    );
  });

  if (unexpectedAccommodations.length > 0) {
    console.log(`\n⚠️  Found ${unexpectedAccommodations.length} unexpected accommodation records:`);
    unexpectedAccommodations.forEach(exp => {
      const dayInfo = dayLookup.get(exp.day_id);
      console.log(`   Day ${dayInfo?.dayNumber} (${dayInfo?.date}): "${exp.description}" - ${exp.amount} ${exp.currency}`);
    });
    console.log('\n   These might be "Additional hotel charges" from daily expenses');
    console.log('   that should NOT be in the accommodation category.');
    totalErrors += unexpectedAccommodations.length;
  } else {
    console.log('\n✅ No unexpected accommodations found');
  }

  // Final summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Expected hotels: ${EXPECTED_HOTELS.length}`);
  console.log(`Expected total nights: 27`);
  console.log(`Database accommodation records: ${accommodations.length}`);
  console.log(`Unexpected records: ${unexpectedAccommodations.length}`);
  console.log(`\nTotal errors found: ${totalErrors}`);

  if (totalErrors === 0) {
    console.log('\n✅✅✅ ALL VALIDATIONS PASSED! ✅✅✅');
  } else {
    console.log(`\n❌❌❌ FOUND ${totalErrors} ERRORS - NEEDS FIXING ❌❌❌`);
  }

  return {
    totalErrors,
    unexpectedCount: unexpectedAccommodations.length,
    expectedCount: EXPECTED_HOTELS.length,
    actualCount: accommodations.length
  };
}

// Make available globally
(window as any).validateAllHotels = validateAllHotels;
