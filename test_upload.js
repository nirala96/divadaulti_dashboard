const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  console.log('🧪 Testing direct upload to design-images bucket...\n');
  
  // Try to upload directly
  const testBlob = Buffer.from('test upload');
  const fileName = `test_${Date.now()}.txt`;
  
  console.log('Attempting upload:', fileName);
  const { data, error } = await supabase.storage
    .from('design-images')
    .upload(fileName, testBlob);
  
  if (error) {
    console.log('❌ Upload FAILED');
    console.log('Error:', error.message);
    console.log('Status:', error.statusCode || error.status);
    console.log('\nThis means the RLS policies are still blocking uploads.');
    console.log('Try running the SQL script again in Supabase SQL Editor.');
  } else {
    console.log('✅ Upload SUCCESSFUL!');
    console.log('File uploaded:', data.path);
    console.log('\n🎉 Storage is working! You can now upload images from your dashboard.');
    
    // Clean up
    await supabase.storage.from('design-images').remove([fileName]);
    console.log('Test file cleaned up.');
  }
  
  process.exit(error ? 1 : 0);
}

testUpload();
