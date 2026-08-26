import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatDate(
  value: string | number | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
): string {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return new Intl.DateTimeFormat('en-CA', opts).format(d)
  } catch {
    return String(value)
  }
}

export function daysSince(value: string | number | Date | null | undefined): number {
  if (!value) return 0
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 0
  const diff = Date.now() - d.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '-'
  if (phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}
