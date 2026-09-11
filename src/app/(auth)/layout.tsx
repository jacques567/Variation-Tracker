import { redirect } from 'next/navigation'
import { Poppins } from 'next/font/google'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { isBetaMode } from '@/lib/subscription-evaluation'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Production (non-beta) deployments are coming-soon-only — the auth pages
  // only exist for the beta site. Anyone hitting /login, /register, or
  // /forgot-password directly on the live domain lands back on the landing page.
  if (!isBetaMode()) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles this first, but guard here as defence-in-depth
  if (user) redirect('/jobs')

  return (
    <div className={`${poppins.variable} font-[family-name:var(--font-poppins)] relative min-h-dvh bg-vt-light overflow-hidden`}>
      <Image
        src="/images/bg-auth.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative flex justify-center px-4 pt-16 pb-4 sm:pt-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5">
              <Image src="/VarTrackerLogo3Trans.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <span className="text-2xl font-bold text-vt-dark tracking-tight">VarTracker</span>
            </div>
            <p className="text-sm text-vt-muted mt-1">Variation & Change Order Tracker</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
