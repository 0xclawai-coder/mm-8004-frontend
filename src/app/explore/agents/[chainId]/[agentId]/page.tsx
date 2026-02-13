'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, Sparkles, MessageSquare, Star, Zap, ShieldCheck, Construction } from 'lucide-react'
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

import { getChainFullLabel as getChainLabel } from '@/lib/chain-utils'

function isNewbie(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}


function SkeletonInfoRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <Skeleton className="h-4 w-24" />
    </div>
  )
}

function BasicInfoPanelSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-1">
      <h3 className="text-base font-semibold text-foreground pb-2">Basic Information</h3>

      {/* On-chain Identity */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 pb-2">
          <Shield className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On-chain Identity</span>
        </div>
        <div className="divide-y divide-border/30">
          <SkeletonInfoRow label="Agent ID" />
          <SkeletonInfoRow label="Chain" />
          <SkeletonInfoRow label="Owner" />
          <SkeletonInfoRow label="x402" />
          <SkeletonInfoRow label="Status" />
        </div>
      </div>

      {/* Off-chain Metadata */}
      <div className="space-y-0.5 pt-3">
        <div className="flex items-center gap-2 pb-2">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Off-chain Metadata</span>
        </div>
        <div className="divide-y divide-border/30">
          <SkeletonInfoRow label="Agent URI" />
          <SkeletonInfoRow label="Categories" />
          <SkeletonInfoRow label="Created" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ agentId }: { agentId: string }) {
  return (
    <div className="space-y-8">
      <Link href="/explore/agents">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Entity Not Found</h2>
            <p className="text-sm text-muted-foreground">
              Could not find entity with ID &quot;{agentId}&quot;.
            </p>
          </div>
          <Link href="/explore/agents">
            <Button variant="default" size="sm">
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
  params: Promise<{ chainId: string; agentId: string }>
}) {
  const { chainId: chainIdParam, agentId: agentNumericId } = use(params)
  const [activeTab, setActiveTab] = useState('overview')
  const tabsRef = useRef<HTMLDivElement>(null)

  const chainId = parseInt(chainIdParam, 10)
  const agentId = `${chainIdParam}-${agentNumericId}`

  const { data: agent, isLoading, error } = useAgent(agentId)

  if (error && !isLoading) {
    return <ErrorState agentId={agentId} />
  }

  // Build status badges
  const badges: { label: string; icon: React.ReactNode; className: string }[] = []
  if (agent?.active) {
    badges.push({
      label: 'Active',
      icon: <Zap className="size-3" />,
      className: 'border-green-500/30 bg-green-500/10 text-green-400',
    })
  }
  if (agent?.x402_support) {
    badges.push({
      label: 'x402',
      icon: <Shield className="size-3" />,
      className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    })
  }
  if (agent && isNewbie(agent.block_timestamp)) {
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
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/explore/agents">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Agents
        </Button>
      </Link>

      {/* Agent Header — lightweight since HoloCard carries the visual weight */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {agent ? (agent.name || `Agent #${agent.agent_id}`) : <Skeleton className="inline-block h-8 w-48" />}
          </h1>
          {badges.map((b) => (
            <Badge key={b.label} variant="outline" className={cn('text-xs gap-1', b.className)}>
              {b.icon}
              {b.label}
            </Badge>
          ))}
        </div>
        {agent?.description ? (
          <p className="text-sm text-muted-foreground max-w-3xl">
            {agent.description}
          </p>
        ) : !agent ? (
          <Skeleton className="h-4 w-96" />
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {agent ? (
            <>
              {agent.reputation_score != null && agent.reputation_score > 0 && (
                <>
                  <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                    <Star className="size-3 fill-yellow-400" />
                    {Number(agent.reputation_score).toLocaleString()}
                  </span>
                  <span className="h-3 w-px bg-border/50" />
                </>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                {agent.feedback_count} feedback{agent.feedback_count !== 1 ? 's' : ''}
              </span>
              <span className="h-3 w-px bg-border/50" />
              <span>Registered <TimeCounter targetTime={new Date(agent.block_timestamp)} /></span>
            </>
          ) : (
            <>
              <Skeleton className="h-3 w-24" />
              <span className="h-3 w-px bg-border/50" />
              <Skeleton className="h-3 w-32" />
            </>
          )}
        </div>
      </div>

      {/* Two-column: HoloCard + Basic Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: HoloCard */}
        <div className="flex justify-center lg:justify-start">
          {agent ? (
            <HoloCard agent={agent} />
          ) : (
            <HoloCard />
          )}
        </div>

        {/* Right: Basic Information Panel */}
        {agent ? (
          <BasicInfoPanel agent={agent} />
        ) : (
          <BasicInfoPanelSkeleton />
        )}
      </div>

      {/* Tabs */}
      <div ref={tabsRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1">
              Track Record
              {agent && agent.feedback_count > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {agent.feedback_count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="identity">
              Profile
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-1">
              <ShieldCheck className="size-3" />
              Certification
            </TabsTrigger>
            <TabsTrigger value="metadata">
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {agent ? (
              <OverviewTab
                agent={agent}
                agentId={agentId}
                chainId={chainId}
                agentNumericId={agentNumericId}
                onSwitchToFeedback={handleSwitchToFeedback}
              />
            ) : (
              <div className="py-6 flex flex-col gap-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback">
            <ReputationActivityTab agentId={agentId} />
          </TabsContent>

          <TabsContent value="identity">
            <IdentityActivityTab agentId={agentId} />
          </TabsContent>

          <TabsContent value="verification">
            <div className="py-8">
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10">
                  <Construction className="size-8 text-yellow-400" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Certification — Coming Soon</h3>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    Monad has not yet deployed the EIP-8004 certification contract.
                    Once deployed, entities will be able to undergo on-chain identity certification,
                    proving ownership and authenticity of their capabilities.
                  </p>
                </div>
                <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs">
                  TBD
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metadata">
            <div className="py-4">
              {agent ? (
                agent.metadata ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
                    <h3 className="text-sm font-semibold text-foreground">Raw Metadata</h3>
                    <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs text-foreground/80 font-mono leading-relaxed">
                      {JSON.stringify(agent.metadata, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm text-muted-foreground">No metadata available.</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
