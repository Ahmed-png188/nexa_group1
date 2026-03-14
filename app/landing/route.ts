import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

// Serve the static landing page
export async function GET() {
  try {
    const html = readFileSync(join(process.cwd(), 'public', 'landing.html'), 'utf-8')
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch {
    return NextResponse.redirect('/auth/signup')
  }
}
