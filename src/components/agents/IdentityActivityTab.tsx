'use client'

import { UserPlus, Link2, FileText, ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { useAgentActivity } from '@/hooks/useAgentActivity'
import type { Activity, EventType } from '@/types'

interface IdentityActivityTabProps {
  agentId: string
}

function getExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${txHash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${txHash}`
  return `#`
}

function getEventIcon(eventType: EventType) {
  switch (eventType) {
    case 'Registered':
      return <UserPlus className="size-4" />
    case 'URIUpdated':
      return <Link2 className="size-4" />
    case 'MetadataSet':
      return <FileText className="size-4" />
    default:
      return <FileText className="size-4" />
  }
}

function getEventColor(eventType: EventType): string {
  switch (eventType) {
    case 'Registered':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'URIUpdated':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'MetadataSet':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getEventDescription(event: Activity): string {
  switch (event.event_type) {
    case 'Registered':
      return 'Agent registered on-chain'
    case 'URIUpdated': {
      const uri = event.event_data?.uri as string | undefined
      return uri ? `Agent URI updated to ${uri}` : 'Agent URI updated'
    }
    case 'MetadataSet': {
      const key = event.event_data?.key as string | undefined
      return key ? `Metadata "${key}" was set` : 'Metadata was updated'
    }
    default:
      return `Event: ${event.event_type}`
  }
}

function truncateHash(hash: string): string {
  if (!hash) return ''
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

export function IdentityActivityTab({ agentId }: IdentityActivityTabProps) {
  const { data, isLoading, error } = useAgentActivity(agentId, {
    event_type: 'identity',
  })

  if (isLoading) {
    return (
      <div className="relative py-4">
        {/* Timeline line skeleton */}
        <div className="absolute left-5 top-8 bottom-4 w-px bg-border/30" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative flex gap-4 pl-1">
              {/* Timeline node */}
              <Skeleton className="relative z-10 size-10 shrink-0 rounded-full" />
              {/* Event content */}
              <div className="min-w-0 flex-1 pt-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-3 w-28 shrink-0" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load identity activity.
      </div>
    )
  }

  const activities = data?.activities || []

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center">
        <UserPlus className="mx-auto mb-3 size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No identity events yet.</p>
      </div>
    )
  }

  return (
    <div className="relative py-4">
      {/* Timeline line */}
      <div className="absolute left-5 top-8 bottom-4 w-px bg-border/50" />

      <div className="space-y-6">
        {activities.map((event) => (
          <div key={event.id} className="relative flex gap-4 pl-1">
            {/* Timeline node */}
            <div
              className={cn(
                'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border',
                getEventColor(event.event_type),
              )}
            >
              {getEventIcon(event.event_type)}
            </div>

            {/* Event content */}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {event.event_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getEventDescription(event)}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  <TimeCounter targetTime={new Date(event.block_timestamp)} />
                </time>
              </div>

              {/* Tx hash link */}
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
          </div>
        ))}
      </div>
    </div>
  )
}
