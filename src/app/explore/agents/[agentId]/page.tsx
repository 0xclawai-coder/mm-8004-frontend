'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Sparkles, MessageSquare, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { useAgent } from '@/hooks/useAgent'
import { HoloCard } from '@/components/agents/HoloCard'
import { BasicInfoPanel } from '@/components/agents/BasicInfoPanel'
import { OverviewTab } from '@/components/agents/OverviewTab'
import { IdentityActivityTab } from '@/components/agents/IdentityActivityTab'
import { ReputationActivityTab } from '@/components/agents/ReputationActivityTab'

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

function isNewbie(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}


function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Skeleton className="mb-6 h-9 w-36 rounded-lg" />

      {/* Agent Header — mirrors actual header structure */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <div className="h-3 w-px bg-border/50" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Two-column: HoloCard + BasicInfoPanel */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* HoloCard skeleton — matches 300px x 420px card */}
        <div className="flex justify-center lg:justify-start">
          <div className="w-full max-w-[300px] rounded-2xl border border-border/50 bg-card/95 overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3.5 w-full" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-auto">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* BasicInfoPanel skeleton — matches info rows */}
        <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-1">
          <Skeleton className="h-5 w-36 mb-3" />
          {/* Contract State section */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="divide-y divide-border/30">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
          {/* Off-chain section */}
          <div className="space-y-0.5 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="divide-y divide-border/30">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-border/50 pb-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-18 rounded-md" />
        <Skeleton className="h-8 w-22 rounded-md" />
      </div>

      {/* Overview tab content skeleton — Stats + Chart */}
      <div className="space-y-6 py-4">
        {/* Statistics Overview */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/30 p-4 text-center space-y-2">
                <Skeleton className="mx-auto size-8 rounded-lg" />
                <Skeleton className="mx-auto h-6 w-12" />
                <Skeleton className="mx-auto h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        {/* Chart */}
        <div className="rounded-xl border border-border/50 bg-card/60 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-48 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-56 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ agentId }: { agentId: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/explore/agents">
        <Button variant="ghost" size="sm" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Agent Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not find agent with ID &quot;{agentId}&quot;.
          </p>
          <Link href="/explore/agents">
            <Button variant="default" size="sm" className="mt-6">
              Browse All Agents
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ agentId: string }>
}) {
  const { agentId } = use(params)
  const [activeTab, setActiveTab] = useState('overview')
  const tabsRef = useRef<HTMLDivElement>(null)

  // Parse agentId format: "{chainId}-{agentId}" e.g. "143-1"
  const parts = agentId.split('-')
  const chainId = parts.length >= 2 ? parseInt(parts[0], 10) : 0
  const agentNumericId = parts.length >= 2 ? parts.slice(1).join('-') : agentId

  const { data: agent, isLoading, error } = useAgent(agentId)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !agent) {
    return <ErrorState agentId={agentId} />
  }

  // Build status badges
  const badges: { label: string; icon: React.ReactNode; className: string }[] = []
  if (agent.active) {
    badges.push({
      label: 'Active',
      icon: <Zap className="size-3" />,
      className: 'border-green-500/30 bg-green-500/10 text-green-400',
    })
  }
  if (agent.x402_support) {
    badges.push({
      label: 'x402',
      icon: <Shield className="size-3" />,
      className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    })
  }
  if (isNewbie(agent.block_timestamp)) {
    badges.push({
      label: 'Newbie',
      icon: <Sparkles className="size-3" />,
      className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    })
  }

  const handleSwitchToFeedback = () => {
    setActiveTab('feedback')
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/explore/agents">
        <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>

      {/* Agent Header */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {agent.name || `Agent #${agent.agent_id}`}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              agent.chain_id === 143
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
            )}
          >
            {getChainLabel(agent.chain_id)}
          </Badge>
          {badges.map((b) => (
            <Badge key={b.label} variant="outline" className={cn('text-xs gap-1', b.className)}>
              {b.icon}
              {b.label}
            </Badge>
          ))}
        </div>
        {agent.description && (
          <p className="text-sm text-muted-foreground max-w-3xl">
            {agent.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {agent.feedback_count} feedback{agent.feedback_count !== 1 ? 's' : ''}
          </span>
          <span className="h-3 w-px bg-border/50" />
          <span>Last active <TimeCounter targetTime={new Date(agent.block_timestamp)} /></span>
        </div>
      </div>

      {/* Two-column: HoloCard + Basic Info */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: HoloCard */}
        <div className="flex justify-center lg:justify-start">
          <HoloCard agent={agent} />
        </div>

        {/* Right: Basic Information Panel */}
        <BasicInfoPanel agent={agent} />
      </div>

      {/* Tabs */}
      <div ref={tabsRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1">
              Feedback
              {agent.feedback_count > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {agent.feedback_count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="identity">
              Identity
            </TabsTrigger>
            <TabsTrigger value="metadata">
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              agent={agent}
              agentId={agentId}
              chainId={chainId}
              agentNumericId={agentNumericId}
              onSwitchToFeedback={handleSwitchToFeedback}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <ReputationActivityTab agentId={agentId} />
          </TabsContent>

          <TabsContent value="identity">
            <IdentityActivityTab agentId={agentId} />
          </TabsContent>

          <TabsContent value="metadata">
            <div className="py-4">
              {agent.metadata ? (
                <div className="rounded-xl border border-border/50 bg-card/60 p-6">
                  <h3 className="mb-4 text-sm font-semibold text-foreground">Raw Metadata</h3>
                  <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs text-foreground/80 font-mono leading-relaxed">
                    {JSON.stringify(agent.metadata, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No metadata available.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
