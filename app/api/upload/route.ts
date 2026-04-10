/**
 * API Route for Image Uploads to Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadImage, uploadMultipleImages } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }
    
    // Upload all files to Cloudinary
    const urls = await uploadMultipleImages(files)
    
    return NextResponse.json({ urls })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    )
  }
}
