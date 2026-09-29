const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const THAI_MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                           'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function formatThaiDate(dateStr: string | null | undefined, short = true): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  const day = d.getDate()
  const month = short ? THAI_MONTHS_SHORT[d.getMonth() + 1] : THAI_MONTHS[d.getMonth() + 1]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

export function formatMonthYearThai(monthYear: string): string {
  if (!monthYear) return ''
  const [y, m] = monthYear.split('-')
  if (!y || !m) return monthYear
  return `${THAI_MONTHS[parseInt(m)]} ${parseInt(y) + 543}`
}

export function getDebtLevel(balance: number): { label: string; className: string } {
  if (balance >= 15000) return { label: 'วิกฤต', className: 'badge-critical' }
  if (balance >= 8000) return { label: 'ปานกลาง', className: 'badge-medium' }
  return { label: 'น้อย', className: 'badge-low' }
}

export function getMemberStatusLabel(status: string): string {
  const map: Record<string, string> = { active: 'ใช้งาน', inactive: 'ปิดใช้งาน' }
  return map[status] || status
}

export function getMemberStatusClass(status: string): string {
  const map: Record<string, string> = { active: 'badge-success', inactive: 'badge-gray' }
  return map[status] || 'badge-gray'
}
