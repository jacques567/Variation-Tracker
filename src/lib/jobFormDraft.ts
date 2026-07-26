const STORAGE_KEY_PREFIX = 'job_form_draft'

export interface JobFormData {
  job_name: string
  address: string
  original_value: string
  category: string
  client_name: string
  client_email: string
  client_email_confirm: string
  client_phone: string
}

export function getJobFormDraftKey(userId: string | null): string {
  if (!userId) return STORAGE_KEY_PREFIX
  return `${STORAGE_KEY_PREFIX}_${userId}`
}

export function readJobFormDraft(userId: string | null): JobFormData | null {
  const saved = sessionStorage.getItem(getJobFormDraftKey(userId))
  return saved ? JSON.parse(saved) : null
}

export function writeJobFormDraft(userId: string | null, data: JobFormData): void {
  sessionStorage.setItem(getJobFormDraftKey(userId), JSON.stringify(data))
}

export function clearJobFormDraft(userId: string | null): void {
  sessionStorage.removeItem(getJobFormDraftKey(userId))
}
