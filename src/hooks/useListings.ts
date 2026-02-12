'use client'

import { useQuery } from '@tanstack/react-query'
import { getListings } from '@/lib/api'
import type { ListingFilters } from '@/types'

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: () => getListings(filters),
  })
}
