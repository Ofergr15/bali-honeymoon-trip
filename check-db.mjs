import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jcsqpjdtfkiorsaugosn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impjc3FwamR0Zmtpb3JzYXVnb3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDA3MDUsImV4cCI6MjA5MDcxNjcwNX0.z2JsigrqpAzo3VAE6bF1oR_DOuNxrK16rdHIG4i5kUs'
);

console.log('Checking database...\n');

const { data: trips } = await supabase.from('trips').select('*');
console.log('Trips:', trips?.length || 0);

const { data: days } = await supabase.from('days').select('*');
console.log('Days:', days?.length || 0);

const { data: activities } = await supabase.from('activities').select('*');
console.log('Activities:', activities?.length || 0);

const { data: hotels } = await supabase.from('hotels').select('*');
console.log('Hotels:', hotels?.length || 0);

if (activities?.length > 0) {
  console.log('\nSample activity:', activities[0]);
}
