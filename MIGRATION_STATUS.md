# Code Migration Status - Railway PostgreSQL + Cloudinary

## ✅ Completed

### Infrastructure
- ✅ Railway PostgreSQL database created and populated
- ✅ Cloudinary account configured
- ✅ Environment variables set in Railway

### New Files Created
- ✅ `lib/actions.ts` - Server actions for database operations
- ✅ `lib/database.ts` - PostgreSQL connection pool
- ✅ `lib/cloudinary.ts` - Cloudinary image upload helpers
- ✅ `app/api/upload/route.ts` - API route for image uploads

### components/ProductionStatusBoard.tsx Updates
- ✅ Replaced Supabase imports with server actions
- ✅ Added uploadImagesToCloudinary helper function
- ✅ Updated ImageCarousel handleImageUpload
- ✅ Updated handleImageUploadForDesign
- ✅ Updated fetchDesigns to use getDesignsWithClients()
- ✅ Updated saveNotes to use API upload + updateDesignNotes()
- ✅ Updated handleSaveNewDesign to use API upload + addDesign()

## ⚠️ Still TODO in ProductionStatusBoard.tsx

Need to replace these remaining Supabase calls with server actions:

1. **handleUpdateDesignImages** (line ~327) - Use `updateDesignImages()`
2. **updateStageStatus** (line ~487) - Use `updateDesignStageStatus()`
3. **handleCompleteDesign** (line ~515) - Use `completeDesign()`
4. **handleDeleteDesign** (line ~543) - Use `deleteDesign()`
5. **handleDragEnd** (line ~652) - Use `updateDesignOrder()` / `updateClientOrder()`
6. **reindexDesignsForClient** (line ~687) - Use `updateDesignOrder()`
7. **Other priority/order updates** (lines ~898, 1005) - Use server actions

## ⚠️ Other Components TODO

### components/AddClientModal.tsx
- Replace `supabase.from('clients').insert()` with `addClient()` action

### components/CompletedOrders.tsx
- Replace `supabase.from('designs').select()` with `getCompletedDesigns()` action

### components/WorkPoints.tsx
- Replace all `supabase.from('work_points')` with work point actions

### components/TimelineGanttView.tsx
- Replace `supabase.from('designs').select()` with `getDesigns()` action

### app/clients/page.tsx
- Replace `supabase.from('clients')` with `getClients()` action

## 🚀 Deployment Strategy

Since full migration is complex, **Option A: Deploy with current Supabase first**

1. Set Supabase env vars in Railway for now
2. Deploy and verify everything works
3. Gradual migration: Update one component at a time
4. Final cutover when all components use PostgreSQL

**Commands:**
```bash
# Set temporary Supabase vars
railway variables set \
  NEXT_PUBLIC_SUPABASE_URL='https://tgwrwwxbygygvbucqxwg.supabase.co' \
  NEXT_PUBLIC_SUPABASE_ANON_KEY='your-key'

# Deploy
railway up
```

## 📖 Migration Guide

When ready to complete migration, follow this order:

1. Update remaining ProductionStatusBoard operations
2. Update AddClientModal
3. Update WorkPoints
4. Update CompletedOrders  
5. Update TimelineGantt
6. Update Clients page
7. Remove Supabase environment variables
8. Final deployment test

Each component can be tested independently.
