export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export type JobStatus = 'active' | 'completed' | 'archived'

export type VariationStatus = 'draft' | 'pending' | 'signed'

export interface Contractor {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_id: string | null
  created_at: string
}

export interface Job {
  id: string
  contractor_id: string
  client_name: string
  client_email: string
  client_phone: string | null
  job_name: string
  address: string
  original_value: number
  status: JobStatus
  category?: string | null
  created_at: string
  updated_at: string
  variations?: Variation[]
}

export interface JobCategory {
  id: string
  contractor_id: string
  name: string
  created_at: string
}

export interface Variation {
  id: string
  job_id: string
  description: string
  cost: number
  date: string
  photo_url: string | null
  status: VariationStatus
  signature_token: string
  created_at: string
  updated_at: string
  signature?: Signature
  job?: Job
}

export interface Signature {
  id: string
  variation_id: string
  client_name: string
  signature_data: string
  signed_at: string
  client_ip: string | null
}

export interface JobWithTotals extends Job {
  variations: Variation[]
  signed_total: number
  pending_total: number
  grand_total: number
}
