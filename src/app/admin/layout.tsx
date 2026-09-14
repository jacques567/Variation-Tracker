import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from '@/components/admin/AdminNav'
import ExitAdminButton from '@/components/admin/ExitAdminButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Use SECURITY DEFINER RPC — admin_emails SELECT is blocked by RLS (USING false),
  // so the session client cannot query it directly. is_admin() reads auth.email()
  // from the JWT internally and bypasses the RLS restriction safely.
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError) {
    console.error('[admin] is_admin() RPC failed:', adminError)
  }

  if (!isAdmin) {
    redirect('/jobs')
  }

  return (
    <div className="relative min-h-screen bg-vt-light overflow-hidden">
      <Image
        src="/images/bg-app.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-[#0F1720] border-b border-[#1F2937]">
          <div className="max-w-[1152px] mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/VarTrackerLogo3Trans.png"
                alt=""
                width={34}
                height={34}
                className="h-[34px] w-[34px] object-contain"
              />
              <span className="text-base font-bold text-white">Admin</span>
              <AdminNav />
            </div>
            <ExitAdminButton />
          </div>
        </header>
        <main className="flex-1 max-w-[1152px] mx-auto px-4 py-7 w-full pb-12">
          {children}
        </main>
      </div>
    </div>
  )
}
