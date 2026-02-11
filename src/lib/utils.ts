import { clsx, type ClassValue } from 'clsx'
import { type FormatDistanceToken, formatDistanceToNowStrict } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
