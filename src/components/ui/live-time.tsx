'use client'

import { useRelativeTime } from '@/hooks/useRelativeTime'

/**
 * Renders a live-updating relative timestamp ("13s ago", "2h ago", etc.)
 */
export function LiveTime({ date }: { date: Date | string | number | null | undefined }) {
  const text = useRelativeTime(date)
  return <span title={date ? new Date(date).toLocaleString() : undefined}>{text}</span>
}
