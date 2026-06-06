import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function validateData() {
  console.log('🔍 Validating honeymoon data...\n');

  const { data: trips } = await supabase.from('trips').select('*');
  console.log('📋 Trips:', trips?.length || 0);
  const trip = trips?.[0];
  if (!trip) {
    console.log('❌ No trip found!');
    return;
  }
  console.log('✅ Trip:', trip.title);

  const { data: days } = await supabase.from('days').select('*').eq('trip_id', trip.id).order('day_number');
  console.log('\n📅 Days:', days?.length || 0);

  const dayIds = days?.map(d => d.id) || [];
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .or(`day_id.in.(${dayIds.join(',')}),day_id.is.null`);

  console.log('\n💰 Total Expenses:', expenses?.length || 0);

  const byCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});
  console.log('By category:', byCategory);

  const accommodations = expenses?.filter(e => e.category === 'accommodation') || [];
  console.log('\n🏨 Accommodations:', accommodations.length);
  
  const daysWithAccommodation = new Set(accommodations.map(e => e.day_id).filter(id => id !== null));
  console.log('Days with hotels:', daysWithAccommodation.size, '/', days?.length);

  console.log('\nFirst 3 hotels:');
  accommodations.slice(0, 3).forEach(a => {
    const day = days?.find(d => d.id === a.day_id);
    console.log(`  Day ${day?.day_number}: ${a.description} - ${a.amount} ${a.currency}`);
  });
}

validateData().catch(console.error);
