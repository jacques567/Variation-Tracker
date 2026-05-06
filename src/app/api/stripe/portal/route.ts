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

    const session = await stripe.billingPortal.sessions.create({
      customer: contractor.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    const err = Errors.stripeError('Failed to create billing portal session')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
