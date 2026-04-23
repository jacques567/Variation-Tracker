import { StyleSheet } from '@react-pdf/renderer'

export const colors = {
  blue: '#2563EB',
  gray900: '#111827',
  gray600: '#4B5563',
  gray400: '#9CA3AF',
  gray100: '#F3F4F6',
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
}

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: colors.gray900,
    padding: 48,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.blue,
  },
  docTitle: {
    fontSize: 11,
    color: colors.gray600,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: colors.gray400,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: colors.gray900,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    padding: '6 8',
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 8',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  colDescription: { flex: 1 },
  colDate: { width: 80 },
  colAmount: { width: 80, textAlign: 'right' },
  totalBox: {
    backgroundColor: colors.blue,
    padding: '12 16',
    borderRadius: 6,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 9,
    color: '#BFDBFE',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: colors.gray400,
  },
})
