'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Shield,
  Zap,
  Star,
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
  Cpu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn, formatAddress, formatPrice, getTokenLabel } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { useListing } from '@/hooks/useListing'
import { useAgent } from '@/hooks/useAgent'
import { useOffers } from '@/hooks/useOffers'
import type { AgentDetail, MarketplaceOffer } from '@/types'

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
// Loading Skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-9 w-44 rounded-lg" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: Image */}
        <div>
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-24 rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-40 rounded-xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Error State
// ============================================================

function ErrorState({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/trade/marketplace">
        <Button variant="ghost" size="sm" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <h2 className="text-xl font-semibold text-foreground">Listing Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not find listing &quot;{id}&quot;.
          </p>
          <Link href="/trade/marketplace">
            <Button variant="default" size="sm" className="mt-6">
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
// Agent Properties Grid
// ============================================================

function PropertyCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/40 p-3 space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      {sub && <p className="text-[10px] text-primary/70">{sub}</p>}
    </div>
  )
}

function AgentPropertiesGrid({ agent }: { agent: AgentDetail }) {
  const properties: { label: string; value: string; sub?: string }[] = []

  // Categories
  if (agent.categories && agent.categories.length > 0) {
    agent.categories.forEach((cat) => {
      properties.push({ label: 'Category', value: cat })
    })
  }

  // x402 support
  properties.push({
    label: 'x402 Payment',
    value: agent.x402_support ? 'Supported' : 'Not Supported',
    sub: agent.x402_support ? 'Pay-per-use enabled' : undefined,
  })

  // Reputation
  properties.push({
    label: 'Reputation',
    value: agent.reputation_score !== null ? `${agent.reputation_score.toFixed(1)} / 100` : 'Unrated',
    sub: `${agent.feedback_count} feedback${agent.feedback_count !== 1 ? 's' : ''}`,
  })

  // Status
  properties.push({
    label: 'Status',
    value: agent.active ? 'Active' : 'Inactive',
  })

  // Capabilities
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            <span className="font-mono text-xs text-muted-foreground truncate flex-1">
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
              className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
            >
              {formatAddress(nftContract)}
              <ExternalLink className="ml-1 inline size-2.5" />
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
              className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
            >
              {formatAddress(txHash)}
              <ExternalLink className="ml-1 inline size-2.5" />
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
  paymentToken,
  isLoading,
}: {
  offers: MarketplaceOffer[]
  listingPrice: string
  paymentToken: string
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
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No offers yet</p>
          </div>
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
// Item Activity (uses agent activity endpoint)
// ============================================================

function ItemActivitySection({ agentId }: { agentId: string }) {
  const [filter, setFilter] = useState('all')

  const filters = ['all', 'list', 'sale', 'offer', 'transfer', 'price_change']

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Activity className="size-4 text-primary" />
        Item Activity
      </h3>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/60 text-muted-foreground hover:text-foreground border border-border/30',
            )}
          >
            {f === 'all' ? 'ALL' : f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Activity placeholder — in a real app this would fetch from the activity endpoint */}
      <div className="rounded-xl border border-border/30 bg-card/40 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border/20 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          <span className="w-24">Event</span>
          <span className="flex-1">Price</span>
          <span className="w-28">From</span>
          <span className="w-28 text-right">Date</span>
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">Activity data coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Agent ID: {agentId}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  // Parse id format: "{chainId}-{listingId}"
  const parts = id.split('-')
  const chainId = parts.length >= 2 ? parseInt(parts[0], 10) : 0
  const listingId = parts.length >= 2 ? parts.slice(1).join('-') : id

  // Fetch listing
  const { data: listing, isLoading: listingLoading, error: listingError } = useListing(id)

  // Fetch agent data (using chainId-tokenId)
  const agentId = listing ? `${listing.chain_id}-${listing.token_id}` : ''
  const { data: agent, isLoading: agentLoading } = useAgent(agentId)

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

  if (listingLoading) {
    return <LoadingSkeleton />
  }

  if (listingError || !listing) {
    return <ErrorState id={id} />
  }

  const isActive = listing.status === 'Active'
  const isExpired = listing.expiry > 0 && listing.expiry * 1000 < Date.now()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/trade/marketplace">
        <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Marketplace
        </Button>
      </Link>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* ====================== LEFT COLUMN ====================== */}
        <div className="space-y-6">
          {/* Agent Image */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/60">
            {listing.agent_image || agent?.image ? (
              <img
                src={(agent?.image ?? listing.agent_image) || undefined}
                alt={listing.agent_name ?? `Agent #${listing.token_id}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/20">
                <Cpu className="size-24 text-primary/30" />
              </div>
            )}
          </div>

          {/* Agent Properties */}
          {agentLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

          {/* Provenance */}
          <ProvenanceSection
            chainId={listing.chain_id}
            nftContract={listing.nft_contract}
            tokenId={listing.token_id}
            txHash={listing.tx_hash}
          />
        </div>

        {/* ====================== RIGHT COLUMN ====================== */}
        <div className="space-y-6">
          {/* Header: Collection label + Agent Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                MOLT MARKETPLACE
              </span>
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
            </div>

            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {listing.agent_name || agent?.name || `Agent #${listing.token_id}`}
              <span className="ml-2 text-lg text-muted-foreground font-normal">#{listing.token_id}</span>
            </h1>

            {/* Description */}
            {agent?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {agent.description}
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
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
                <Badge key={cat} variant="outline" className="text-xs border-primary/30 bg-primary/10 text-primary">
                  <Tag className="size-3 mr-1" />
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Seller */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Listed by</span>
              <a
                href={getExplorerUrl(listing.chain_id, listing.seller)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary/80 hover:text-primary transition-colors"
              >
                {formatAddress(listing.seller)}
                <ExternalLink className="ml-0.5 inline size-2.5" />
              </a>
              <span className="text-muted-foreground/50">·</span>
              <TimeCounter targetTime={new Date(listing.block_timestamp)} />
            </div>
          </div>

          {/* Price Box */}
          <Card className="border-border/50 bg-card/80 p-6 space-y-4">
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
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-lg text-muted-foreground">{getTokenLabel(listing.payment_token)}</span>
              </div>
            </div>
            {isActive && !isExpired && (
              <div className="flex gap-3 pt-2">
                <Button size="lg" className="flex-1 gap-2 text-base font-semibold">
                  <ShoppingCart className="size-5" />
                  Buy Now
                </Button>
                <Button size="lg" variant="outline" className="flex-1 gap-2 text-base font-semibold border-border/50">
                  <HandCoins className="size-5" />
                  Make Offer
                </Button>
              </div>
            )}
            {listing.status === 'Sold' && listing.sold_price && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                <p className="text-xs text-blue-400">Sold for</p>
                <p className="text-lg font-bold text-blue-400">
                  {formatPrice(listing.sold_price)} {getTokenLabel(listing.payment_token)}
                </p>
                {listing.buyer && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    to <span className="font-mono">{formatAddress(listing.buyer)}</span>
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Price Info Bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          </div>

          {/* Reputation */}
          {agent && (
            <ReputationBadge score={agent.reputation_score} feedbackCount={agent.feedback_count} />
          )}

          {/* Top Offers */}
          <TopOffersTable
            offers={offers}
            listingPrice={listing.price}
            paymentToken={listing.payment_token}
            isLoading={offersLoading}
          />

          {/* Item Activity */}
          <ItemActivitySection agentId={agentId} />
        </div>
      </div>
    </div>
  )
}
