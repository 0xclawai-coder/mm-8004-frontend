'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Shield, Trophy, Medal, Award } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { cn, formatAddress } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import type { LeaderboardEntry } from '@/types'

// ============================================================
// Helpers
// ============================================================

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="size-4 text-yellow-400" />
  if (rank === 2) return <Medal className="size-4 text-gray-300" />
  if (rank === 3) return <Award className="size-4 text-amber-600" />
  return <span className="text-sm text-muted-foreground">{rank}</span>
}

function getChainBadge(chainId: number) {
  if (chainId === 143)
    return <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">Mainnet</Badge>
  if (chainId === 10143)
    return <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">Testnet</Badge>
  return <Badge variant="outline" className="text-[10px]">Chain {chainId}</Badge>
}

// ============================================================
// Columns
// ============================================================

const columns: ColumnDef<LeaderboardEntry, unknown>[] = [
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
    accessorKey: 'name',
    header: 'Agent',
    cell: ({ row }) => {
      const e = row.original
      return (
        <Link href={`/explore/agents/${e.chain_id}/${e.agent_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar className="size-9 shrink-0 rounded-lg ring-1 ring-border">
            <AvatarImage src={e.image ?? undefined} alt={e.name ?? `Agent #${e.agent_id}`} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-bold text-primary">
              #{e.agent_id}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {e.name || `Agent #${e.agent_id}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {formatAddress(e.owner)}
            </p>
          </div>
        </Link>
      )
    },
    meta: {
      skeleton: (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ),
    },
  },
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ getValue }) => {
      const cats = getValue<string[] | null>()
      if (!cats || cats.length === 0) return <span className="text-xs text-muted-foreground">—</span>
      return (
        <div className="flex flex-wrap gap-1">
          {cats.slice(0, 2).map((c) => (
            <Badge key={c} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              {c}
            </Badge>
          ))}
          {cats.length > 2 && (
            <Badge variant="secondary" className="text-[10px]">+{cats.length - 2}</Badge>
          )}
        </div>
      )
    },
    meta: { className: 'hidden md:table-cell' },
  },
  {
    accessorKey: 'reputation_score',
    header: 'Score',
    cell: ({ getValue }) => {
      const score = getValue<number | null>()
      return (
        <div className="flex items-center justify-end gap-1">
          <Star className="size-3.5 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">
            {score != null ? score.toFixed(1) : '—'}
          </span>
        </div>
      )
    },
    meta: { className: 'text-right' },
  },
  {
    accessorKey: 'feedback_count',
    header: 'Feedbacks',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue<number | null>() ?? 0}</span>
    ),
    meta: { className: 'text-right hidden sm:table-cell' },
  },
  {
    accessorKey: 'x402_support',
    header: 'x402',
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px]">
          <Shield className="size-3" /> x402
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    accessorKey: 'chain_id',
    header: 'Chain',
    cell: ({ getValue }) => getChainBadge(getValue<number>()),
    meta: { className: 'hidden lg:table-cell' },
  },
]

// ============================================================
// Page
// ============================================================

export default function RankingsPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')

  const { data, isLoading } = useLeaderboard({
    chain_id: chainId,
    category: category || undefined,
    limit: 100,
  })

  const entries = data?.leaderboard ?? []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entity Rankings"
        subtitle="Comprehensive entity ranking by track record, feedback, and on-chain activity"
      />

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? <Skeleton className="h-4 w-full" /> : <span>{entries.length} Entities</span>}
          </div>
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Table */}
      <section>
        <DataTable
          columns={columns}
          data={entries}
          isLoading={isLoading}
          skeletonRows={15}
          pageSize={100}
          emptyMessage="No entities match your current filter criteria."
        />
      </section>
    </div>
  )
}
