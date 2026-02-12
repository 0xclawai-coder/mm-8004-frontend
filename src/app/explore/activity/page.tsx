'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  Users,
  MessageSquare,
  UserPlus,
  MessagesSquare,
  Radio,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { useGlobalActivity } from '@/hooks/useGlobalActivity'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatAddress, formatDistanceToNowSmart } from '@/lib/utils'
import type { EventType, EventCategory, GlobalActivity as GlobalActivityType } from '@/types'

// ============================================================
// Constants
// ============================================================

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  Registered: {
    label: 'Registered',
    color: 'border-green-500/30 bg-green-500/10 text-green-400',
    icon: '🆕',
  },
  URIUpdated: {
    label: 'URI Updated',
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    icon: '🔗',
  },
  MetadataSet: {
    label: 'Metadata Set',
    color: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
    icon: '📝',
  },
  NewFeedback: {
    label: 'New Feedback',
    color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    icon: '⭐',
  },
  FeedbackRevoked: {
    label: 'Feedback Revoked',
    color: 'border-red-500/30 bg-red-500/10 text-red-400',
    icon: '🚫',
  },
  ResponseAppended: {
    label: 'Response',
    color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    icon: '💬',
  },
}

const FILTER_OPTIONS: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'identity', label: 'Identity' },
  { value: 'reputation', label: 'Reputation' },
]

function getEventConfig(eventType: string) {
  return (
    EVENT_TYPE_CONFIG[eventType] ?? {
      label: eventType,
      color: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
      icon: '📌',
    }
  )
}

function getTxUrl(chainId: number, hash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${hash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${hash}`
  return '#'
}

function getChainBadge(chainId: number) {
  if (chainId === 143) return { label: 'Monad', color: 'border-green-500/30 bg-green-500/10 text-green-400' }
  if (chainId === 10143) return { label: 'Testnet', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' }
  return { label: `Chain ${chainId}`, color: '' }
}

function getEventDetails(activity: GlobalActivityType): string {
  const data = activity.event_data
  if (!data) return ''

  switch (activity.event_type) {
    case 'Registered':
      return data.owner ? `by ${formatAddress(data.owner as string)}` : ''
    case 'MetadataSet':
      return data.key ? `key: ${data.key}` : ''
    case 'NewFeedback':
      return [
        data.tag1 && `tag: ${data.tag1}`,
        data.client && `from ${formatAddress(data.client as string)}`,
      ]
        .filter(Boolean)
        .join(' · ')
    case 'FeedbackRevoked':
      return data.client ? `by ${formatAddress(data.client as string)}` : ''
    case 'URIUpdated':
      return 'URI changed'
    case 'ResponseAppended':
      return data.feedback_id ? `feedback #${data.feedback_id}` : ''
    default:
      return ''
  }
}

// ============================================================
// Stat Card
// ============================================================

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: string
  subtext?: string
}

function StatCard({ label, value, icon, accent, subtext }: StatCardProps) {
  return (
    <Card className="border-border/50 bg-card/60 py-0">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            accent ?? 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtext && (
            <p className="text-[10px] text-muted-foreground">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/60 py-0">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Activity Row
// ============================================================

function ActivityRow({ activity }: { activity: GlobalActivityType }) {
  const config = getEventConfig(activity.event_type)
  const chain = getChainBadge(activity.chain_id)
  const details = getEventDetails(activity)
  const agentName =
    activity.agent_name || `Agent #${activity.agent_id}`

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/10 last:border-b-0">
      {/* Event type icon */}
      <span className="text-base shrink-0 w-7 text-center">{config.icon}</span>

      {/* Event badge */}
      <Badge
        variant="outline"
        className={cn('text-[10px] shrink-0 w-28 justify-center', config.color)}
      >
        {config.label}
      </Badge>

      {/* Agent name */}
      <Link
        href={`/explore/agents/${activity.chain_id}/${activity.agent_id}`}
        className="shrink-0 w-36 truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {agentName}
      </Link>

      {/* Details */}
      <span className="flex-1 truncate text-xs text-muted-foreground min-w-0">
        {details}
      </span>

      {/* Chain badge */}
      <Badge
        variant="outline"
        className={cn('text-[10px] shrink-0 hidden sm:inline-flex', chain.color)}
      >
        {chain.label}
      </Badge>

      {/* Time */}
      <span className="shrink-0 w-16 text-right text-xs text-muted-foreground">
        {formatDistanceToNowSmart(new Date(activity.block_timestamp), {
          addSuffix: false,
        })}
      </span>

      {/* TX Link */}
      <a
        href={getTxUrl(activity.chain_id, activity.tx_hash)}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors"
        title={activity.tx_hash}
      >
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}

function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/10">
      <Skeleton className="size-7 rounded" />
      <Skeleton className="h-5 w-28 rounded-full" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 flex-1 max-w-[200px]" />
      <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="size-3.5" />
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function ActivityPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const [filter, setFilter] = useState<EventCategory | 'all'>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: activityData, isLoading: activityLoading } = useGlobalActivity({
    event_type: filter === 'all' ? undefined : filter,
    page,
    limit,
  })

  const activities = activityData?.activities ?? []
  const total = activityData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recent Activity"
        subtitle="Global on-chain events across all agents"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Agents"
              value={stats?.total_agents ?? 0}
              icon={<Users className="size-5" />}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              label="Total Feedbacks"
              value={stats?.total_feedbacks ?? 0}
              icon={<MessageSquare className="size-5" />}
              accent="bg-cyan-500/10 text-cyan-400"
            />
            <StatCard
              label="24h Registrations"
              value={stats?.recent_registrations_24h ?? 0}
              icon={<UserPlus className="size-5" />}
              accent="bg-green-500/10 text-green-400"
              subtext="New agents last 24h"
            />
            <StatCard
              label="24h Feedbacks"
              value={stats?.recent_feedbacks_24h ?? 0}
              icon={<MessagesSquare className="size-5" />}
              accent="bg-yellow-500/10 text-yellow-400"
              subtext="Feedbacks last 24h"
            />
          </>
        )}
      </div>

      {/* Chain breakdown mini-cards */}
      {!statsLoading && stats?.agents_by_chain && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(stats.agents_by_chain).map(([chainId, count]) => {
            const label =
              chainId === '143'
                ? 'Monad'
                : chainId === '10143'
                  ? 'Monad Testnet'
                  : `Chain ${chainId}`
            const dotColor = chainId === '143' ? 'bg-green-400' : 'bg-yellow-400'
            return (
              <div
                key={chainId}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3"
              >
                <span
                  className={cn(
                    'inline-block size-2 rounded-full',
                    dotColor
                  )}
                />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {count} agents
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Activity Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Activity Feed
            </h2>
            {total > 0 && (
              <span className="text-xs text-muted-foreground">
                ({total.toLocaleString()} events)
              </span>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground mr-1" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilter(opt.value)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filter === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/60 text-muted-foreground hover:text-foreground border border-border/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Activity Table */}
        <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            <span className="w-7" />
            <span className="w-28 text-center">Event</span>
            <span className="w-36">Agent</span>
            <span className="flex-1">Details</span>
            <span className="w-16 hidden sm:block text-center">Chain</span>
            <span className="w-16 text-right">Time</span>
            <span className="w-4">TX</span>
          </div>

          {/* Rows */}
          {activityLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ActivityRowSkeleton key={i} />
            ))
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Radio className="size-7 text-primary" />
                </div>
                <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-cyan-500/20">
                  <Zap className="size-3 text-cyan-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">
                No activity found
              </p>
              <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
                {filter !== 'all'
                  ? 'Try a different filter or check back later.'
                  : 'On-chain events will appear here as they are indexed.'}
              </p>
            </div>
          ) : (
            activities.map((a) => <ActivityRow key={a.id} activity={a} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="gap-1 text-xs"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
