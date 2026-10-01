// "Nudge on WhatsApp" from the user's own WhatsApp: a browser tab can't
// type into another tab, so we open WhatsApp Web with the message pre-filled
// and the user picks the group and presses Send. Reuses one named window so
// repeated nudges don't pile up tabs.
export function openWhatsApp(text: string) {
  window.open(`https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`, 'divadaulti-whatsapp')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
