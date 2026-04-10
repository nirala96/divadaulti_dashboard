const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupStorage() {
  console.log('🔧 Setting up storage bucket...\n');
  
  // Create public bucket
  const { data: bucket, error: bucketError } = await supabase
    .storage
    .createBucket('design-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    });

  if (bucketError) {
    console.error('❌ Bucket creation failed:', bucketError.message);
    process.exit(1);
  }

  console.log('✅ Storage bucket created:', bucket);
  console.log('📦 Bucket name: design-images');
  console.log('🌐 Public: Yes');
  console.log('📏 Size limit: 5MB');
  
  // Verify bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('\n✅ All buckets:', buckets.map(b => b.name).join(', '));
  
  process.exit(0);
}

setupStorage();
