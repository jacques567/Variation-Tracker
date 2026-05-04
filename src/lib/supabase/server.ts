import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

let cachedServerClient: ReturnType<typeof createServerClient<Database>> | null = null

export async function createClient() {
  if (cachedServerClient) {
    return cachedServerClient
  }

  const cookieStore = await cookies()

  cachedServerClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server component — cookie writes ignored
          }
        },
      },
    }
  )

  return cachedServerClient
}

export function resetClient() {
  cachedServerClient = null
}
