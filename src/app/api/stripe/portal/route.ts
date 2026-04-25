import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripe = getStripe()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!contractor?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: contractor.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs`,
  })

  return NextResponse.json({ url: session.url })
}
