'use client'

import { useState } from 'react'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { CategoryFilter } from '@/components/agents/CategoryFilter'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

function LeaderboardSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 w-16">Rank</th>
            <th className="px-4 py-3">Agent</th>
            <th className="hidden px-4 py-3 sm:table-cell">Category</th>
            <th className="px-4 py-3 text-right">Score</th>
            <th className="hidden px-4 py-3 text-right md:table-cell">Feedbacks</th>
            <th className="hidden px-4 py-3 text-right lg:table-cell">Chain</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i} className="border-b border-border/30">
              {/* Rank */}
              <td className="px-4 py-3">
                <Skeleton className="size-8 rounded-full" />
              </td>
              {/* Agent: Avatar + Name */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-10 rounded-full" />
                  </div>
                </div>
              </td>
              {/* Category */}
              <td className="hidden px-4 py-3 sm:table-cell">
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </td>
              {/* Score */}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="size-3.5 rounded" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </td>
              {/* Feedbacks */}
              <td className="hidden px-4 py-3 text-right md:table-cell">
                <Skeleton className="ml-auto h-4 w-8" />
              </td>
              {/* Chain */}
              <td className="hidden px-4 py-3 text-right lg:table-cell">
                <Skeleton className="ml-auto h-5 w-16 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function LeaderboardPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [category, setCategory] = useState('')

  const { data, isLoading } = useLeaderboard({
    chain_id: chainId,
    category: category || undefined,
    limit: 50,
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agent Leaderboard"
        subtitle="Top agents ranked by reputation score"
      />

      {/* Filters */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ChainFilter selected={chainId} onSelect={setChainId} />
        </div>
        <CategoryFilter selected={category} onSelect={setCategory} />
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : (
          <LeaderboardTable entries={data?.leaderboard || []} />
        )}
      </section>
    </div>
  )
}
