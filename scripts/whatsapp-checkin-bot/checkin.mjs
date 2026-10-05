#!/usr/bin/env node
// WhatsApp -> Daily Check-In bot (runs on the office Mac, see README.md).
//
// Reads ONLY the group names and last-message times from the WhatsApp Mac
// app's local database (read-only), keeps the groups that had a message
// today (IST), and sends those names to the dashboard, which ticks the
// matching clients. No message contents ever leave this Mac, and nothing
// is sent or clicked in WhatsApp.
//
// Usage: node checkin.mjs [--dry-run] [--no-wait]

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DB_PATH = join(homedir(), 'Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite')
const APPLE_EPOCH_OFFSET = 978307200 // seconds between 1970-01-01 and 2001-01-01
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const noWait = args.has('--no-wait')

const log = (...parts) => console.log(new Date().toISOString(), ...parts)
const istDateKey = (ms) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10)

function loadEnv() {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

function isWhatsAppRunning() {
  try {
    execFileSync('pgrep', ['-x', 'WhatsApp'])
    return true
  } catch {
    return false
  }
}

// Make sure WhatsApp is running (in the background) and has had time to
// sync messages that arrived while it was closed or the Mac was asleep.
async function ensureWhatsAppSynced() {
  if (noWait) return
  const wasRunning = isWhatsAppRunning()
  if (!wasRunning) {
    log('WhatsApp not running - opening it in the background')
    execFileSync('open', ['-g', '-a', 'WhatsApp'])
  }
  const seconds = wasRunning ? 20 : 90
  log(`Waiting ${seconds}s for WhatsApp to sync...`)
  await new Promise((r) => setTimeout(r, seconds * 1000))
}

function readGroupsActiveToday() {
  if (!existsSync(DB_PATH)) throw new Error(`WhatsApp database not found at ${DB_PATH}`)
  const sql = `SELECT ZPARTNERNAME AS name, ZLASTMESSAGEDATE AS last
               FROM ZWACHATSESSION
               WHERE ZCONTACTJID LIKE '%@g.us' AND ZPARTNERNAME IS NOT NULL AND ZLASTMESSAGEDATE IS NOT NULL`
  let out
  try {
    out = execFileSync('sqlite3', ['-readonly', '-json', DB_PATH, sql], { encoding: 'utf8' })
  } catch (err) {
    const msg = String(err.stderr || err.message)
    if (/authorization denied|operation not permitted|unable to open/i.test(msg)) {
      throw new Error(
        `macOS blocked reading the WhatsApp database. Give Full Disk Access to ${process.execPath} ` +
        '(System Settings > Privacy & Security > Full Disk Access). Details: ' + msg.trim()
      )
    }
    throw err
  }
  const rows = out.trim() ? JSON.parse(out) : []
  const today = istDateKey(Date.now())
  return rows
    .filter((r) => istDateKey((Number(r.last) + APPLE_EPOCH_OFFSET) * 1000) === today)
    .map((r) => r.name)
}

async function main() {
  loadEnv()
  const url = process.env.DASHBOARD_URL
  const token = process.env.CHECKIN_BOT_TOKEN
  if (!url || !token) throw new Error('Set DASHBOARD_URL and CHECKIN_BOT_TOKEN in scripts/whatsapp-checkin-bot/.env')

  await ensureWhatsAppSynced()
  const groups = readGroupsActiveToday()
  log(`${groups.length} group(s) with a message today${dryRun ? ' (dry run)' : ''}`)
  if (dryRun) groups.forEach((g) => log('  group:', g))

  const res = await fetch(new URL('/api/checkins/auto', url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-bot-token': token },
    body: JSON.stringify({ groups, dryRun }),
  })
  if (!res.ok) throw new Error(`Dashboard replied ${res.status}: ${await res.text()}`)
  const result = await res.json()
  log(`${dryRun ? 'Would tick' : 'Ticked'} (${result.ticked.length}):`, result.ticked.join(', ') || '-')
  log(`Already checked (${result.alreadyChecked.length}):`, result.alreadyChecked.join(', ') || '-')
  log(`No group today (${result.unmatchedClients.length}):`, result.unmatchedClients.join(', ') || '-')
}

main().catch((err) => {
  log('ERROR:', err.message)
  process.exit(1)
})
