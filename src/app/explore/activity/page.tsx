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
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { useGlobalActivity } from '@/hooks/useGlobalActivity'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { cn, formatAddress, formatDistanceToNowSmart } from '@/lib/utils'
import { getExplorerTxUrl as getTxUrl } from '@/lib/chain-utils'
import type { ColumnDef } from '@tanstack/react-table'
import type { EventCategory, GlobalActivity as GlobalActivityType } from '@/types'

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
  'marketplace:Listed': {
    label: 'Listed for Acquisition',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    icon: '🏷️',
  },
  'marketplace:Bought': {
    label: 'Acquired',
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    icon: '🤝',
  },
  'marketplace:OfferMade': {
    label: 'Offer Submitted',
    color: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    icon: '📨',
  },
  'marketplace:AuctionCreated': {
    label: 'Live Round Started',
    color: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
    icon: '🔨',
  },
  'marketplace:DutchAuctionCreated': {
    label: 'Dutch Round Started',
    color: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
    icon: '📉',
  },
  'marketplace:BidPlaced': {
    label: 'Offer Placed',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    icon: '💰',
  },
  'marketplace:AuctionSettled': {
    label: 'Round Settled',
    color: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
    icon: '✅',
  },
}

const FILTER_OPTIONS: { value: EventCategory | 'all' | 'marketplace'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'identity', label: 'Identity' },
  { value: 'reputation', label: 'Track Record' },
  { value: 'marketplace', label: 'Deals' },
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
        data.value != null && `score: ${Number(data.value).toLocaleString()}`,
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
    case 'marketplace:Listed':
      return data.price ? `${data.price} ${data.payment_token === '0x0000000000000000000000000000000000000000' ? 'MON' : 'ERC-20'}` : ''
    case 'marketplace:Bought':
      return [
        data.price && `for ${data.price} MON`,
        data.buyer && `by ${formatAddress(data.buyer as string)}`,
      ].filter(Boolean).join(' · ')
    case 'marketplace:OfferMade':
      return [
        data.amount && `${data.amount} WMON`,
        data.offerer && `from ${formatAddress(data.offerer as string)}`,
      ].filter(Boolean).join(' · ')
    case 'marketplace:AuctionCreated':
    case 'marketplace:DutchAuctionCreated':
      return data.starting_price ? `floor ${data.starting_price} MON` : ''
    case 'marketplace:BidPlaced':
      return [
        data.amount && `${data.amount} MON`,
        data.bidder && `by ${formatAddress(data.bidder as string)}`,
      ].filter(Boolean).join(' · ')
    case 'marketplace:AuctionSettled':
      return [
        data.final_price && `for ${data.final_price} MON`,
        data.winner && `to ${formatAddress(data.winner as string)}`,
      ].filter(Boolean).join(' · ')
    default:
      return ''
  }
}

// ============================================================
// Columns
// ============================================================

const activityColumns: ColumnDef<GlobalActivityType, unknown>[] = [
  {
    id: 'icon',
    header: '',
    cell: ({ row }) => {
      const config = getEventConfig(row.original.event_type)
      return <span className="text-base">{config.icon}</span>
    },
    enableSorting: false,
    size: 48,
  },
  {
    id: 'event',
    header: 'Event',
    cell: ({ row }) => {
      const config = getEventConfig(row.original.event_type)
      return (
        <Badge
          variant="outline"
          className={cn('text-[10px] justify-center', config.color)}
        >
          {config.label}
        </Badge>
      )
    },
    enableSorting: false,
    size: 160,
  },
  {
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) => {
      const a = row.original
      const agentName = a.agent_name || `Agent #${a.agent_id}`
      return (
        <Link
          href={`/explore/agents/${a.chain_id}/${a.agent_id}`}
          className="truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {agentName}
        </Link>
      )
    },
    enableSorting: false,
    size: 160,
  },
  {
    id: 'details',
    header: 'Details',
    cell: ({ row }) => (
      <span className="truncate text-xs text-muted-foreground">
        {getEventDetails(row.original)}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: 'chain',
    header: 'Chain',
    cell: ({ row }) => {
      const chain = getChainBadge(row.original.chain_id)
      return (
        <Badge variant="outline" className={cn('text-[10px]', chain.color)}>
          {chain.label}
        </Badge>
      )
    },
    enableSorting: false,
    size: 90,
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    id: 'time',
    header: 'Time',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground text-right">
        {formatDistanceToNowSmart(new Date(row.original.block_timestamp), {
          addSuffix: false,
        })}
      </span>
    ),
    enableSorting: false,
    size: 80,
    meta: { className: 'text-right' },
  },
  {
    id: 'tx',
    header: 'TX',
    cell: ({ row }) => {
      const a = row.original
      return (
        <a
          href={getTxUrl(a.chain_id, a.tx_hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground/50 hover:text-primary transition-colors"
          title={a.tx_hash}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-3.5" />
        </a>
      )
    },
    enableSorting: false,
    size: 48,
  },
]

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

function StatCardLoading({ label, icon, accent, subtext }: { label: string; icon: React.ReactNode; accent?: string; subtext?: string }) {
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
          <Skeleton className="mt-1 h-6 w-20" />
          {subtext && (
            <p className="text-[10px] text-muted-foreground">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Page
// ============================================================

export default function ActivityPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const [filter, setFilter] = useState<EventCategory | 'all' | 'marketplace'>('all')
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: activityData, isLoading: activityLoading } = useGlobalActivity({
    event_type: filter === 'all' ? undefined : filter,
    chain_id: chainId,
    page,
    limit,
  })

  const activities = activityData?.activities ?? []
  const total = activityData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        subtitle="On-chain events across all entities — incorporations, track records, and deals"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <StatCardLoading label="Incorporated Entities" icon={<Users className="size-5" />} accent="bg-primary/10 text-primary" />
            <StatCardLoading label="Track Records" icon={<MessageSquare className="size-5" />} accent="bg-cyan-500/10 text-cyan-400" />
            <StatCardLoading label="24h Incorporations" icon={<UserPlus className="size-5" />} accent="bg-green-500/10 text-green-400" subtext="New entities last 24h" />
            <StatCardLoading label="24h Track Records" icon={<MessagesSquare className="size-5" />} accent="bg-yellow-500/10 text-yellow-400" subtext="Track records last 24h" />
          </>
        ) : (
          <>
            <StatCard
              label="Incorporated Entities"
              value={stats?.total_agents ?? 0}
              icon={<Users className="size-5" />}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              label="Track Records"
              value={stats?.total_feedbacks ?? 0}
              icon={<MessageSquare className="size-5" />}
              accent="bg-cyan-500/10 text-cyan-400"
            />
            <StatCard
              label="24h Incorporations"
              value={stats?.recent_registrations_24h ?? 0}
              icon={<UserPlus className="size-5" />}
              accent="bg-green-500/10 text-green-400"
              subtext="New entities last 24h"
            />
            <StatCard
              label="24h Track Records"
              value={stats?.recent_feedbacks_24h ?? 0}
              icon={<MessagesSquare className="size-5" />}
              accent="bg-yellow-500/10 text-yellow-400"
              subtext="Track records last 24h"
            />
          </>
        )}
      </div>

      {/* Chain breakdown mini-cards */}
      {!statsLoading && stats?.agents_by_chain && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(stats.agents_by_chain).map(([cId, count]) => {
            const label =
              cId === '143'
                ? 'Monad'
                : cId === '10143'
                  ? 'Monad Testnet'
                  : `Chain ${cId}`
            const dotColor = cId === '143' ? 'bg-green-400' : 'bg-yellow-400'
            return (
              <div
                key={cId}
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
                    {count} entities
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

        {/* Chain filter */}
        <ChainFilter selected={chainId} onSelect={(id) => { setChainId(id); setPage(1) }} />

        {/* Filter pills */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
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
        </div>

        {/* Activity Table — server-side pagination, DataTable handles rendering */}
        <DataTable
          columns={activityColumns}
          data={activities}
          isLoading={activityLoading}
          skeletonRows={8}
          pageSize={999}
          emptyMessage={
            filter !== 'all'
              ? 'Try a different filter or check back later.'
              : 'On-chain events will appear here as they are indexed.'
          }
        />

        {/* Server-side Pagination */}
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
