// Password hashing and session-cookie signing for named dashboard logins.
// Built entirely on Web Crypto (no node:crypto) so this same module works
// both in Node (server actions, API routes) and in the Edge middleware.

const encoder = new TextEncoder()

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

async function pbkdf2(password: string, salt: Uint8Array, iterations = 100_000): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt)
  return `${toHex(salt)}:${toHex(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const hash = await pbkdf2(password, fromHex(saltHex))
  return toHex(hash) === hashHex
}

// Session cookie for named logins - separate from the existing shared
// admin-auth cookie, which is untouched. Format is "<username>:<role>.<hmac>";
// role travels inside the signed payload so Edge middleware can enforce
// role-based page access without a DB round-trip on every request
// (important since Edge middleware can't reach Postgres).
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "divadaulti2024"

export type SessionInfo = { username: string; role: string }

async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  return toHex(new Uint8Array(sig))
}

export async function signSession(username: string, role: string): Promise<string> {
  const payload = `${username}:${role}`
  return `${payload}.${await hmac(payload)}`
}

export async function verifySession(token: string | undefined | null): Promise<SessionInfo | null> {
  if (!token) return null
  const separatorIndex = token.lastIndexOf(".")
  if (separatorIndex === -1) return null
  const payload = token.slice(0, separatorIndex)
  const signature = token.slice(separatorIndex + 1)
  if (signature !== (await hmac(payload))) return null
  const colonIndex = payload.indexOf(":")
  if (colonIndex === -1) return null
  return { username: payload.slice(0, colonIndex), role: payload.slice(colonIndex + 1) }
}
