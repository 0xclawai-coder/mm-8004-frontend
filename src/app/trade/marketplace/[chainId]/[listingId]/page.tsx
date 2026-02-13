'use client'

import { use, useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Tag,
  Activity,
  Clock,
  CircleDot,
  Hash,
  Layers,
  TrendingUp,
  DollarSign,
  User,
  ShoppingCart,
  HandCoins,
  Loader2,
  Wallet,
  Star,
} from 'lucide-react'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatAddress, formatDistanceToNowSmart, formatPrice, getTokenLabel } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { useListing } from '@/hooks/useListing'
import { useAgentActivity } from '@/hooks/useAgentActivity'
import { useOffers } from '@/hooks/useOffers'
import { HoloCard } from '@/components/agents/HoloCard'
import {
  CONTRACT_ADDRESSES,
  NATIVE_TOKEN,
  moltMarketplaceAbi,
  erc20Abi,
  parsePriceToBigInt,
  getMoltMarketplaceAddress,
  type SupportedChainId,
} from '@/lib/contracts'
import type { Activity as ActivityType, AgentDetail, EventCategory, MarketplaceOffer } from '@/types'

// ============================================================
// Helpers
// ============================================================

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

function getChainShortLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

function getExplorerUrl(chainId: number, address: string): string {
  if (chainId === 143) return `https://monadexplorer.com/address/${address}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/address/${address}`
  return '#'
}

function getTxUrl(chainId: number, hash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${hash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${hash}`
  return '#'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return 'border-green-500/30 bg-green-500/10 text-green-400'
    case 'Sold':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    case 'Cancelled':
      return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
    case 'Expired':
      return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
    default:
      return ''
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500/10 border-green-500/20'
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function isNativeToken(token: string): boolean {
  return token.toLowerCase() === NATIVE_TOKEN.toLowerCase()
}

// ============================================================
// Copy Button
// ============================================================

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn('inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors', className)}
      title="Copy to clipboard"
    >
      {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
    </button>
  )
}

// ============================================================
// Error State
// ============================================================

function ErrorState({ id }: { id: string }) {
  return (
    <div className="space-y-8">
      <Link href="/trade/marketplace">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-foreground">Listing Not Found</h2>
            <p className="text-sm text-muted-foreground">
              Could not find listing &quot;{id}&quot;.
            </p>
          </div>
          <Link href="/trade/marketplace">
            <Button variant="default" size="sm">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Price Info Card
// ============================================================

function PriceInfoCard({
  label,
  value,
  subValue,
  icon,
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-3 text-center space-y-1">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
      {subValue && <p className="text-[10px] text-muted-foreground truncate">{subValue}</p>}
    </div>
  )
}

// ============================================================
// Agent Properties Grid (right column — no truncate)
// ============================================================

function PropertyCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-3 space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground break-words">{value}</p>
      {sub && <p className="text-[10px] text-primary/70">{sub}</p>}
    </div>
  )
}

function AgentPropertiesGrid({ agent }: { agent: AgentDetail }) {
  const properties: { label: string; value: string; sub?: string }[] = []

  if (agent.categories && agent.categories.length > 0) {
    agent.categories.forEach((cat) => {
      properties.push({ label: 'Category', value: cat })
    })
  }

  properties.push({
    label: 'x402 Payment',
    value: agent.x402_support ? 'Supported' : 'Not Supported',
    sub: agent.x402_support ? 'Pay-per-use enabled' : undefined,
  })

  properties.push({
    label: 'Reputation',
    value: agent.reputation_score !== null ? `${agent.reputation_score.toFixed(1)} / 100` : 'Unrated',
    sub: `${agent.feedback_count} feedback${agent.feedback_count !== 1 ? 's' : ''}`,
  })

  properties.push({
    label: 'Status',
    value: agent.active ? 'Active' : 'Inactive',
  })

  if (agent.metadata?.capabilities && agent.metadata.capabilities.length > 0) {
    agent.metadata.capabilities.forEach((cap) => {
      properties.push({ label: 'Capability', value: cap })
    })
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Layers className="size-4 text-primary" />
        Agent Properties
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {properties.map((p, i) => (
          <PropertyCard key={`${p.label}-${i}`} label={p.label} value={p.value} sub={p.sub} />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Endpoints Section
// ============================================================

function EndpointsSection({ agent }: { agent: AgentDetail }) {
  if (!agent.metadata?.endpoints || agent.metadata.endpoints.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Globe className="size-4 text-primary" />
        Endpoints
      </h3>
      <div className="space-y-2">
        {agent.metadata.endpoints.map((ep, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 p-3"
          >
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] shrink-0',
                ep.protocol === 'x402'
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                  : 'border-primary/30 bg-primary/10 text-primary',
              )}
            >
              {ep.protocol.toUpperCase()}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground break-all flex-1">
              {ep.url}
            </span>
            <CopyButton value={ep.url} />
            <a
              href={ep.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Provenance Section
// ============================================================

function ProvenanceSection({
  chainId,
  nftContract,
  tokenId,
  txHash,
}: {
  chainId: number
  nftContract: string
  tokenId: string
  txHash: string
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Hash className="size-4 text-primary" />
        Provenance
      </h3>
      <div className="rounded-xl border border-border/30 bg-card/40 divide-y divide-border/20">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Chain</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              chainId === 143
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
            )}
          >
            {getChainLabel(chainId)}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Contract</span>
          <div className="flex items-center gap-1.5">
            <a
              href={getExplorerUrl(chainId, nftContract)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-primary/80 hover:text-primary transition-colors"
            >
              {formatAddress(nftContract)}
              <ExternalLink className="size-2.5" />
            </a>
            <CopyButton value={nftContract} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Token ID</span>
          <span className="font-mono text-xs text-foreground">{tokenId}</span>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Standard</span>
          <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
            EIP-8004
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">TX Hash</span>
          <div className="flex items-center gap-1.5">
            <a
              href={getTxUrl(chainId, txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-primary/80 hover:text-primary transition-colors"
            >
              {formatAddress(txHash)}
              <ExternalLink className="size-2.5" />
            </a>
            <CopyButton value={txHash} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Top Offers Table
// ============================================================

function TopOffersTable({
  offers,
  listingPrice,
  isLoading,
}: {
  offers: MarketplaceOffer[]
  listingPrice: string
  isLoading: boolean
}) {
  const listingPriceNum = parseFloat(listingPrice) / 1e18

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <DollarSign className="size-4 text-primary" />
        Top Offers
      </h3>
      <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border/20">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="No Offers Yet"
            description="Be the first to make an offer on this agent."
            className="py-8"
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border/20 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <span className="w-16">Type</span>
              <span className="flex-1">Amount</span>
              <span className="w-16 text-right">Floor %</span>
              <span className="w-28 text-right">From</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-border/20">
              {offers.map((offer) => {
                const offerPriceNum = parseFloat(offer.amount) / 1e18
                const floorPct = listingPriceNum > 0 ? ((offerPriceNum / listingPriceNum) * 100).toFixed(0) : '—'
                return (
                  <div key={offer.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <Badge variant="outline" className="w-16 justify-center text-[10px] border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      Offer
                    </Badge>
                    <span className="flex-1 text-sm font-semibold text-foreground">
                      {formatPrice(offer.amount)} <span className="text-xs font-normal text-muted-foreground">{getTokenLabel(offer.payment_token)}</span>
                    </span>
                    <span className="w-16 text-right text-xs text-muted-foreground">{floorPct}%</span>
                    <span className="w-28 text-right font-mono text-xs text-muted-foreground">
                      {formatAddress(offer.offerer)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Listing Details Section
// ============================================================

function ListingDetailsSection({
  listing,
}: {
  listing: {
    listing_id: number
    seller: string
    chain_id: number
    nft_contract: string
    token_id: string
    payment_token: string
    price: string
    expiry: number
    status: string
    block_timestamp: string
  }
}) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CircleDot className="size-4 text-primary" />
        Listing Details
      </h3>
      <div className="rounded-xl border border-border/30 bg-card/40 divide-y divide-border/20">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Listing ID</span>
          <span className="font-mono text-xs text-foreground">#{listing.listing_id}</span>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
          <Badge variant="outline" className={cn('text-[10px]', getStatusColor(listing.status))}>
            {listing.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Payment</span>
          <span className="text-xs text-foreground">{getTokenLabel(listing.payment_token)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Listed</span>
          <span className="text-xs text-muted-foreground">
            <TimeCounter targetTime={new Date(listing.block_timestamp)} />
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Expiry</span>
          <span className="text-xs text-muted-foreground">
            {listing.expiry > 0
              ? listing.expiry * 1000 < Date.now()
                ? 'Expired'
                : new Date(listing.expiry * 1000).toLocaleDateString()
              : 'No expiration'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Reputation Score Display
// ============================================================

function ReputationBadge({ score, feedbackCount }: { score: number | null; feedbackCount: number }) {
  const displayScore = score ?? 0

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-3', getScoreBgColor(displayScore))}>
      <div className="relative size-12 shrink-0">
        <svg className="size-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/30" />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(displayScore / 100) * 125.6} 125.6`}
            strokeLinecap="round"
            className={getScoreColor(displayScore)}
          />
        </svg>
        <span className={cn('absolute inset-0 flex items-center justify-center text-xs font-bold', getScoreColor(displayScore))}>
          {displayScore.toFixed(0)}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Reputation Score</p>
        <p className="text-xs text-muted-foreground">
          {feedbackCount} feedback{feedbackCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Item Activity
// ============================================================

const ACTIVITY_EVENT_CONFIG: Record<
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
    label: 'Revoked',
    color: 'border-red-500/30 bg-red-500/10 text-red-400',
    icon: '🚫',
  },
  ResponseAppended: {
    label: 'Response',
    color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    icon: '💬',
  },
}

function getActivityEventConfig(eventType: string) {
  return (
    ACTIVITY_EVENT_CONFIG[eventType] ?? {
      label: eventType,
      color: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
      icon: '📌',
    }
  )
}

function getActivityEventDetails(activity: ActivityType): { from: string; detail: string } {
  const data = activity.event_data
  if (!data) return { from: '—', detail: '' }

  switch (activity.event_type) {
    case 'Registered':
      return {
        from: data.owner ? formatAddress(data.owner as string) : '—',
        detail: 'Agent registered on-chain',
      }
    case 'MetadataSet':
      return {
        from: '—',
        detail: data.key ? `${data.key}: ${typeof data.value === 'string' ? (data.value.length > 30 ? data.value.slice(0, 30) + '…' : data.value) : JSON.stringify(data.value)}` : 'Metadata updated',
      }
    case 'NewFeedback':
      return {
        from: data.client ? formatAddress(data.client as string) : '—',
        detail: [data.tag1 && `tag: ${data.tag1}`, data.tag2 && data.tag2].filter(Boolean).join(' · ') || 'Feedback submitted',
      }
    case 'FeedbackRevoked':
      return {
        from: data.client ? formatAddress(data.client as string) : '—',
        detail: `Feedback #${data.feedback_index ?? '?'} revoked`,
      }
    case 'URIUpdated':
      return { from: '—', detail: 'Agent URI updated' }
    case 'ResponseAppended':
      return { from: '—', detail: data.feedback_id ? `Response to feedback #${data.feedback_id}` : 'Response appended' }
    default:
      return { from: '—', detail: '' }
  }
}

type ActivityFilterType = 'all' | 'identity' | 'reputation' | 'verification'

function ItemActivitySection({ agentId }: { agentId: string }) {
  const [filter, setFilter] = useState<ActivityFilterType>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const { data, isLoading } = useAgentActivity(agentId, {
    event_type: filter === 'all' ? undefined : (filter as EventCategory),
    page,
    limit,
  })

  const activities = data?.activities ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const filterOptions: { value: ActivityFilterType; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'identity', label: 'IDENTITY' },
    { value: 'reputation', label: 'REPUTATION' },
    { value: 'verification', label: 'VERIFICATION' },
  ]

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Activity className="size-4 text-primary" />
        Item Activity
        {total > 0 && (
          <span className="text-xs font-normal text-muted-foreground">
            ({total})
          </span>
        )}
      </h3>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value)
              setPage(1)
            }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/60 text-muted-foreground hover:text-foreground border border-border/30',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity table */}
      {filter === 'verification' ? (
        <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <span className="text-2xl">🚧</span>
            <p className="text-sm font-medium text-foreground">Verification — Coming Soon</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Monad has not yet deployed the EIP-8004 verification contract.
              Verification events will appear here once the contract is live.
            </p>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-medium text-yellow-400">
              TBD
            </span>
          </div>
        </div>
      ) : (
      <>
      <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          <span className="w-6" />
          <span className="w-24">Event</span>
          <span className="flex-1">Details</span>
          <span className="w-24">From</span>
          <span className="w-20 text-right">Date</span>
          <span className="w-4">TX</span>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-border/10"
            >
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 flex-1 max-w-[200px]" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="size-3.5" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' ? 'No matching events' : 'No activity recorded yet'}
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const config = getActivityEventConfig(activity.event_type)
            const { from, detail } = getActivityEventDetails(activity)
            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/10 last:border-b-0"
              >
                <span className="text-sm shrink-0 w-6 text-center">
                  {config.icon}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] shrink-0 w-24 justify-center',
                    config.color,
                  )}
                >
                  {config.label}
                </Badge>
                <span className="flex-1 truncate text-xs text-muted-foreground">
                  {detail}
                </span>
                <span className="w-24 truncate font-mono text-xs text-muted-foreground">
                  {from}
                </span>
                <span className="w-20 text-right text-xs text-muted-foreground">
                  {formatDistanceToNowSmart(
                    new Date(activity.block_timestamp),
                    { addSuffix: true },
                  )}
                </span>
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
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Page {page}/{totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-border/30 px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-border/30 px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}

// ============================================================
// Make Offer Dialog
// ============================================================

function MakeOfferDialog({
  open,
  onOpenChange,
  listing,
  chainId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: { nft_contract: string; token_id: string; payment_token: string; chain_id: number }
  chainId: number
}) {
  const [offerAmount, setOfferAmount] = useState('')
  const { address } = useAccount()

  const marketplaceAddress = getMoltMarketplaceAddress(chainId)

  // Step 1: Approve ERC-20 (if needed)
  const {
    data: approveTxHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash })

  // Step 2: Make offer
  const {
    data: offerTxHash,
    writeContract: writeOffer,
    isPending: isOfferPending,
    error: offerError,
    reset: resetOffer,
  } = useWriteContract()

  const { isLoading: isOfferConfirming, isSuccess: isOfferConfirmed } =
    useWaitForTransactionReceipt({ hash: offerTxHash })

  // Auto-submit offer after approve confirms
  useEffect(() => {
    if (isApproveConfirmed && marketplaceAddress && offerAmount) {
      const amountWei = parsePriceToBigInt((parseFloat(offerAmount) * 1e18).toString())
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400) // 1 day

      writeOffer({
        address: marketplaceAddress,
        abi: moltMarketplaceAbi,
        functionName: 'makeOffer',
        args: [
          listing.nft_contract as `0x${string}`,
          BigInt(listing.token_id),
          listing.payment_token as `0x${string}`,
          amountWei,
          expiry,
        ],
      })
    }
  }, [isApproveConfirmed, marketplaceAddress, offerAmount, listing, writeOffer])

  // Toast on success/error
  useEffect(() => {
    if (isOfferConfirmed) {
      toast.success('Offer submitted!', {
        description: `Your offer of ${offerAmount} has been placed.`,
      })
      onOpenChange(false)
    }
  }, [isOfferConfirmed, offerAmount, onOpenChange])

  useEffect(() => {
    if (offerError) {
      toast.error('Offer failed', {
        description: offerError.message.slice(0, 100),
      })
    }
  }, [offerError])

  const handleSubmit = () => {
    if (!marketplaceAddress || !offerAmount || !address) return

    const amountWei = parsePriceToBigInt((parseFloat(offerAmount) * 1e18).toString())

    if (isNativeToken(listing.payment_token)) {
      // Native token offers not supported by contract
      toast.error('Offers must use ERC-20 tokens')
      return
    }

    // Approve first
    writeApprove({
      address: listing.payment_token as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [marketplaceAddress, amountWei],
    })
  }

  const isPending = isApprovePending || isApproveConfirming || isOfferPending || isOfferConfirming

  const handleClose = (open: boolean) => {
    if (!open) {
      resetApprove()
      resetOffer()
      setOfferAmount('')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Enter the amount you want to offer. Offers require ERC-20 token approval.
            Default expiry: 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Offer Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="pr-16"
                disabled={isPending}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {getTokenLabel(listing.payment_token)}
              </span>
            </div>
          </div>
          {isNativeToken(listing.payment_token) && (
            <p className="text-xs text-yellow-400">
              ⚠️ Offers must use ERC-20 tokens. Native token offers are not supported.
            </p>
          )}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {isApprovePending || isApproveConfirming
                ? 'Approving token...'
                : 'Submitting offer...'}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !offerAmount || parseFloat(offerAmount) <= 0 || isNativeToken(listing.payment_token)}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing…
              </>
            ) : (
              'Submit Offer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ chainId: string; listingId: string }>
}) {
  const { chainId: chainIdParam, listingId } = use(params)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)

  const chainId = parseInt(chainIdParam, 10)
  const id = `${chainIdParam}-${listingId}`

  // Wallet
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  // Fetch listing (includes embedded agent data)
  const { data: listingRaw, isLoading: listingLoading, error: listingError } = useListing(id)

  // Extract embedded agent from listing response
  const listing = listingRaw
  const agent = (listingRaw as Record<string, unknown> | undefined)?.agent as AgentDetail | undefined
  const agentLoading = listingLoading
  const agentId = listing ? `${listing.chain_id}-${listing.token_id}` : ''

  // Fetch offers
  const { data: offersData, isLoading: offersLoading } = useOffers(
    listing
      ? {
          chain_id: listing.chain_id,
          nft_contract: listing.nft_contract,
          token_id: listing.token_id,
          status: 'Active',
        }
      : undefined,
  )

  const offers = offersData?.offers ?? []
  const topOffer = offers.length > 0
    ? offers.reduce((max, o) => (parseFloat(o.amount) > parseFloat(max.amount) ? o : max), offers[0])
    : null

  // Contract: Buy Now
  const marketplaceAddress = getMoltMarketplaceAddress(chainId)
  const {
    data: buyTxHash,
    writeContract: writeBuy,
    isPending: isBuyPending,
    error: buyError,
    reset: resetBuy,
  } = useWriteContract()

  const { isLoading: isBuyConfirming, isSuccess: isBuyConfirmed } =
    useWaitForTransactionReceipt({ hash: buyTxHash })

  // Is current user the seller?
  const isSeller = isConnected && address && listing
    ? address.toLowerCase() === listing.seller.toLowerCase()
    : false

  // Buy handler
  const handleBuy = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    if (!listing || !marketplaceAddress) return
    if (isSeller) {
      toast.error('You cannot buy your own listing')
      return
    }

    const priceBigInt = parsePriceToBigInt(listing.price)

    writeBuy({
      address: marketplaceAddress,
      abi: moltMarketplaceAbi,
      functionName: 'buy',
      args: [BigInt(listing.listing_id)],
      value: isNativeToken(listing.payment_token) ? priceBigInt : undefined,
    })
  }

  // Handle offer button
  const handleMakeOffer = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    setOfferDialogOpen(true)
  }

  // Toast on buy result
  useEffect(() => {
    if (isBuyConfirmed) {
      toast.success('Purchase successful! 🎉', {
        description: 'The agent identity has been transferred to your wallet.',
      })
    }
  }, [isBuyConfirmed])

  useEffect(() => {
    if (buyError) {
      toast.error('Purchase failed', {
        description: buyError.message.slice(0, 100),
      })
    }
  }, [buyError])

  if (listingError && !listingLoading) {
    return <ErrorState id={id} />
  }

  const isActive = listing?.status === 'Active'
  const isExpired = listing ? listing.expiry > 0 && listing.expiry * 1000 < Date.now() : false
  const isBuying = isBuyPending || isBuyConfirming

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/trade/marketplace">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Button>
      </Link>

      {/* Main two-column layout: Left = HoloCard only, Right = everything else */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        {/* ====================== LEFT COLUMN — HoloCard only ====================== */}
        <div className="flex justify-center lg:sticky lg:top-8 lg:self-start lg:justify-start">
          {listing ? (
            <HoloCard
              image={agent?.image ?? listing.agent_image}
              name={listing.agent_name || agent?.name || `Agent #${listing.token_id}`}
              description={agent?.description ?? null}
              score={agent?.reputation_score ?? null}
              feedbackCount={agent?.feedback_count ?? 0}
              chainId={listing.chain_id}
              owner={listing.seller}
              agent={agent ?? undefined}
            />
          ) : (
            <div className="w-full max-w-[300px] min-h-[320px] rounded-2xl border border-border/50 bg-card/95 overflow-hidden">
              {/* Image area — matches HoloCard h-40 */}
              <Skeleton className="h-40 w-full rounded-none" />
              {/* Content — matches HoloCard: score + stars + tags + chain */}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex justify-center">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====================== RIGHT COLUMN — everything ====================== */}
        <div className="space-y-6">
          {/* Header: Collection label + Agent Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                MOLT MARKETPLACE
              </span>
              {listing ? (
                <>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      listing.chain_id === 143
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
                    )}
                  >
                    {getChainShortLabel(listing.chain_id)}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[10px]', getStatusColor(listing.status))}>
                    {listing.status}
                  </Badge>
                </>
              ) : (
                <>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </>
              )}
            </div>

            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {listing ? (
                <>
                  {listing.agent_name || agent?.name || `Agent #${listing.token_id}`}
                  <span className="text-lg text-muted-foreground font-normal"> #{listing.token_id}</span>
                </>
              ) : (
                <Skeleton className="inline-block h-8 w-64" />
              )}
            </h1>

            {listing ? (
              agent?.description && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  {agent.description}
                </p>
              )
            ) : (
              <Skeleton className="h-4 w-96" />
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {listing ? (
                <>
                  {agent?.x402_support && (
                    <Badge variant="outline" className="gap-1 text-xs border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                      <Shield className="size-3" />
                      x402 Enabled
                    </Badge>
                  )}
                  {agent?.active && (
                    <Badge variant="outline" className="gap-1 text-xs border-green-500/30 bg-green-500/10 text-green-400">
                      <Zap className="size-3" />
                      Active
                    </Badge>
                  )}
                  {agent?.categories?.map((cat) => (
                    <Badge key={cat} variant="outline" className="gap-1 text-xs border-primary/30 bg-primary/10 text-primary">
                      <Tag className="size-3" />
                      {cat}
                    </Badge>
                  ))}
                </>
              ) : (
                <>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </>
              )}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {listing ? (
                <>
                  <span>Listed by</span>
                  <a
                    href={getExplorerUrl(listing.chain_id, listing.seller)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-mono text-primary/80 hover:text-primary transition-colors"
                  >
                    {formatAddress(listing.seller)}
                    <ExternalLink className="size-2.5" />
                  </a>
                  <span className="text-muted-foreground/50">·</span>
                  <TimeCounter targetTime={new Date(listing.block_timestamp)} />
                </>
              ) : (
                <>
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </>
              )}
            </div>
          </div>

          {/* Price Box + CTA */}
          <Card className="border-border/50 bg-card/80 p-6 space-y-4">
            {listing ? (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {listing.expiry > 0 ? (
                    isExpired ? (
                      <span className="text-red-400">Listing expired</span>
                    ) : (
                      <span>
                        Expires <TimeCounter targetTime={new Date(listing.expiry * 1000)} />
                      </span>
                    )
                  ) : (
                    <span>No expiration</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {formatPrice(listing.price)}
                    </span>
                    <span className="text-lg text-muted-foreground">{getTokenLabel(listing.payment_token)}</span>
                  </div>
                </div>
                {isActive && !isExpired && (
                  <div className="flex gap-3 pt-2">
                    {!isConnected ? (
                      <Button size="lg" className="flex-1 gap-2 text-base font-semibold" onClick={openConnectModal}>
                        <Wallet className="size-5" />
                        Connect Wallet to Buy
                      </Button>
                    ) : isSeller ? (
                      <Button size="lg" className="flex-1 gap-2 text-base font-semibold" disabled>
                        <ShoppingCart className="size-5" />
                        Your Listing
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="lg"
                          className="flex-1 gap-2 text-base font-semibold"
                          onClick={handleBuy}
                          disabled={isBuying}
                        >
                          {isBuying ? (
                            <>
                              <Loader2 className="size-5 animate-spin" />
                              {isBuyPending ? 'Confirm in Wallet…' : 'Confirming…'}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="size-5" />
                              Buy Now
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="flex-1 gap-2 text-base font-semibold border-border/50"
                          onClick={handleMakeOffer}
                        >
                          <HandCoins className="size-5" />
                          Make Offer
                        </Button>
                      </>
                    )}
                  </div>
                )}
                {listing.status === 'Sold' && listing.sold_price && (
                  <div className="flex flex-col gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                    <p className="text-xs text-blue-400">Sold for</p>
                    <p className="text-lg font-bold text-blue-400">
                      {formatPrice(listing.sold_price)} {getTokenLabel(listing.payment_token)}
                    </p>
                    {listing.buyer && (
                      <p className="text-xs text-muted-foreground">
                        to <span className="font-mono">{formatAddress(listing.buyer)}</span>
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-48" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-11 flex-1 rounded-lg" />
                  <Skeleton className="h-11 flex-1 rounded-lg" />
                </div>
              </>
            )}
          </Card>

          {/* Price Info Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {listing ? (
              <>
                <PriceInfoCard
                  label="Price"
                  value={`${formatPrice(listing.price)} ${getTokenLabel(listing.payment_token)}`}
                  icon={<DollarSign className="size-3" />}
                />
                <PriceInfoCard
                  label="Last Sale"
                  value={listing.sold_price ? `${formatPrice(listing.sold_price)} ${getTokenLabel(listing.payment_token)}` : '—'}
                  icon={<TrendingUp className="size-3" />}
                />
                <PriceInfoCard
                  label="Owner"
                  value={formatAddress(listing.seller)}
                  icon={<User className="size-3" />}
                />
                <PriceInfoCard
                  label="Top Offer"
                  value={topOffer ? `${formatPrice(topOffer.amount)} ${getTokenLabel(topOffer.payment_token)}` : '—'}
                  icon={<HandCoins className="size-3" />}
                />
              </>
            ) : (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/30 bg-card/40 p-3 text-center space-y-1">
                  <Skeleton className="mx-auto h-3 w-12" />
                  <Skeleton className="mx-auto h-5 w-20" />
                </div>
              ))
            )}
          </div>

          {/* Listing Details */}
          {listing ? (
            <ListingDetailsSection listing={listing} />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="rounded-xl border border-border/30 bg-card/40 divide-y divide-border/20">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Properties (right column = wider, no truncate) */}
          {agentLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          ) : agent ? (
            <AgentPropertiesGrid agent={agent} />
          ) : null}

          {/* Endpoints */}
          {agent && <EndpointsSection agent={agent} />}

          {/* Reputation */}
          {agent && (
            <ReputationBadge score={agent.reputation_score} feedbackCount={agent.feedback_count} />
          )}

          {/* Top Offers */}
          {listing ? (
            <TopOffersTable
              offers={offers}
              listingPrice={listing.price}
              isLoading={offersLoading}
            />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Item Activity */}
          {agentId && <ItemActivitySection agentId={agentId} />}

          {/* Provenance */}
          {listing && (
            <ProvenanceSection
              chainId={listing.chain_id}
              nftContract={listing.nft_contract}
              tokenId={listing.token_id}
              txHash={listing.tx_hash}
            />
          )}
        </div>
      </div>

      {/* Make Offer Dialog */}
      {listing && (
        <MakeOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          listing={listing}
          chainId={chainId}
        />
      )}
    </div>
  )
}
