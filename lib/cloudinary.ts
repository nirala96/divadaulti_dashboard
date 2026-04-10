/**
 * Cloudinary Image Upload Helper
 * Replace Supabase Storage with Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param file - File object from form input
 * @returns Public URL of uploaded image
 */
export async function uploadImage(file: File): Promise<string> {
  // Convert File to Buffer for cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'design-images',
        resource_type: 'auto',
        quality: 'auto:good', // Auto-optimize quality
        fetch_format: 'auto', // Auto-select best format (webp, etc.)
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    ).end(buffer);
  });
}

/**
 * Upload multiple files
 * @param files - Array of File objects
 * @returns Array of public URLs
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Cloudinary public ID (extract from URL)
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Extract Cloudinary public ID from URL
 * Example: https://res.cloudinary.com/cloud/image/upload/v1234/design-images/img.jpg
 * Returns: design-images/img
 */
export function extractPublicId(url: string): string {
  const matches = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i);
  return matches ? matches[1] : '';
}

export default cloudinary;
