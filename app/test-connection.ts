// Quick debug test to check Supabase connection in browser
// Open browser console (F12) and check for errors

console.log('🔍 Testing Supabase connection from browser...');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

import { supabase } from '@/lib/supabase';

// Test fetching clients
supabase
  .from('clients')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error fetching clients:', error);
    } else {
      console.log('✅ Clients fetch successful:', data);
    }
  });

// Test fetching designs
supabase
  .from('designs')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Error fetching designs:', error);
    } else {
      console.log('✅ Designs fetch successful:', data);
    }
  });
