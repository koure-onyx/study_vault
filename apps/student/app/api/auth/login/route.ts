import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Use Google OAuth to sign in. Email/password login is disabled.' }, 
    { status: 410 }
  )
}
