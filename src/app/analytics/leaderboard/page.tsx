'use client'

import { useState } from 'react'
import { Trophy, Medal, Award, Wallet, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { cn, formatAddress, formatPrice } from '@/lib/utils'
import { formatDistanceToNowSmart } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

// ============================================================
// Types
// ============================================================

interface TopWallet {
  rank: number
  address: string
  total_volume: string
  total_trades: number
  last_active: string | null
  chain_id?: number
}

// ============================================================
// Mock data (used when API is unavailable)
// ============================================================

const MOCK_WALLETS: TopWallet[] = Array.from({ length: 20 }).map((_, i) => ({
  rank: i + 1,
  address: `0x${(Math.random().toString(16).slice(2) + '0'.repeat(40)).slice(0, 40)}`,
  total_volume: String((Math.random() * 1000 + 10) * 1e18),
  total_trades: Math.floor(Math.random() * 200) + 1,
  last_active: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
}))

// ============================================================
// Helpers
// ============================================================

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="size-4 text-yellow-400" />
  if (rank === 2) return <Medal className="size-4 text-gray-300" />
  if (rank === 3) return <Award className="size-4 text-amber-600" />
  return <span className="text-sm text-muted-foreground">{rank}</span>
}

// ============================================================
// Columns
// ============================================================

const columns: ColumnDef<TopWallet, unknown>[] = [
  {
    id: 'rank',
    header: 'Rank',
    cell: ({ row }) => (
      <div className="flex size-8 items-center justify-center">
        {getRankIcon(row.original.rank)}
      </div>
    ),
    size: 64,
  },
  {
    accessorKey: 'address',
    header: 'Wallet Address',
    cell: ({ getValue }) => {
      const addr = getValue<string>()
      return (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="size-4 text-primary" />
          </div>
          <span className="font-mono text-sm text-foreground">
            {formatAddress(addr)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'total_volume',
    header: 'Total Volume',
    cell: ({ getValue }) => {
      const raw = getValue<string>()
      return (
        <div className="flex items-center justify-end gap-1">
          <TrendingUp className="size-3.5 text-green-400" />
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(raw)} MON
          </span>
        </div>
      )
    },
    meta: { className: 'text-right' },
  },
  {
    accessorKey: 'total_trades',
    header: 'Total Trades',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue<number>()}</span>
    ),
    meta: { className: 'text-right hidden sm:table-cell' },
  },
  {
    accessorKey: 'last_active',
    header: 'Last Active',
    cell: ({ getValue }) => {
      const val = getValue<string | null>()
      if (!val) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNowSmart(new Date(val), { addSuffix: true })}
        </span>
      )
    },
    meta: { className: 'text-right hidden md:table-cell' },
  },
]

// ============================================================
// Hook: fetch top wallets (falls back to mock)
// ============================================================

function useTopWallets(chainId?: number) {
  return useQuery({
    queryKey: ['topWallets', chainId],
    queryFn: async (): Promise<TopWallet[]> => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = new URL(`${apiBase}/wallets/top`)
      if (chainId !== undefined) url.searchParams.set('chain_id', String(chainId))
      url.searchParams.set('limit', '50')

      try {
        const res = await fetch(url.toString())
        if (!res.ok) throw new Error('API unavailable')
        const data = await res.json()
        return data.wallets ?? data
      } catch {
        // Fallback to mock data
        return MOCK_WALLETS
      }
    },
  })
}

// ============================================================
// Page
// ============================================================

export default function LeaderboardPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)

  const { data: wallets, isLoading } = useTopWallets(chainId)

  const entries = wallets ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Top Wallets"
        subtitle="Wallets ranked by trading volume and activity"
      />

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? <Skeleton className="h-4 w-full" /> : <span>{entries.length} Wallets</span>}
          </div>
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
      </section>

      {/* Table */}
      <section>
        <DataTable
          columns={columns}
          data={entries}
          isLoading={isLoading}
          skeletonRows={20}
          pageSize={50}
          emptyMessage="Wallet trading data will appear here once marketplace activity begins."
        />
      </section>
    </div>
  )
}
