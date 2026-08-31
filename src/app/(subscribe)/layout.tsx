import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Poppins } from 'next/font/google'
import Image from 'next/image'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export default async function SubscribeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className={`${poppins.variable} font-[family-name:var(--font-poppins)] relative min-h-screen bg-vt-light overflow-hidden flex items-center justify-center`}>
      <Image
        src="/images/bg-auth.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative z-10 w-full max-w-[400px] px-4 py-10">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <Image src="/VarTrackerLogo3Trans.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-[22px] font-bold text-vt-dark tracking-tight">VarTracker</span>
          </div>
          <p className="text-[13px] text-vt-muted">Variation &amp; Change Order Tracker</p>
        </div>
        {children}
      </div>
    </div>
  )
}
