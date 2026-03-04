// Quick script to check Supabase Storage bucket configuration
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pcjfeskhfrxsoxgixmps.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjamZlc2toZnJ4c294Z2l4bXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjczMjIsImV4cCI6MjA4NzI0MzMyMn0.rRCni7vnpkJA7EgxrVq0QhYSqdZ-bSiJouE8AWxzcVU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStorageBucket() {
  console.log('Checking Supabase Storage bucket "design-images"...\n')
  
  // Try to list files in the bucket directly
  const { data: files, error: listError } = await supabase.storage
    .from('design-images')
    .list()
  
  if (listError) {
    console.error('❌ Error accessing bucket "design-images":', listError.message)
    console.log('\nPossible issues:')
    console.log('1. Bucket "design-images" does NOT exist')
    console.log('2. Bucket exists but RLS policies are blocking access')
    console.log('\nSOLUTION: Go to Supabase Dashboard > Storage:')
    console.log('1. Create a new bucket named "design-images"')
    console.log('2. Make it PUBLIC')
    console.log('3. No need for RLS policies on public buckets')
  } else {
    console.log(`✅ Bucket "design-images" exists and is accessible!`)
    console.log(`   Contains ${files.length} file(s)`)
    if (files.length > 0) {
      console.log('\nFirst few files:')
      files.slice(0, 5).forEach(file => {
        console.log(`- ${file.name}`)
      })
    }
  }
  
  // Check existing designs data
  console.log('\n---\nChecking existing designs in database...\n')
  const { data: designs, error: designsError } = await supabase
    .from('designs')
    .select('id, title, images')
    .order('created_at', { ascending: false })
  
  if (designsError) {
    console.error('Error fetching designs:', designsError)
    return
  }
  
  if (designs.length === 0) {
    console.log('No designs in database yet.')
  } else {
    console.log(`Found ${designs.length} design(s):\n`)
    designs.forEach((design, idx) => {
      console.log(`${idx + 1}. ${design.title}:`)
      console.log(`   ID: ${design.id}`)
      console.log(`   Images column type: ${typeof design.images}`)
      console.log(`   Images value:`, design.images)
      if (Array.isArray(design.images)) {
        console.log(`   Number of images: ${design.images.length}`)
        if (design.images.length > 0) {
          design.images.forEach((url, i) => {
            console.log(`   [${i}]: ${url}`)
          })
        }
      }
      console.log('')
    })
  }
  
  // Try uploading a test file
  console.log('---\nTesting direct image upload to bucket...\n')
  const testFileName = `test-${Date.now()}.txt`
  const testFile = new Blob(['Hello from test'], { type: 'text/plain' })
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('design-images')
    .upload(testFileName, testFile)
  
  if (uploadError) {
    console.error('❌ Test upload FAILED:', uploadError.message)
  } else {
    console.log('✅ Test upload SUCCESSFUL!')
    console.log(`   Uploaded: ${uploadData.path}`)
    
    const { data: urlData } = supabase.storage
      .from('design-images')
      .getPublicUrl(testFileName)
    
    console.log(`   Public URL: ${urlData.publicUrl}`)
  }
}

checkStorageBucket()
