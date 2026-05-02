/**
 * SignaturePrivacyNotice
 *
 * Drop this at the bottom of your public variation signing page.
 * Required by UK GDPR Article 14 — informs clients (non-account holders)
 * that their personal data is processed by WildFireCo t/a Variation Tracker.
 *
 * Usage:
 *   import SignaturePrivacyNotice from '@/components/legal/SignaturePrivacyNotice'
 *   ...
 *   <SignaturePrivacyNotice />
 */

export default function SignaturePrivacyNotice() {
  return (
    <div
      style={{
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
      }}
      aria-label="Privacy notice"
    >
      <p
        style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          lineHeight: '1.6',
          maxWidth: '560px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <strong style={{ color: '#374151' }}>Privacy notice.</strong>{' '}
        Your name, signature, and IP address are recorded by WildFireCo (trading
        as Variation Tracker) solely to create a secure, time-stamped record of
        your approval of this variation. This data is processed on the basis of
        legitimate interests and is retained for up to 6 years in line with
        standard contractual record-keeping requirements. You have rights of
        access, rectification, and erasure under UK GDPR. To exercise them,
        contact{' '}
        <a
          href="mailto:admin@vartracker.com"
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          admin@vartracker.com
        </a>
        .
      </p>
    </div>
  )
}
