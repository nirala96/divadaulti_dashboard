// Fixed color per client tag, so the same tag always looks the same everywhere.
const CLIENT_TAG_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  Diamond: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  Silver: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
  Plastic: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }

export function getClientTagColor(tag: string) {
  return CLIENT_TAG_PALETTE[tag] ?? DEFAULT_COLOR
}
