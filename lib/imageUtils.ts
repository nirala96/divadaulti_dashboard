// Image Upload with Automatic Compression
// Add this helper function to compress images before uploading

export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new window.Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = reject
      img.src = e.target?.result as string
    }
    
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Usage in upload handlers:
const handleImageUpload = async (files: FileList) => {
  for (const file of Array.from(files)) {
    // Compress before uploading
    const compressed = await compressImage(file, 1200, 0.8)
    
    // Upload compressed version
    const { data, error } = await supabase.storage
      .from('design-images')
      .upload(fileName, compressed, {
        cacheControl: '2592000', // 30 days cache
        upsert: true
      })
  }
}
