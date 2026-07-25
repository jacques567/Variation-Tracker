export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none' | null

export type JobStatus = 'active' | 'completed' | 'archived'

export type VariationStatus = 'draft' | 'pending' | 'signed'

export interface Contractor {
  id: string
  email: string
  full_name: string
  company_name: string | null
  phone: string | null
  stripe_customer_id: string | null
  subscription_status: string | null
  subscription_id: string | null
  trial_ends_at: string | null
  grace_period_expires_at: string | null
  created_at: string
  role?: string | null
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
  created_at: string | null
}

export interface Variation {
  id: string
  job_id: string
  description: string
  cost: number
  date: string
  photo_url: string | null
  status: string
  signature_token: string
  created_at: string
  updated_at: string
  signature_token_expires_at?: string | null
  expiry_reminder_sent_at?: string | null
  expiry_notice_sent_at?: string | null
  signature?: Signature | null
  job?: Job
}

export interface Signature {
  id: string
  variation_id: string
  client_name: string
  signature_data: string
  signed_at: string
  client_ip: string | null
  admin_notes?: string | null
  // Evidence bundle captured at signing. Null on signatures created before
  // migration 019 — treat null as "not captured", never as "verified empty".
  declaration_text?: string | null
  user_agent?: string | null
  signed_description?: string | null
  signed_cost?: number | null
  signed_date?: string | null
  content_hash?: string | null
}

export type DeliveryChannel =
  | 'email'
  | 'whatsapp'
  | 'sms'
  | 'share_sheet'
  | 'link_copied'
  | 'in_person'
  | 'other'

export interface VariationDelivery {
  id: string
  variation_id: string
  channel: DeliveryChannel
  recipient: string | null
  note: string | null
  /** 'system' = platform-sent and provably logged; 'declared' = contractor's own statement. */
  evidence_source: 'system' | 'declared'
  sent_at: string
}

export interface JobWithTotals extends Job {
  variations: Variation[]
  signed_total: number
  pending_total: number
  grand_total: number
}
