# 🚨 Avoiding Supabase Quota Issues - Best Practices

## 📊 What Causes High Egress?

1. **Large uncompressed images** (1-5MB each)
2. **No browser caching** (images downloaded every page load)
3. **Full-size images for thumbnails** (loading 5MB image to show 48px thumbnail)
4. **Frequent API calls** without pagination
5. **No CDN caching**

## ✅ Solutions Implemented

### 1. Image Compression (lib/imageUtils.ts)
- Resize images to max 1200px width
- Compress to 80% quality (JPEG)
- **Savings**: 5MB → ~300KB (95% reduction)

### 2. Next.js Image Component
Already using `next/image` with:
- `unoptimized` flag (no Next.js optimization server needed)
- Proper `sizes="48px"` for thumbnails
- **This tells browser to load appropriate size**

### 3. Browser Caching
- Set `cacheControl: '2592000'` (30 days) on all uploads
- Images cached locally, not re-downloaded
- **Savings**: 100 page loads = 1 download instead of 100

### 4. Storage Policies
- File size limit: 5MB max per file
- Only allowed mime types: jpeg, png, webp, gif

## 🎯 Action Items

### Immediate (Do Now):
1. ✅ Run `configure_storage_limits.sql` in Supabase
2. ✅ Use `compressImage()` helper in all upload functions
3. ✅ Always set cacheControl: '2592000' when uploading
4. 📊 Monitor usage in Supabase Dashboard → Settings → Usage

### Code Changes Needed:
Update ProductionStatusBoard.tsx upload functions to use compression:

```typescript
import { compressImage } from '@/lib/imageUtils'

// In handleImageUpload:
const compressed = await compressImage(file, 1200, 0.8)

const { data, error } = await supabase.storage
  .from('design-images')
  .upload(filePath, compressed, {
    cacheControl: '2592000', // 30 days
    upsert: true
  })
```

### Ongoing Monitoring:
1. Check Supabase Dashboard monthly for:
   - **Storage**: Keep under 1GB for free tier
   - **Egress**: Keep under 2GB/month for free tier
   - **Database**: Keep under 500MB

2. If approaching limits:
   - Delete old unused images from Storage
   - Further compress images (reduce quality to 70%)
   - Consider upgrading to Pro plan ($25/month)

## 📈 Expected Improvements

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Image Size | 5MB | 300KB | 95% |
| Page Load | 168 images × 5MB = 840MB | 168 × 300KB = 50MB | 94% |
| Monthly Egress (100 visits) | 84GB | 5GB | 94% |

## 🔍 How to Check Current Usage

1. Go to: https://tgwrwwxbygygvbucqxwg.supabase.co/project/_/settings/billing
2. Look at:
   - **Database size**
   - **Storage size** 
   - **Egress** (bandwidth used)
3. Set up email alerts for 80% usage

## 🚨 Warning Signs

Watch for:
- ❌ Images loading slowly
- ❌ Storage approaching 1GB
- ❌ Egress over 1.5GB/month
- ❌ API responses getting slower

## 💡 Pro Tips

1. **Use WebP format** (smaller than JPEG):
   - Change compressImage quality to 'image/webp'
   - 30% smaller than JPEG

2. **Lazy loading**: Already implemented via Next.js Image

3. **Pagination**: For large lists, load 20-50 items at a time

4. **Response caching**: Cache API responses for 5 minutes:
   ```typescript
   // In fetch calls:
   .select('*', { 
     count: 'exact',
     cache: 'force-cache' 
   })
   ```

5. **Delete old images**: When updating design images, delete old ones:
   ```typescript
   // Before uploading new image
   const oldPath = oldUrl.split('/').pop()
   await supabase.storage
     .from('design-images')
     .remove([oldPath])
   ```

## 📱 Netlify Deployment

Netlify has its own bandwidth limits:
- **Free tier**: 100GB/month
- With caching enabled, this should be plenty
- Images served from Supabase, not Netlify

## Summary

**Do these 3 things NOW**:
1. Run `configure_storage_limits.sql`
2. Import and use `compressImage()` in all upload handlers
3. Check Supabase usage dashboard weekly for first month

**Result**: Stay well under free tier limits even with heavy usage! 🎉
