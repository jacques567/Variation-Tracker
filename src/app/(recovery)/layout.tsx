import { Poppins } from 'next/font/google'
import Image from 'next/image'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export default function RecoveryLayout({ children }: { children: React.ReactNode }) {
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
