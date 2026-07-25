'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Keeps an open job page in sync when a client signs a variation elsewhere.
 *
 * Renders nothing. On a relevant change it calls router.refresh(), which re-runs
 * the server component and swaps in fresh RSC payload without touching client
 * state — so an expanded photo or a focused field survives the update.
 *
 * Two independent triggers, because realtime alone is not a guarantee:
 *   1. A postgres_changes subscription scoped to this job's variations.
 *   2. Tab focus / visibility, which re-syncs even if the socket was asleep,
 *      blocked by a proxy, or the table ever drops out of the realtime
 *      publication again (it was empty until migration 019).
 *
 * RLS applies to the realtime stream, so a subscriber only ever receives rows for
 * jobs they own — the job_id filter is a bandwidth optimisation, not the security
 * boundary.
 */
export default function VariationsLiveUpdater({ jobId }: { jobId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`job-variations:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'variations',
          filter: `job_id=eq.${jobId}`,
        },
        () => router.refresh()
      )
      .subscribe()

    // Fallback re-sync. Cheap: an RSC refetch of one page, only when the tab is
    // actually being looked at.
    function resyncIfVisible() {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    document.addEventListener('visibilitychange', resyncIfVisible)
    window.addEventListener('focus', resyncIfVisible)

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', resyncIfVisible)
      window.removeEventListener('focus', resyncIfVisible)
    }
  }, [jobId, router])

  return null
}
