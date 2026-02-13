'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowSmart } from '@/lib/utils'

/**
 * Returns a live-updating "Xs ago" / "Xm ago" string.
 * Updates every second for <60s, every 30s for <1h, every 60s otherwise.
 */
export function useRelativeTime(date: Date | string | number | null | undefined): string {
  const [, setTick] = useState(0)

  const parsed = date ? new Date(date) : null
  const diffMs = parsed ? Date.now() - parsed.getTime() : Infinity

  // Pick refresh interval based on age
  const interval =
    diffMs < 60_000 ? 1_000 :      // <1 min → every 1s
    diffMs < 3_600_000 ? 30_000 :   // <1 hr → every 30s
    60_000                           // else → every 60s

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), interval)
    return () => clearInterval(id)
  }, [interval])

  if (!parsed || isNaN(parsed.getTime())) return '—'
  return formatDistanceToNowSmart(parsed, { addSuffix: true })
}
