import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { Errors } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = Errors.unauthorized()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const stripe = getStripe()

    const { data: contractor } = await supabase
      .from('contractors')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!contractor?.stripe_customer_id) {
      const err = Errors.notFound('Subscription')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const isVercelPreview = process.env.VERCEL_ENV === 'preview'
    const baseUrl = isVercelPreview && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
          ? process.env.NEXT_PUBLIC_APP_URL
          : `https://${process.env.NEXT_PUBLIC_APP_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : (request.headers.get('origin') ?? `https://${request.headers.get('host')}`)

    const session = await stripe.billingPortal.sessions.create({
      customer: contractor.stripe_customer_id,
      return_url: `${baseUrl}/jobs`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[portal] Failed to create billing portal session:', error)
    const err = Errors.stripeError('Failed to create billing portal session')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
