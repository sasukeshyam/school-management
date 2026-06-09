import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const fDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—'
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt) }
  catch { return '—' }
}

export const fDateTime = (date) => fDate(date, 'dd MMM yyyy, h:mm a')

export const fRelative = (date) => {
  if (!date) return '—'
  try { return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true }) }
  catch { return '—' }
}

export const fCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount ?? 0)

export const fNumber = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0)

export const fPercent = (n, decimals = 1) => `${(n ?? 0).toFixed(decimals)}%`

export const fInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const STATUS_COLORS = {
  active:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive:  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paid:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  unpaid:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  partial:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  overdue:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  present:   'bg-emerald-100 text-emerald-700',
  absent:    'bg-red-100 text-red-700',
  late:      'bg-amber-100 text-amber-700',
  half_day:  'bg-blue-100 text-blue-700',
  draft:     'bg-gray-100 text-gray-600',
  published: 'bg-emerald-100 text-emerald-700',
  issued:    'bg-blue-100 text-blue-700',
  returned:  'bg-gray-100 text-gray-600',
}
