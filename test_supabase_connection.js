// Test Supabase Connection with New Database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey?.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Count Clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact' });
    
    if (clientsError) throw clientsError;
    console.log('✅ Clients:', clients?.length || 0);

    // Test 2: Count Designs
    const { data: designs, error: designsError } = await supabase
      .from('designs')
      .select('*', { count: 'exact' });
    
    if (designsError) throw designsError;
    console.log('✅ Designs:', designs?.length || 0);

    // Test 3: Count Tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact' });
    
    if (tasksError) throw tasksError;
    console.log('✅ Tasks:', tasks?.length || 0);

    // Test 4: Workforce Settings
    const { data: workforce, error: workforceError } = await supabase
      .from('workforce_settings')
      .select('*');
    
    if (workforceError) throw workforceError;
    console.log('✅ Workforce Settings:', workforce?.length || 0);

    console.log('\n✨ Connection successful! Your app is ready to use.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
