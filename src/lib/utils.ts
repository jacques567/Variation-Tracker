import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

// Signatures are legal records — always show them in a single, explicit
// timezone so contractor and client read the same moment in time.
export const SIGNATURE_TIMEZONE = 'Europe/London'

/**
 * Full date + time with an explicit timezone label, e.g.
 * "24 July 2026 at 14:03:21 BST". Used wherever a signature timestamp is
 * shown, so the in-app record and the exported PDF always match.
 */
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: SIGNATURE_TIMEZONE,
    timeZoneName: 'short',
  })
    .format(new Date(dateString))
    .replace(', ', ' at ')
}

/** Short human-quotable reference for a record, e.g. "A1B2C3D4". */
export function formatReference(id: string): string {
  return id.slice(0, 8).toUpperCase()
}
