'use client'

import { useQuery } from '@tanstack/react-query'
import { getGlobalActivity } from '@/lib/api'
import type { ActivityFilters } from '@/types'

export function useGlobalActivity(filters?: ActivityFilters) {
  return useQuery({
    queryKey: ['global-activity', filters],
    queryFn: () => getGlobalActivity(filters),
  })
}
