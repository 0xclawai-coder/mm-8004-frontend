'use client'

import { useQuery } from '@tanstack/react-query'
import { getListing } from '@/lib/api'

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListing(id),
    enabled: !!id,
  })
}
