'use client'

import { useQuery } from '@tanstack/react-query'
import { getOffers } from '@/lib/api'
import type { OfferFilters } from '@/types'

export function useOffers(filters?: OfferFilters) {
  return useQuery({
    queryKey: ['offers', filters],
    queryFn: () => getOffers(filters),
    enabled: !!filters?.nft_contract && !!filters?.token_id,
  })
}
