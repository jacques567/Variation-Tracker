import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles this first, but guard here as defence-in-depth
  if (user) redirect('/jobs')

  return (
    <div className="auth-layout">
      <style>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
        }

        .auth-hero {
          display: none;
          flex: 0 0 38%;
          background: linear-gradient(
            135deg,
            var(--color-primary) 0%,
            var(--color-primary-dark) 100%
          );
          padding: var(--spacing-4xl) var(--spacing-3xl);
          align-items: center;
          justify-content: flex-start;
          position: relative;
          overflow: hidden;
          color: white;
        }

        @media (min-width: 1024px) {
          .auth-hero {
            display: flex;
          }

          .auth-form-container {
            flex: 0 0 62%;
          }
        }

        .auth-form-container {
          flex: 1 1 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-3xl);
          background: var(--color-background-secondary);
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 420px;
        }
      `}</style>

      {/* Hero Section */}
      <div className="auth-hero">
        <div className="hero-content">
          <h1>VarTracker</h1>
          <p style={{ marginBottom: 0 }}>Variation & Change Order Tracker</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>
    </div>
  )
}
