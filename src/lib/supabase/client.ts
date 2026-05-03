import { createBrowserClient } from '@supabase/ssr'

let cachedBrowserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (cachedBrowserClient) {
    return cachedBrowserClient
  }

  cachedBrowserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return cachedBrowserClient
}
