'use client'

import { useMemo } from 'react'
import { useAgents } from '@/hooks/useAgents'
import { AgentCard } from '@/components/agents/AgentCard'
import { AgentBrowseTable } from '@/components/agents/AgentBrowseTable'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Agent } from '@/types'

function AgentCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/80 py-0">
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Top row: Avatar + Name + Description */}
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        {/* Category tags */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        {/* Bottom row: Score + Feedbacks | x402 + Chain badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-10 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
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
    <div className="min-w-0">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
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
      {/* Hero Banner */}
      <section className="py-8 text-center sm:py-12">
        <h1 className="text-gradient-glow text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Molt Marketplace
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Track every on-chain AI agent in one place — ERC-8004 identity & reputation,
          x402 payment activity, and real-time agentic data across Monad.
        </p>
      </section>

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
