/**
 * Migrate images from Supabase Storage to Cloudinary
 * Prerequisites:
 *   1. Cloudinary account created
 *   2. Cloudinary credentials in .env.local
 *   3. Data imported to Railway database
 * 
 * Run: node scripts/migrate_images.js
 */

const cloudinary = require('cloudinary').v2;
const { Client } = require('pg');
const axios = require('axios');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Railway database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function migrateImages() {
  console.log('🚀 Starting image migration to Cloudinary...\n');
  
  // Verify Cloudinary config
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    console.error('❌ Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
    console.log('Add Cloudinary credentials to .env.local');
    process.exit(1);
  }
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');
    
    // Get all designs with images
    const result = await client.query(
      'SELECT id, title, images FROM designs WHERE images IS NOT NULL AND array_length(images, 1) > 0'
    );
    
    const designs = result.rows;
    console.log(`Found ${designs.length} designs with images\n`);
    
    let migratedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < designs.length; i++) {
      const design = designs[i];
      console.log(`[${i + 1}/${designs.length}] Migrating images for: ${design.title}`);
      
      if (!design.images || design.images.length === 0) continue;
      
      const newImageUrls = [];
      
      for (const oldUrl of design.images) {
        try {
          // Skip if already on Cloudinary
          if (oldUrl.includes('cloudinary.com')) {
            console.log(`  ⏭️  Already on Cloudinary: ${oldUrl.substring(0, 50)}...`);
            newImageUrls.push(oldUrl);
            continue;
          }
          
          // Download from Supabase
          console.log(`  📥 Downloading: ${oldUrl.substring(0, 50)}...`);
          const response = await axios.get(oldUrl, { responseType: 'arraybuffer' });
          
          const buffer = Buffer.from(response.data);
          
          // Upload to Cloudinary
          console.log(`  📤 Uploading to Cloudinary...`);
          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                folder: 'design-images',
                resource_type: 'auto',
                quality: 'auto:good',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
          
          newImageUrls.push(uploadResult.secure_url);
          console.log(`  ✅ Migrated: ${uploadResult.secure_url.substring(0, 60)}...`);
          migratedCount++;
          
        } catch (error) {
          console.error(`  ❌ Failed to migrate ${oldUrl}:`, error.message);
          newImageUrls.push(oldUrl); // Keep old URL if migration fails
          failedCount++;
        }
      }
      
      // Update database with new URLs
      await client.query(
        'UPDATE designs SET images = $1 WHERE id = $2',
        [newImageUrls, design.id]
      );
      console.log(`  💾 Updated database\n`);
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} images`);
    console.log(`   ❌ Failed migrations: ${failedCount} images`);
    console.log(`   📦 Total designs processed: ${designs.length}`);
    
    if (failedCount === 0) {
      console.log('\n🎉 All images migrated successfully!');
    } else {
      console.log('\n⚠️  Some images failed to migrate. Check logs above.');
    }
    
    console.log('\nNext steps:');
    console.log('1. Update lib/database.ts with Railway connection');
    console.log('2. Update components to use Cloudinary upload');
    console.log('3. Test locally with Railway DATABASE_URL');
    console.log('4. Deploy to Railway');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateImages();
