import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  cookies().delete('admin-auth')
  cookies().delete('user-session')
  return NextResponse.json({ success: true })
}
