import Image from 'next/image'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#0d1b2a' }}>
      <div className="flex flex-col items-center text-center max-w-lg w-full gap-8">
        <Image
          src="/VarTrackerName.jpg"
          alt="VarTracker"
          width={480}
          height={269}
          priority
          className="w-full max-w-sm rounded-xl"
        />

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Coming Soon
          </h1>
          <p className="text-lg text-blue-300 font-medium">
            Track variations. Get client sign-offs.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
            VarTracker helps contractors log change orders, notify clients, and collect
            electronic sign-offs — all in one place. Built for electricians, plumbers,
            builders, and anyone managing construction jobs.
          </p>
        </div>
      </div>
    </main>
  )
}
