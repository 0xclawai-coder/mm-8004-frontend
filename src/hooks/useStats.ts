'use client'

import { useQuery } from '@tanstack/react-query'
import { getStats } from '@/lib/api'

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: getStats })
}
