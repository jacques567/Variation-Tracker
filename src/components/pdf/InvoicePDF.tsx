import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { styles, colors } from './styles'

function fmt(pence: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

// Mirrors formatDateTime() in src/lib/utils.ts — the timestamp shown in-app and
// the one printed on the invoice must be the same moment in the same timezone.
function fmtDateTime(d: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/London',
    timeZoneName: 'short',
  })
    .format(new Date(d))
    .replace(', ', ' at ')
}

function ref(id: string) {
  return id.slice(0, 8).toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InvoicePDF({ job }: { job: any }) {
  const contractor = job.contractor
  const variations = job.variations ?? []
  const signedVariations = variations.filter((v: any) => v.status === 'signed')
  const variationsTotal = signedVariations.reduce((s: number, v: any) => s + v.cost, 0)
  const grandTotal = job.original_value + variationsTotal
  const signedWithRecord = signedVariations.filter((v: any) => v.signature)

  return (
    <Document>
      <Page size="A4" style={[styles.page, { paddingBottom: 76 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{contractor?.company_name || contractor?.full_name || 'Contractor'}</Text>
            <Text style={styles.docTitle}>Final Invoice with Variations</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: colors.gray400 }}>Invoice date</Text>
            <Text style={{ fontSize: 10 }}>{fmtDate(new Date().toISOString())}</Text>
            <Text style={{ fontSize: 9, color: colors.gray400, marginTop: 6 }}>Job ref</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{ref(job.id)}</Text>
          </View>
        </View>

        {/* Job & Client */}
        <View style={[styles.row, { marginBottom: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Job</Text>
            <Text style={styles.value}>{job.job_name}</Text>
            <Text style={[styles.value, { color: colors.gray600, marginTop: 2 }]}>{job.address}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.value}>{job.client_name}</Text>
            <Text style={[styles.value, { color: colors.gray600, marginTop: 2 }]}>{job.client_email}</Text>
            {job.client_phone && (
              <Text style={[styles.value, { color: colors.gray600 }]}>{job.client_phone}</Text>
            )}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colDescription, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.gray600 }]}>Description</Text>
          <Text style={[styles.colDate, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.gray600 }]}>Date</Text>
          <Text style={[styles.colAmount, { fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.gray600 }]}>Amount</Text>
        </View>

        {/* Original contract */}
        <View style={styles.tableRow}>
          <Text style={[styles.colDescription, { fontSize: 10 }]}>Original contract value</Text>
          <Text style={[styles.colDate, { fontSize: 10, color: colors.gray600 }]}>{fmtDate(job.created_at)}</Text>
          <Text style={[styles.colAmount, { fontSize: 10, fontFamily: 'Helvetica-Bold' }]}>{fmt(job.original_value)}</Text>
        </View>

        {/* Signed variations */}
        {signedVariations.map((v: any) => {
          const isNegative = v.cost < 0
          const displayCost = isNegative ? fmt(v.cost) : `+${fmt(v.cost)}`
          const costColor = isNegative ? colors.red : colors.green
          return (
            <View key={v.id} style={styles.tableRow} wrap={false}>
              <View style={styles.colDescription}>
                <Text style={{ fontSize: 10 }}>{v.description}</Text>
                <Text style={{ fontSize: 8, color: costColor, marginTop: 2 }}>
                  {v.signature
                    ? `Signed by ${v.signature.client_name} — ${fmtDateTime(v.signature.signed_at)}`
                    : 'Signed by client'}
                </Text>
                <Text style={{ fontSize: 8, color: colors.gray400, marginTop: 1 }}>Variation ref {ref(v.id)}</Text>
              </View>
              <Text style={[styles.colDate, { fontSize: 10, color: colors.gray600 }]}>{fmtDate(v.date)}</Text>
              <Text style={[styles.colAmount, { fontSize: 10, fontFamily: 'Helvetica-Bold', color: costColor }]}>{displayCost}</Text>
            </View>
          )
        })}

        {/* Total */}
        <View style={[styles.row, { marginTop: 16 }]}>
          <View style={{ flex: 1 }} />
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalAmount}>{fmt(grandTotal)}</Text>
            {variationsTotal !== 0 && (
              <Text style={{ fontSize: 8, color: '#BFDBFE', marginTop: 4 }}>
                {variationsTotal > 0 ? '+' : ''}{fmt(variationsTotal)} from signed variations
              </Text>
            )}
          </View>
        </View>

        {/* Signature record — the evidence behind every variation charged above */}
        {signedWithRecord.length > 0 && (
          <View break>
            <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 2 }]}>Signature Record</Text>
            <Text style={{ fontSize: 9, color: colors.gray600, marginBottom: 12 }}>
              Each variation charged on this invoice was approved electronically by the client.
              The signature, signatory name and timestamp captured at the point of approval are
              reproduced below.
            </Text>

            {signedWithRecord.map((v: any) => (
              <View
                key={v.id}
                wrap={false}
                style={{
                  borderWidth: 1,
                  borderColor: colors.gray100,
                  borderRadius: 6,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <View style={styles.row}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1, paddingRight: 12 }}>
                    {v.description}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: v.cost < 0 ? colors.red : colors.green }}>
                    {v.cost < 0 ? '' : '+'}{fmt(v.cost)}
                  </Text>
                </View>

                <View style={[styles.row, { marginTop: 10 }]}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.label}>Signed by</Text>
                    <Text style={[styles.value, { marginBottom: 6 }]}>{v.signature.client_name}</Text>

                    <Text style={styles.label}>Signed at</Text>
                    <Text style={[styles.value, { marginBottom: 6 }]}>{fmtDateTime(v.signature.signed_at)}</Text>

                    <Text style={styles.label}>Variation ref</Text>
                    <Text style={[styles.value, { marginBottom: 6 }]}>{ref(v.id)}</Text>

                    <Text style={styles.label}>Signed from IP</Text>
                    <Text style={styles.value}>{v.signature.client_ip || 'Not recorded'}</Text>
                  </View>

                  <View style={{ width: 170 }}>
                    <Text style={[styles.label, { textAlign: 'center' }]}>Client signature</Text>
                    <View style={{
                      height: 70,
                      backgroundColor: colors.gray100,
                      borderRadius: 6,
                      padding: 4,
                      marginTop: 2,
                    }}>
                      <Image
                        src={v.signature.signature_data}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by VarTracker · Electronic signatures valid under the Electronic Communications Act 2000
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
