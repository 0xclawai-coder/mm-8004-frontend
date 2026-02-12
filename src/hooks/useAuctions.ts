'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuctions } from '@/lib/api'
import type { AuctionFilters } from '@/types'

export function useAuctions(filters?: AuctionFilters) {
  return useQuery({
    queryKey: ['auctions', filters],
    queryFn: () => getAuctions(filters),
  })
}
