'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { Star, Shield, Trophy, Medal, Award } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatAddress } from '@/lib/utils'
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
        <Link href={`/explore/agents/${e.chain_id}-${e.agent_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
          <Shield className="mr-0.5 size-3" /> x402
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
// Skeleton
// ============================================================

function RankingSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="size-8 rounded-full" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-4 w-10" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-10 rounded-full" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="ml-auto h-5 w-16 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

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

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent Rankings"
        subtitle="Comprehensive agent ranking by reputation, feedback, and on-chain activity"
      />

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? <Skeleton className="h-4 w-24" /> : <span>{entries.length} Agents</span>}
          </div>
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-border/50 bg-card/40">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/50 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as { className?: string } | undefined
                  return (
                    <TableHead key={header.id} className={meta?.className}>
                      <div className={cn('flex items-center gap-1', meta?.className?.includes('text-right') && 'justify-end')}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <RankingSkeleton rows={20} />
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    icon={Trophy}
                    title="No Agents Found"
                    description="No agents match your current filter criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as { className?: string } | undefined
                    return (
                      <TableCell key={cell.id} className={meta?.className}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
