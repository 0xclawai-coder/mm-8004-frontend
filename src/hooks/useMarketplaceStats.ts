'use client'

import { useQuery } from '@tanstack/react-query'
import { getMarketplaceStats } from '@/lib/api'

export function useMarketplaceStats() {
  return useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: getMarketplaceStats,
  })
}
