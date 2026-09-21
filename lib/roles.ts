// Single source of truth for what a merchandiser login can see - used by
// both the Edge middleware (to enforce it) and the Sidebar (to avoid
// showing links a merchandiser can't actually open).
export const MERCHANDISER_ALLOWED_PATHS = ['/', '/todays-plan', '/daily-checkin', '/timeline', '/work-points']
