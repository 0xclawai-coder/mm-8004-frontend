import { clsx, type ClassValue } from 'clsx'
import { type FormatDistanceToken, formatDistanceToNowStrict } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Address / Token formatting ─────────────────────────────────────

const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

/** 0x1234…abcd */
export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Return human-readable token symbol from payment token address */
export function getTokenLabel(addr: string): string {
  if (addr === NATIVE_TOKEN) return 'MON'
  return formatAddress(addr)
}

// ─── Price formatting (wei → human) ────────────────────────────────

/** Format a raw wei string (18 decimals) into a compact human-readable price */
export function formatPrice(raw: string, decimals = 18): string {
  const human = parseFloat(raw) / 10 ** decimals
  if (human === 0) return '0'
  if (human >= 1_000_000) return `${(human / 1_000_000).toFixed(2)}M`
  if (human >= 1_000) return `${(human / 1_000).toFixed(2)}K`
  if (human >= 1) return human.toFixed(2)
  if (human >= 0.001) return human.toFixed(4)
  return human.toExponential(2)
}

// ─── Time formatting ────────────────────────────────────────────────

type FormatDistanceToNowParameter = Parameters<typeof formatDistanceToNowStrict>

const formatDistanceLocale: Record<FormatDistanceToken, (count: number) => string> = {
  lessThanXSeconds: (c) => `${c}s`,
  xSeconds: (c) => `${c}s`,
  halfAMinute: () => '30s',
  lessThanXMinutes: (c) => `${c}m`,
  xMinutes: (c) => `${c}m`,
  aboutXHours: (c) => `${c}h`,
  xHours: (c) => `${c}h`,
  xDays: (c) => `${c}d`,
  aboutXWeeks: (c) => `${c}w`,
  xWeeks: (c) => `${c}w`,
  aboutXMonths: (c) => `${c}mo`,
  xMonths: (c) => `${c}mo`,
  aboutXYears: (c) => `${c}y`,
  xYears: (c) => `${c}y`,
  overXYears: (c) => `${c}y`,
  almostXYears: (c) => `${c}y`,
}

export const formatDistanceToNowSmart = (...parameter: FormatDistanceToNowParameter) => {
  const [date, options] = parameter

  const getFormatDistanceLocale = (token: FormatDistanceToken, count: number) => {
    if (options?.addSuffix) {
      return formatDistanceLocale[token](count) + ' ago'
    }
    return formatDistanceLocale[token](count)
  }

  return formatDistanceToNowStrict(date, {
    ...options,
    locale: { formatDistance: (token, count) => getFormatDistanceLocale(token, count) },
  })
}
