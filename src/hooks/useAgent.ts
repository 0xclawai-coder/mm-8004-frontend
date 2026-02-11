'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgent, getAgentReputation } from '@/lib/api'
import type { ReputationRange } from '@/types'

export function useAgent(id: string) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: () => getAgent(id),
    enabled: !!id,
  })
}

export function useAgentReputation(id: string, range?: ReputationRange) {
  return useQuery({
    queryKey: ['agent-reputation', id, range],
    queryFn: () => getAgentReputation(id, range),
    enabled: !!id,
  })
}
