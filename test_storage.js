const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('🔍 Checking storage bucket status...\n');
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Error listing buckets:', listError.message);
    process.exit(1);
  }
  
  console.log('📦 Buckets found:', buckets.length);
  if (buckets.length > 0) {
    buckets.forEach(b => {
      console.log('  - Name:', b.name);
      console.log('    Public:', b.public);
      console.log('    ID:', b.id);
      console.log('');
    });
  } else {
    console.log('\n⚠️  NO BUCKETS EXIST!');
    console.log('\n🔧 To fix this:');
    console.log('1. Go to: https://tgwrwwxbygygvbucqxwg.supabase.co');
    console.log('2. Click "SQL Editor" in left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy/paste the contents of setup_storage.sql');
    console.log('5. Click "Run"');
    process.exit(1);
  }
  
  // Try to test upload
  console.log('🧪 Testing upload permission...');
  const testBlob = Buffer.from('test');
  const { error: uploadError } = await supabase.storage
    .from('design-images')
    .upload('test_' + Date.now() + '.txt', testBlob);
  
  if (uploadError) {
    console.log('❌ Upload test FAILED:', uploadError.message);
    console.log('   Status:', uploadError.statusCode || uploadError.status);
    console.log('\n🔧 The bucket exists but uploads are blocked.');
    console.log('   This means the RLS policies need to be fixed.');
    console.log('\n   Run the setup_storage.sql script again in Supabase SQL Editor.');
  } else {
    console.log('✅ Upload test PASSED!');
    console.log('   Storage is configured correctly.');
    // Clean up
    await supabase.storage.from('design-images').remove(['test_' + Date.now() + '.txt']);
  }
  
  process.exit(0);
}

check();
