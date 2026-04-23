import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Check if this is an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // For now, just allow access - actual admin check will happen in the page component
    // This allows the page to redirect to /jobs if not admin
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
