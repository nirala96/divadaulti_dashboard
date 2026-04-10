# 📸 Image Upload Guide

## How Images Are Optimized (Automatic!)

When you upload ANY image through the dashboard, it's automatically:

1. **Resized** to max 1200px width (maintains aspect ratio)
2. **Compressed** to 80% quality (looks great, 95% smaller!)
3. **Converted** to JPEG format
4. **Cached** for 30 days in browsers

### Example:
- **Before**: 5MB phone photo (4000x3000px)
- **After**: 300KB optimized (1200x900px)
- **Savings**: 94% smaller file size!

## How to Add Images to Designs

### Option A: Design Has NO Images Yet
```
┌─────────────────────┐
│  🖼️ Gray Box        │
│  (Empty Design)     │
│                     │
│  Hover → Upload ⬆️  │ ← Click to select images
└─────────────────────┘
```

**Steps:**
1. Find design with gray image box
2. **Hover over it** → Upload icon appears
3. **Click** → File picker opens
4. **Select 1 or more images** → All upload automatically
5. **Wait ~2-3 seconds** → Images appear!

---

### Option B: Design Has Existing Images
```
┌─────────────────────┐
│  📷 Design Photo    │
│     [+ button]      │ ← Appears on hover (top-right)
│                     │
│  Hover → Cycle      │ ← Shows all images
│  through images     │
└─────────────────────┘
```

**Steps:**
1. **Hover over existing image** → Blue **+** button appears (top-right corner)
2. **Click the +** → File picker opens
3. **Select more images** → Adds to existing collection
4. **Images cycle automatically** when you hover (800ms each)

---

### Option C: Old Image Unavailable (Red Box)
```
┌─────────────────────┐
│  🔴 ❌ Error        │
│  (Old broken link)  │
│                     │
│  Hover → Replace    │ ← Upload new images
└─────────────────────┘
```

**Steps:**
1. Red box indicates old image is inaccessible
2. **Hover** → Upload icon appears
3. **Click** → Upload new image(s)
4. **Replaces broken image**

---

## 🎯 Pro Tips

### Upload Multiple at Once
- Select 5-10 images → All optimize and upload together
- Great for bulk updates!

### Image Counter
When design has multiple images:
```
┌─────────────────────┐
│                     │
│     Design Photo    │
│                     │
│     ┌─────┐         │
│     │ 3/5 │         │ ← Shows current/total
│     └─────┘         │
└─────────────────────┘
```

### Hover to Preview All
- **Hover over thumbnail** → Automatically cycles through all images
- **No clicking needed** → Just hover!
- **800ms per image** → Smooth transition

### File Formats Supported
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png) 
- ✅ WebP (.webp)
- ✅ GIF (.gif)

### Size Limits
- **Max per file**: 5MB
- **Recommended**: Under 2MB (faster upload)
- **Auto-compression**: Makes all files ~300KB anyway!

---

## 🎬 Quick Demo Flow

1. **Go to Dashboard** → http://localhost:3001
2. **Find any design tile**
3. **Hover over image area**
4. **Watch for:**
   - Gray box → Upload icon
   - Existing image → Blue + button
   - Multiple images → Counter showing 1/3, 2/3, etc.
5. **Click upload** → Select images
6. **Wait 2-3 seconds** → Done!

---

## 🐛 Troubleshooting

### "Failed to upload images"
- **Storage not set up**: Run [`setup_storage.sql`](setup_storage.sql) in Supabase
- **File too large**: Max 5MB per file
- **Wrong format**: Only images allowed

### "Image won't display"
- **Browser cache**: Hard refresh (Cmd+Shift+R)
- **Check URL**: Should be `tgwrwwxbygygvbucqxwg.supabase.co/storage/...`
- **Old images**: From previous Supabase, need to re-upload

### "Upload is slow"
- **Large files**: Compressing a 10MB photo takes ~2-3 seconds
- **Multiple files**: Uploading 5 images = 10-15 seconds total
- **Normal**: Client-side compression takes time but saves bandwidth!

---

## ✅ Best Practices

1. **Upload once**: Don't spam upload button (wait for completion)
2. **Reasonable sizes**: 1-2MB files upload fastest
3. **Batch uploads**: Upload 5-10 at once instead of one-by-one
4. **Monitor storage**: Check Supabase dashboard monthly
5. **Delete unused**: Old broken images don't count toward storage

---

## 📊 What Happens Behind the Scenes

```
Your Image (5MB) 
    ↓
[Compress in Browser]
    ↓
Compressed (300KB)
    ↓
[Upload to Supabase]
    ↓
[Store with 30-day cache]
    ↓
[Display in Dashboard] ✨
```

**Key Point**: Compression happens IN YOUR BROWSER before upload!
- No server processing needed
- Saves your bandwidth
- Saves Supabase bandwidth
- Everyone wins! 🎉
