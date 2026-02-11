'use client'

import { useQuery } from '@tanstack/react-query'
import { getLeaderboard } from '@/lib/api'
import type { LeaderboardFilters } from '@/types'

export function useLeaderboard(filters?: LeaderboardFilters) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: () => getLeaderboard(filters),
  })
}
