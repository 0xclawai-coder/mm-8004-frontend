'use client'

import Link from 'next/link'
import { Trophy, Medal, Award, Star } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-yellow-500/20">
        <Trophy className="size-4 text-yellow-400" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-gray-400/20">
        <Medal className="size-4 text-gray-300" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex size-8 items-center justify-center rounded-full bg-amber-700/20">
        <Award className="size-4 text-amber-600" />
      </div>
    )
  }
  return (
    <div className="flex size-8 items-center justify-center">
      <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    </div>
  )
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No Leaderboard Entries"
        description="Agents will appear here once they receive reputation scores and feedback."
        className="py-12"
      />
    )
  }

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
          {entries.map((entry) => {
            const agentPath = `/explore/agents/${entry.chain_id}-${entry.agent_id}`
            return (
              <Link
                key={`${entry.chain_id}-${entry.agent_id}`}
                href={agentPath}
                className="contents"
              >
              <tr
                className="group cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/50"
              >
                {/* Rank */}
                <td className="px-4 py-3">
                  <RankBadge rank={entry.rank} />
                </td>

                {/* Agent */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 ring-1 ring-border">
                      <AvatarImage src={entry.image ?? undefined} alt={entry.name ?? undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                        {entry.name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.name || `Agent #${entry.agent_id}`}
                      </p>
                      {entry.x402_support && (
                        <Badge
                          variant="outline"
                          className="mt-0.5 border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent text-[9px] px-1"
                        >
                          x402
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="hidden px-4 py-3 sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {entry.categories?.slice(0, 2).map((cat) => (
                      <Badge
                        key={cat}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className={cn('size-3.5', getScoreColor(entry.reputation_score ?? 0))} />
                    <span className={cn('text-sm font-semibold', getScoreColor(entry.reputation_score ?? 0))}>
                      {(entry.reputation_score ?? 0).toFixed(1)}
                    </span>
                  </div>
                </td>

                {/* Feedbacks */}
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className="text-sm text-muted-foreground">{entry.feedback_count ?? 0}</span>
                </td>

                {/* Chain */}
                <td className="hidden px-4 py-3 text-right lg:table-cell">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      entry.chain_id === 143
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    )}
                  >
                    {getChainLabel(entry.chain_id)}
                  </Badge>
                </td>
              </tr>
              </Link>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
