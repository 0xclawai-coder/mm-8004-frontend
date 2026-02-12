'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuctionDetail } from '@/lib/api'

export function useAuctionDetail(id: string) {
  return useQuery({
    queryKey: ['auction-detail', id],
    queryFn: () => getAuctionDetail(id),
    enabled: !!id,
  })
}
