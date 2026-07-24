import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { generateCorrelationId, setCorrelationId } from '@/lib/correlation-id'

export async function proxy(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId()
  setCorrelationId(correlationId)
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
