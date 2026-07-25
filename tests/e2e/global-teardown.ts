import { createClient } from '@supabase/supabase-js';

/**
 * Deletes contractors created by this E2E run so QA accounts don't pile up
 * in the contractors table. Tests create accounts with emails ending in
 * @example.com (see login-tracking-rate-limit.spec.ts, auth-flow.spec.ts) —
 * anything else is real user data and must never be touched here.
 */
export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.warn('[global-teardown] Missing Supabase service role credentials — skipping test account cleanup.');
    return;
  }

  const supabase = createClient(url, serviceRoleKey);

  const { error, count } = await supabase
    .from('contractors')
    .delete({ count: 'exact' })
    .like('email', '%@example.com');

  if (error) {
    console.warn('[global-teardown] Failed to clean up test contractors:', error.message);
    return;
  }

  console.log(`[global-teardown] Deleted ${count ?? 0} test contractor(s).`);
}
