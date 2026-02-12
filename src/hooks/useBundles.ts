'use client'

import { useQuery } from '@tanstack/react-query'
import { getBundles } from '@/lib/api'
import type { BundleFilters, BundlesResponse, MarketplaceBundle } from '@/types'

// ============================================================
// Mock data — used when the API returns 404 / error.
// Once the real `/api/marketplace/bundles` endpoint is live,
// this will be bypassed automatically.
// ============================================================

const MOCK_BUNDLES: MarketplaceBundle[] = [
  {
    id: 1,
    bundle_id: 1,
    chain_id: 10143,
    seller: '0x7537C74dd66085b031e198baE98D15e2b2DEa721',
    nft_contracts: [
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
    ],
    token_ids: ['12', '34', '56'],
    payment_token: '0x0000000000000000000000000000000000000000',
    price: '4500000000000000000',
    expiry: 0,
    item_count: 3,
    status: 'Active',
    buyer: null,
    sold_price: null,
    block_number: 100200,
    block_timestamp: '2025-02-10T08:30:00Z',
    tx_hash: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa',
    created_at: '2025-02-10T08:30:00Z',
    updated_at: '2025-02-10T08:30:00Z',
  },
  {
    id: 2,
    bundle_id: 2,
    chain_id: 10143,
    seller: '0x3EcA0F3991D3521A64f4F8B8D5e9F62b469bCa34',
    nft_contracts: [
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
    ],
    token_ids: ['78', '90', '101', '112', '123'],
    payment_token: '0x0000000000000000000000000000000000000000',
    price: '12000000000000000000',
    expiry: 0,
    item_count: 5,
    status: 'Active',
    buyer: null,
    sold_price: null,
    block_number: 100350,
    block_timestamp: '2025-02-11T14:15:00Z',
    tx_hash: '0xbbbb2222cccc3333dddd4444eeee5555ffff6666777788889999aaaa0000bbbb',
    created_at: '2025-02-11T14:15:00Z',
    updated_at: '2025-02-11T14:15:00Z',
  },
  {
    id: 3,
    bundle_id: 3,
    chain_id: 10143,
    seller: '0x9F2B8C4D1E6A3F5072849C0D1E2F3A4B5C6D7E8F',
    nft_contracts: [
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
    ],
    token_ids: ['134', '145', '156', '167'],
    payment_token: '0x0000000000000000000000000000000000000000',
    price: '7800000000000000000',
    expiry: 0,
    item_count: 4,
    status: 'Active',
    buyer: null,
    sold_price: null,
    block_number: 100500,
    block_timestamp: '2025-02-12T06:00:00Z',
    tx_hash: '0xcccc3333dddd4444eeee5555ffff6666777788889999aaaa0000bbbb1111cccc',
    created_at: '2025-02-12T06:00:00Z',
    updated_at: '2025-02-12T06:00:00Z',
  },
  {
    id: 4,
    bundle_id: 4,
    chain_id: 10143,
    seller: '0x7537C74dd66085b031e198baE98D15e2b2DEa721',
    nft_contracts: [
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
    ],
    token_ids: ['178', '189', '200'],
    payment_token: '0x0000000000000000000000000000000000000000',
    price: '2500000000000000000',
    expiry: 0,
    item_count: 3,
    status: 'Sold',
    buyer: '0xD4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3',
    sold_price: '2500000000000000000',
    block_number: 99800,
    block_timestamp: '2025-02-08T19:45:00Z',
    tx_hash: '0xdddd4444eeee5555ffff6666777788889999aaaa0000bbbb1111cccc2222dddd',
    created_at: '2025-02-08T19:45:00Z',
    updated_at: '2025-02-09T10:00:00Z',
  },
  {
    id: 5,
    bundle_id: 5,
    chain_id: 10143,
    seller: '0x1A2B3C4D5E6F708192A3B4C5D6E7F80910111213',
    nft_contracts: [
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
      '0xA1B2C3D4E5F60718293A4B5C6D7E8F9001122334',
    ],
    token_ids: ['211', '222', '233', '244', '255'],
    payment_token: '0x0000000000000000000000000000000000000000',
    price: '15000000000000000000',
    expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
    item_count: 5,
    status: 'Active',
    buyer: null,
    sold_price: null,
    block_number: 100600,
    block_timestamp: '2025-02-12T22:30:00Z',
    tx_hash: '0xeeee5555ffff6666777788889999aaaa0000bbbb1111cccc2222dddd3333eeee',
    created_at: '2025-02-12T22:30:00Z',
    updated_at: '2025-02-12T22:30:00Z',
  },
]

function applyFilters(bundles: MarketplaceBundle[], filters?: BundleFilters): BundlesResponse {
  let filtered = [...bundles]

  if (filters?.chain_id !== undefined) {
    filtered = filtered.filter((b) => b.chain_id === filters.chain_id)
  }
  if (filters?.seller) {
    filtered = filtered.filter((b) => b.seller.toLowerCase() === filters.seller!.toLowerCase())
  }
  if (filters?.status) {
    filtered = filtered.filter((b) => b.status === filters.status)
  }

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 24
  const start = (page - 1) * limit
  const paged = filtered.slice(start, start + limit)

  return { bundles: paged, total: filtered.length, page, limit }
}

export function useBundles(filters?: BundleFilters) {
  return useQuery({
    queryKey: ['bundles', filters],
    queryFn: async () => {
      try {
        return await getBundles(filters)
      } catch {
        // API not available (404 etc) — return mock data
        return applyFilters(MOCK_BUNDLES, filters)
      }
    },
  })
}
