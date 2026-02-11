'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgentActivity } from '@/lib/api'
import type { ActivityFilters } from '@/types'

export function useAgentActivity(id: string, filters?: ActivityFilters) {
  return useQuery({
    queryKey: ['agent-activity', id, filters],
    queryFn: () => getAgentActivity(id, filters),
    enabled: !!id,
  })
}
