import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let cachedBrowserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (cachedBrowserClient) {
    return cachedBrowserClient
  }

  cachedBrowserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return cachedBrowserClient
}
