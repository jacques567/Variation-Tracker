import { Page, Text, View, Image, Document } from '@react-pdf/renderer'
import { styles, colors } from './styles'
import {
  formatCurrency as fmt,
  formatDate as fmtDate,
  formatDateTime as fmtDateTime,
  formatReference,
} from '@/lib/utils'

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  share_sheet: 'Shared via device share menu',
  link_copied: 'Link copied to clipboard',
  in_person: 'In person',
  other: 'Other',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VariationPDF({ variation }: { variation: any }) {
  const contractor = variation.job?.contractor
  const job = variation.job
  const signature = variation.signature
  const deliveries = variation.deliveries ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{contractor?.company_name || contractor?.full_name || 'Contractor'}</Text>
            <Text style={styles.docTitle}>Variation Notice</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: colors.gray400 }}>Date</Text>
            <Text style={{ fontSize: 10 }}>{fmtDate(variation.date)}</Text>
            <Text style={{ fontSize: 9, color: colors.gray400, marginTop: 6 }}>Ref</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{formatReference(variation.id)}</Text>
          </View>
        </View>

        <View style={[styles.row, { marginBottom: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Job</Text>
            <Text style={styles.value}>{job?.job_name}</Text>
            <Text style={[styles.value, { color: colors.gray600, marginTop: 2 }]}>{job?.address}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.value}>{job?.client_name}</Text>
            <Text style={[styles.value, { color: colors.gray600, marginTop: 2 }]}>{job?.client_email}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>Variation Description</Text>
          <View style={{ backgroundColor: colors.gray100, borderRadius: 6, padding: 12, marginTop: 4 }}>
            <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{variation.description}</Text>
          </View>
        </View>

        <View style={[styles.row, { marginBottom: 24 }]}>
          <View>
            <Text style={styles.label}>Additional Cost (exc. VAT)</Text>
            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.blue }}>{fmt(variation.cost)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Status</Text>
            <View style={{
              backgroundColor: variation.status === 'signed' ? '#DCFCE7' : '#FEF3C7',
              borderRadius: 20, padding: '4 10',
            }}>
              <Text style={{
                fontSize: 9, fontFamily: 'Helvetica-Bold',
                color: variation.status === 'signed' ? colors.green : colors.amber,
                textTransform: 'uppercase',
              }}>
                {variation.status}
              </Text>
            </View>
          </View>
        </View>

        {signature && (
          <>
            <View style={styles.divider} />
            <View style={{ marginBottom: 16 }} wrap={false}>
              <Text style={styles.sectionTitle}>Client Sign-off</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.label}>Signed by</Text>
                  <Text style={[styles.value, { marginBottom: 6 }]}>{signature.client_name}</Text>

                  <Text style={styles.label}>Signed at</Text>
                  <Text style={[styles.value, { marginBottom: 6 }]}>{fmtDateTime(signature.signed_at)}</Text>

                  <Text style={styles.label}>Variation ref</Text>
                  <Text style={[styles.value, { marginBottom: 6 }]}>{formatReference(variation.id)}</Text>

                  <Text style={styles.label}>Signed from IP</Text>
                  <Text style={styles.value}>{signature.client_ip || 'Not recorded'}</Text>
                </View>
                <View style={{ width: 170 }}>
                  <Text style={[styles.label, { textAlign: 'center' }]}>Client signature</Text>
                  <View style={{ height: 70, backgroundColor: colors.gray100, borderRadius: 6, padding: 4, marginTop: 2 }}>
                    <Image src={signature.signature_data} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </View>
                </View>
              </View>
            </View>

            {/* Provenance, as distinct from the sign-off block above. That block
                answers "who signed and when"; this one answers "what exactly did
                they agree to, and can we prove it hasn't changed since". Only
                rendered where the data exists — signatures captured before
                migration 019 have none, and blank rows would imply the fields
                were checked and found empty. */}
            {(signature.declaration_text || signature.content_hash || signature.user_agent) && (
            <View style={{ marginBottom: 16 }} wrap={false}>
              <Text style={styles.sectionTitle}>Signature Provenance</Text>
              <View style={{ marginTop: 6 }}>
                <Text style={styles.label}>Full variation reference</Text>
                <Text style={[styles.value, { fontSize: 8 }]}>{variation.id}</Text>

                {signature.declaration_text && (
                  <>
                    <Text style={styles.label}>Declaration accepted by signatory</Text>
                    <Text style={[styles.value, { fontSize: 9 }]}>&ldquo;{signature.declaration_text}&rdquo;</Text>
                  </>
                )}

                {signature.content_hash && (
                  <>
                    <Text style={styles.label}>Content fingerprint (SHA-256)</Text>
                    <Text style={[styles.value, { fontSize: 7, color: colors.gray600 }]}>
                      {signature.content_hash}
                    </Text>
                  </>
                )}

                {signature.user_agent && (
                  <>
                    <Text style={styles.label}>Signatory device</Text>
                    <Text style={[styles.value, { fontSize: 7, color: colors.gray600 }]}>
                      {signature.user_agent}
                    </Text>
                  </>
                )}
              </View>
            </View>
            )}
          </>
        )}

        {deliveries.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Delivery Record</Text>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {deliveries.map((d: any) => (
                <View key={d.id} style={{ marginTop: 6 }}>
                  <Text style={[styles.value, { fontSize: 9 }]}>
                    {CHANNEL_LABELS[d.channel] || d.channel}
                    {d.recipient ? ` — ${d.recipient}` : ''}
                  </Text>
                  <Text style={{ fontSize: 8, color: colors.gray400 }}>
                    {fmtDateTime(d.sent_at)}
                    {d.evidence_source === 'declared'
                      ? ' · recorded by contractor'
                      : ' · sent by the platform'}
                  </Text>
                </View>
              ))}
              <Text style={{ fontSize: 7, color: colors.gray400, marginTop: 6 }}>
                Entries marked &ldquo;recorded by contractor&rdquo; are self-reported at the time of
                sending and are not independently verified by the platform.
              </Text>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by VarTracker</Text>
          <Text style={styles.footerText}>Electronic signature admissible under Electronic Communications Act 2000 s.7</Text>
        </View>
      </Page>
    </Document>
  )
}
