'use client'

import { useMemo } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentBrowseTable } from '@/components/agents/AgentBrowseTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Agent } from '@/types'

function AgentCardSkeleton() {
  // Matches AgentCard layout exactly: avatar+name+desc row → bottom score row
  // No separate category row — matches the most common card variant (with description)
  return (
    <Card className="border-border/50 bg-card/80 py-0">
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Top row: Avatar + Name + Description (matches AgentCard) */}
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
            {/* min-h-8 matches AgentCard description area */}
            <div className="min-h-8 flex flex-col gap-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
        {/* Bottom row: Score + Feedbacks | Chain badge (matches AgentCard) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function AgentColumn({
  title,
  agents,
  isLoading,
}: {
  title: string
  agents: Agent[]
  isLoading: boolean
}) {
  return (
    <div className="min-w-0 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))
          : agents.map((agent) => (
              <AgentCard key={`${agent.chain_id}-${agent.agent_id}`} agent={agent} />
            ))}
      </div>
    </div>
  )
}

export default function AgentsPage() {
  // Fetch agents for card sections (no filters — always show global top)
  const { data: scoreData, isLoading: isLoadingScore } = useAgents({
    sort: 'score',
    limit: 18,
  })

  const { data: recentData, isLoading: isLoadingRecent } = useAgents({
    sort: 'recent',
    limit: 18,
  })

  // Derive sections from the data — 3 cards each
  const topScored = useMemo(() => {
    return (scoreData?.agents || []).slice(0, 3)
  }, [scoreData])

  const recentlyDeployed = useMemo(() => {
    return (recentData?.agents || []).slice(0, 3)
  }, [recentData])

  const recentReputation = useMemo(() => {
    const agents = [...(scoreData?.agents || [])]
    return agents
      .sort((a, b) => b.feedback_count - a.feedback_count)
      .slice(0, 3)
  }, [scoreData])

  const isLoading = isLoadingScore || isLoadingRecent

  return (
    <div className="space-y-8">
      <PageHeader
        title="Explore Agents"
        subtitle="Track every on-chain AI agent — ERC-8004 identity & reputation, x402 payment activity, and real-time data across Monad."
      />

      {/* Three sections side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgentColumn
          title="Top Scored"
          agents={topScored}
          isLoading={isLoading}
        />
        <AgentColumn
          title="Recently Deployed"
          agents={recentlyDeployed}
          isLoading={isLoading}
        />
        <AgentColumn
          title="Recent Reputation"
          agents={recentReputation}
          isLoading={isLoading}
        />
      </div>

      {/* Agent Browse Table — has its own search/sort/pagination */}
      <AgentBrowseTable />
    </div>
  )
}
