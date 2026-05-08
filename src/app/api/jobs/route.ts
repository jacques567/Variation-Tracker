import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscription } from '@/lib/subscription-guard'
import { Errors } from '@/lib/errors'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized().toJSON(), { status: 401 })
    }

    const { isValid, reason } = await checkSubscription(user.id)
    if (!isValid) {
      const err = Errors.forbidden(reason)
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*, variations(id, cost, status)')
      .eq('contractor_id', user.id)
      .order('created_at', { ascending: false })

    if (jobsError) {
      return NextResponse.json(Errors.databaseError().toJSON(), { status: 500 })
    }

    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
  }
}
