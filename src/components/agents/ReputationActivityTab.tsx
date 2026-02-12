'use client'

import { Star, MessageSquare, Ban, Reply, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { useAgentActivity } from '@/hooks/useAgentActivity'
import type { Activity, EventType } from '@/types'

interface ReputationActivityTabProps {
  agentId: string
}

function getExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${txHash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${txHash}`
  return `#`
}

function getEventIcon(eventType: EventType) {
  switch (eventType) {
    case 'NewFeedback':
      return <MessageSquare className="size-4" />
    case 'FeedbackRevoked':
      return <Ban className="size-4" />
    case 'ResponseAppended':
      return <Reply className="size-4" />
    default:
      return <Star className="size-4" />
  }
}

function getEventColor(eventType: EventType): string {
  switch (eventType) {
    case 'NewFeedback':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    case 'FeedbackRevoked':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'ResponseAppended':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function truncateHash(hash: string): string {
  if (!hash) return ''
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

function ScoreStars({ value }: { value: number }) {
  // Assume value is normalized to 0-5 scale
  const score = Math.min(5, Math.max(0, value))
  const fullStars = Math.floor(score)
  const hasHalf = score - fullStars >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`f-${i}`} className="size-3 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalf && (
        <div className="relative">
          <Star className="size-3 text-muted-foreground/30" />
          <div className="absolute inset-0 w-1/2 overflow-hidden">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: 5 - fullStars - (hasHalf ? 1 : 0) }).map((_, i) => (
        <Star key={`e-${i}`} className="size-3 text-muted-foreground/30" />
      ))}
    </div>
  )
}

function FeedbackCard({ event }: { event: Activity }) {
  const data = event.event_data || {}
  const clientAddress = (data.client ?? data.client_address) as string | undefined
  const rawValue = data.value as number | undefined
  const valueDecimals = (data.valueDecimals ?? data.value_decimals ?? 0) as number
  const value = rawValue !== undefined ? rawValue / Math.pow(10, valueDecimals) : undefined
  const tag1 = data.tag1 as string | undefined
  const tag2 = data.tag2 as string | undefined
  const endpoint = data.endpoint as string | undefined
  const revoked = data.revoked as boolean | undefined

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border/50 bg-card/60 p-4 transition-colors hover:bg-card/80',
        revoked && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border',
              getEventColor(event.event_type),
            )}
          >
            {getEventIcon(event.event_type)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {event.event_type === 'NewFeedback' && 'New Feedback'}
              {event.event_type === 'FeedbackRevoked' && 'Feedback Revoked'}
              {event.event_type === 'ResponseAppended' && 'Response Appended'}
            </p>
            {clientAddress && (
              <p className="font-mono text-xs text-muted-foreground">
                from {truncateAddress(clientAddress)}
              </p>
            )}
          </div>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground">
          <TimeCounter targetTime={new Date(event.block_timestamp)} />
        </time>
      </div>

      {/* Score + Tags */}
      <div className="flex flex-wrap items-center gap-3">
        {value !== undefined && (
          <div className="flex items-center gap-1.5">
            <ScoreStars value={value} />
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
          </div>
        )}
        {tag1 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            {tag1}
          </Badge>
        )}
        {tag2 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            {tag2}
          </Badge>
        )}
        {revoked && (
          <Badge variant="destructive" className="text-xs">
            Revoked
          </Badge>
        )}
      </div>

      {/* Endpoint */}
      {endpoint && (
        <p className="truncate text-xs text-muted-foreground">
          Endpoint: <span className="font-mono text-foreground/70">{endpoint}</span>
        </p>
      )}

      {/* Tx hash */}
      {event.tx_hash && (
        <a
          href={getExplorerUrl(event.chain_id, event.tx_hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
        >
          <span className="font-mono">{truncateHash(event.tx_hash)}</span>
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}

export function ReputationActivityTab({ agentId }: ReputationActivityTabProps) {
  const { data, isLoading, error } = useAgentActivity(agentId, {
    event_type: 'reputation',
  })

  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-card/60 p-4 space-y-3">
            {/* Header: icon + event type + address + time */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-3 w-28 shrink-0" />
            </div>
            {/* Score + Tags */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="size-3 rounded-sm" />
                ))}
              </div>
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            {/* Tx hash */}
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load reputation activity.
      </div>
    )
  }

  const activities = data?.activities || []

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No reputation events yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-4">
      {activities.map((event) => (
        <FeedbackCard key={event.id} event={event} />
      ))}
    </div>
  )
}
