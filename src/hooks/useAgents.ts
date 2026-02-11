'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgents } from '@/lib/api'
import type { AgentFilters } from '@/types'

export function useAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: ['agents', filters],
    queryFn: () => getAgents(filters),
  })
}
