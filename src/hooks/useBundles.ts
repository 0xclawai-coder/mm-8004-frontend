'use client'

import { useQuery } from '@tanstack/react-query'
import { getBundles } from '@/lib/api'
import type { BundleFilters } from '@/types'

export function useBundles(filters?: BundleFilters) {
  return useQuery({
    queryKey: ['bundles', filters],
    queryFn: () => getBundles(filters),
  })
}
