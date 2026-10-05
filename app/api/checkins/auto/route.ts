import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getClientCheckins, setClientCheckin } from '@/lib/actions'

// Called by the WhatsApp check-in bot on the office Mac
// (scripts/whatsapp-checkin-bot) at 1 PM and 6 PM with the names of the
// WhatsApp groups that had a message today. Any active client whose name
// appears in one of those group names gets ticked on Daily Check-In.
// The bot only ever ticks - it never unticks a client.
// Auth is a shared secret header since the bot has no login cookie.

const MIN_CLIENT_NAME_LENGTH = 3

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CHECKIN_BOT_TOKEN
  const given = request.headers.get('x-bot-token')
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const groups: unknown = body?.groups
  if (!Array.isArray(groups) || !groups.every((g) => typeof g === 'string')) {
    return NextResponse.json({ error: 'groups must be an array of strings' }, { status: 400 })
  }
  const dryRun = body?.dryRun === true
  // Pad with spaces so "ram" matches the word in "ram exports" but not "ramesh".
  const groupNames = (groups as string[]).map((g) => ` ${normalize(g)} `)

  const clients = await getClientCheckins()
  const ticked: string[] = []
  const alreadyChecked: string[] = []
  const unmatchedClients: string[] = []

  for (const client of clients) {
    const name = normalize(client.client_name)
    const matched =
      name.length >= MIN_CLIENT_NAME_LENGTH && groupNames.some((g) => g.includes(` ${name} `))
    if (!matched) {
      unmatchedClients.push(client.client_name)
    } else if (client.checked_today) {
      alreadyChecked.push(client.client_name)
    } else {
      if (!dryRun) await setClientCheckin(client.client_id, true)
      ticked.push(client.client_name)
    }
  }

  return NextResponse.json({ dryRun, ticked, alreadyChecked, unmatchedClients })
}
