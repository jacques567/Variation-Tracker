import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Fetch all necessary data for initial state
  const [
    { data: contractors },
    { data: jobs },
    { data: variations },
    { data: signatures },
  ] = await Promise.all([
    supabase.from('contractors').select('*'),
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('variations').select('*'),
    supabase.from('signatures').select('*').order('signed_at', { ascending: false }),
  ])

  return (
    <AdminDashboard
      initialContractors={contractors || []}
      initialJobs={jobs || []}
      initialVariations={variations || []}
      initialSignatures={signatures || []}
    />
  )
}
