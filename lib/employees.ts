// Fixed employee roster for production stage attribution and performance tracking.
// Kept out of actions.ts because "use server" files may only export async functions.

export const PATTERN_MASTER = 'Prasanjit'
export const CUTTING_MASTER = 'Sushant'
export const KARIGAAR_NAMES = ['Sehnawaj', 'Nanhe', 'Asif', 'Mulla ji', 'Alam', 'Firoz', 'Others']

export const STAGE_FIXED_EMPLOYEES: Record<string, string> = {
  'Pattern': PATTERN_MASTER,
  'Cutting': CUTTING_MASTER,
}
