import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { evaluateSubscription } from '@/lib/subscription-guard'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // getUser() validates the JWT server-side and refreshes the session if needed.
  // getSession() only trusts the client-supplied token — do not use it here.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/reset-password'

  const isPublicRoute =
    pathname.startsWith('/sign') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/cookies')

  const isRootRoute = pathname === '/'

  if (!user && !isAuthRoute && !isPublicRoute && !isRootRoute) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the intended destination (including query string) so the user
    // lands where they were going after authenticating.
    loginUrl.searchParams.set('next', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectTo =
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/jobs'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Subscription paywall — gate dashboard pages when the user has no valid sub.
  // /subscribe and /admin are exempt (subscribe lets them pay; admin is a separate gate).
  if (
    user &&
    !isAuthRoute &&
    !isPublicRoute &&
    !isRootRoute &&
    !pathname.startsWith('/subscribe') &&
    !pathname.startsWith('/admin')
  ) {
    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('subscription_status, trial_ends_at, grace_period_expires_at')
      .eq('id', user.id)
      .maybeSingle()

    if (contractorError) {
      // Transport/connection error — fail open. API routes still enforce subscription
      // via checkSubscription(), so this isn't a security hole. Avoids kicking paying
      // users to /subscribe on a flaky DB read.
      console.error('[proxy] contractor lookup failed, allowing request through:', contractorError.message)
      return supabaseResponse
    }

    const { isValid } = evaluateSubscription(contractor)
    if (!isValid) {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  return supabaseResponse
}
