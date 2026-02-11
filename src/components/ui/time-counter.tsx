'use client'

import { formatDistanceToNowSmart } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function TimeCounter({ targetTime }: { targetTime: Date }) {
  const [, triggerRender] = useState<string>()

  useEffect(() => {
    const interval = setInterval(() => {
      triggerRender(Date.now().toString())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return <>{formatDistanceToNowSmart(targetTime, { addSuffix: true })}</>
}
