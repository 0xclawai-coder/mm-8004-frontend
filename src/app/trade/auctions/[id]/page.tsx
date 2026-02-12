'use client'

import { use, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Gavel,
  Clock,
  Trophy,
  Tag,
  Shield,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Hash,
  Layers,
  CircleDot,
  Globe,
  Star,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn, formatAddress, formatPrice, getTokenLabel, formatDistanceToNowSmart } from '@/lib/utils'
import { useAuctionDetail } from '@/hooks/useAuctionDetail'
import { useAgent } from '@/hooks/useAgent'
import type { AuctionBid, MarketplaceAuction } from '@/types'

// ============================================================
// Helpers
// ============================================================

function getExplorerUrl(chainId: number, hash: string, type: 'address' | 'tx' = 'address'): string {
  const base = chainId === 143 ? 'https://monadexplorer.com' : 'https://testnet.monadexplorer.com'
  return `${base}/${type}/${hash}`
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

function getAuctionStatus(auction: MarketplaceAuction): 'upcoming' | 'live' | 'ended' {
  const now = Math.floor(Date.now() / 1000)
  if (now < auction.start_time) return 'upcoming'
  if (now >= auction.end_time) return 'ended'
  return 'live'
}

function useCountdown(endTime: number) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const diff = Math.max(0, endTime - now)
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60

  return { days, hours, minutes, seconds, isEnded: diff <= 0 }
}

// ============================================================
// Sub-components
// ============================================================

function StatusBadge({ status }: { status: 'upcoming' | 'live' | 'ended' }) {
  const config = {
    upcoming: { label: 'Upcoming', className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400', icon: <Clock className="size-3" /> },
    live: { label: 'Live', className: 'border-green-500/30 bg-green-500/10 text-green-400', icon: <Zap className="size-3" /> },
    ended: { label: 'Ended', className: 'border-red-500/30 bg-red-500/10 text-red-400', icon: <Gavel className="size-3" /> },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs', c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  )
}

function CountdownDisplay({ endTime, startTime }: { endTime: number; startTime: number }) {
  const now = Math.floor(Date.now() / 1000)
  const targetTime = now < startTime ? startTime : endTime
  const label = now < startTime ? 'Starts In' : 'Ends In'
  const { days, hours, minutes, seconds, isEnded } = useCountdown(targetTime)

  if (isEnded && now >= startTime) {
    return (
      <div>
        <p className="text-xs text-muted-foreground mb-1">Auction Ended</p>
        <p className="text-lg font-bold text-red-400">Finished</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-1">
        {days > 0 && (
          <div className="rounded-md bg-muted/50 px-2 py-1 text-center">
            <span className="text-lg font-bold tabular-nums text-foreground">{days}</span>
            <span className="text-[10px] text-muted-foreground ml-0.5">d</span>
          </div>
        )}
        <div className="rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(hours).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground ml-0.5">h</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(minutes).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground ml-0.5">m</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(seconds).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground ml-0.5">s</span>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
    </button>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  )
}

function ReservePriceIndicator({ auction, token }: { auction: MarketplaceAuction; token: string }) {
  const reservePrice = parseFloat(auction.reserve_price)
  if (reservePrice <= 0) return null

  const highestBid = parseFloat(auction.highest_bid ?? '0')
  const met = highestBid >= reservePrice

  return (
    <div className={cn(
      'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
      met ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
    )}>
      {met ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
      {met ? 'Reserve met' : 'Reserve not met'} — {formatPrice(auction.reserve_price)} {token}
    </div>
  )
}

// ============================================================
// Bid History
// ============================================================

function BidHistoryTable({ bids, chainId, token }: { bids: AuctionBid[]; chainId: number; token: string }) {
  const sorted = useMemo(() => [...bids].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount)), [bids])

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center">
        <Gavel className="mx-auto mb-2 size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No bids yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Be the first to place a bid!</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30">
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
            <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bidder</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Tx</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {sorted.map((bid, i) => (
            <tr key={bid.id} className="hover:bg-muted/20 transition-colors">
              <td className="py-2.5 text-xs text-muted-foreground">
                {i === 0 && <Trophy className="inline size-3.5 text-yellow-400" />}
                {i > 0 && <span>{i + 1}</span>}
              </td>
              <td className="py-2.5">
                <a
                  href={getExplorerUrl(chainId, bid.bidder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
                >
                  {formatAddress(bid.bidder)}
                </a>
              </td>
              <td className="py-2.5 text-right">
                <span className="font-semibold text-foreground">{formatPrice(bid.amount)}</span>
                <span className="ml-1 text-xs text-muted-foreground">{token}</span>
              </td>
              <td className="py-2.5 text-right text-xs text-muted-foreground">
                {formatDistanceToNowSmart(new Date(bid.block_timestamp), { addSuffix: true })}
              </td>
              <td className="py-2.5 text-right">
                <a
                  href={getExplorerUrl(chainId, bid.tx_hash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="inline size-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Agent Properties Panel (left column, below image)
// ============================================================

function AgentPropertiesPanel({ agentId, chainId }: { agentId: string; chainId: number }) {
  const { data: agent, isLoading } = useAgent(agentId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!agent) return null

  return (
    <div className="space-y-4">
      {/* EIP-8004 Properties */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Agent Properties
        </h3>
        <div className="divide-y divide-border/30">
          <InfoRow label="Agent ID">
            <div className="flex items-center gap-1.5">
              <Hash className="size-3 text-muted-foreground" />
              <span className="font-mono text-sm text-foreground">{agent.agent_id}</span>
            </div>
          </InfoRow>
          <InfoRow label="Chain">
            <Badge variant="outline" className={cn(
              'text-[10px]',
              chainId === 143 ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            )}>
              {getChainLabel(chainId)}
            </Badge>
          </InfoRow>
          <InfoRow label="Owner">
            <div className="flex items-center gap-1.5">
              <a
                href={getExplorerUrl(chainId, agent.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
              >
                {formatAddress(agent.owner)}
                <ExternalLink className="ml-1 inline size-2.5" />
              </a>
              <CopyButton value={agent.owner} />
            </div>
          </InfoRow>
          <InfoRow label="x402">
            {agent.x402_support ? (
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] gap-1">
                <Shield className="size-2.5" />
                Supported
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No</span>
            )}
          </InfoRow>
          <InfoRow label="Status">
            <div className="flex items-center gap-1.5">
              <CircleDot className={cn('size-3', agent.active ? 'text-green-400' : 'text-red-400')} />
              <span className={cn('text-xs font-medium', agent.active ? 'text-green-400' : 'text-red-400')}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </InfoRow>
          {agent.reputation_score !== null && (
            <InfoRow label="Reputation">
              <div className="flex items-center gap-1.5">
                <Star className={cn('size-3.5', (agent.reputation_score ?? 0) >= 70 ? 'text-green-400' : (agent.reputation_score ?? 0) >= 40 ? 'text-yellow-400' : 'text-red-400')} />
                <span className="text-sm font-semibold text-foreground">{(agent.reputation_score ?? 0).toFixed(1)}</span>
              </div>
            </InfoRow>
          )}
          {agent.categories && agent.categories.length > 0 && (
            <InfoRow label="Categories">
              <div className="flex flex-wrap justify-end gap-1">
                {agent.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {cat}
                  </Badge>
                ))}
              </div>
            </InfoRow>
          )}
        </div>
      </div>

      {/* Endpoints */}
      {agent.metadata?.endpoints && agent.metadata.endpoints.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            Endpoints
          </h3>
          <div className="space-y-2">
            {agent.metadata.endpoints.map((ep, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <Badge variant="outline" className="text-[10px] shrink-0">{ep.protocol}</Badge>
                <a
                  href={ep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-mono text-primary/80 hover:text-primary transition-colors"
                >
                  {ep.url}
                  <ExternalLink className="ml-1 inline size-2.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance */}
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          📋 Provenance
        </h3>
        <div className="divide-y divide-border/30">
          <InfoRow label="Chain">
            <span className="text-xs text-foreground/80">{getChainLabel(chainId)}</span>
          </InfoRow>
          <InfoRow label="Standard">
            <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">EIP-8004</Badge>
          </InfoRow>
          <InfoRow label="Contract">
            <div className="flex items-center gap-1.5">
              <a
                href={getExplorerUrl(chainId, agent.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
              >
                {formatAddress(agent.owner)}
              </a>
            </div>
          </InfoRow>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Loading Skeleton
// ============================================================

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-9 w-36 rounded-lg" />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-16 w-32" />
              <Skeleton className="h-16 w-40" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
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
      <Link href="/trade/auctions">
        <Button variant="ghost" size="sm" className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Auctions
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <Gavel className="mx-auto mb-4 size-12 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold text-foreground">Auction Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not find auction &quot;{id}&quot;.
          </p>
          <Link href="/trade/auctions">
            <Button variant="default" size="sm" className="mt-6">
              Browse All Auctions
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Main Page
// ============================================================

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [bidAmount, setBidAmount] = useState('')

  // Parse id format: "{chainId}-{auctionId}" e.g. "143-5"
  const parts = id.split('-')
  const chainId = parts.length >= 2 ? parseInt(parts[0], 10) : 0
  const tokenIdPart = parts.length >= 2 ? parts.slice(1).join('-') : id

  const { data, isLoading, error } = useAuctionDetail(id)
  const auction = data?.auction
  const bids = data?.bids ?? []

  // Build agent ID for useAgent hook: "{chainId}-{tokenId}"
  const agentId = auction ? `${auction.chain_id}-${auction.token_id}` : ''

  if (isLoading) return <LoadingSkeleton />
  if (error || !auction) return <ErrorState id={id} />

  const status = getAuctionStatus(auction)
  const token = getTokenLabel(auction.payment_token)
  const hasBids = auction.highest_bid !== null && parseFloat(auction.highest_bid) > 0
  const hasReserve = parseFloat(auction.reserve_price) > 0
  const hasBuyNow = parseFloat(auction.buy_now_price) > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link href="/trade/auctions">
        <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Auctions
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">MOLT MARKETPLACE</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {auction.agent_name || `Agent #${auction.token_id}`}
          </h1>
          <StatusBadge status={status} />
          <Badge variant="outline" className={cn(
            'text-xs',
            chainId === 143
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          )}>
            {getChainLabel(chainId)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sold by{' '}
          <a
            href={getExplorerUrl(chainId, auction.seller)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-primary/80 hover:text-primary transition-colors"
          >
            {formatAddress(auction.seller)}
            <ExternalLink className="ml-1 inline size-2.5" />
          </a>
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
        {/* ============ LEFT COLUMN ============ */}
        <div className="space-y-4">
          {/* Agent Image */}
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
            <div className="relative aspect-square bg-gradient-to-br from-primary/20 via-card to-cyan-accent/10">
              {auction.agent_image ? (
                <img
                  src={auction.agent_image}
                  alt={auction.agent_name ?? `Agent #${auction.token_id}`}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <span className="text-6xl font-bold text-primary/30">
                    #{auction.token_id}
                  </span>
                </div>
              )}

              {/* Status overlay */}
              <div className="absolute top-3 left-3">
                <StatusBadge status={status} />
              </div>

              {hasBuyNow && status === 'live' && (
                <Badge
                  variant="outline"
                  className="absolute top-3 right-3 border-primary/30 bg-card/80 text-xs text-primary backdrop-blur-sm"
                >
                  Buy Now {formatPrice(auction.buy_now_price)} {token}
                </Badge>
              )}
            </div>
          </div>

          {/* Agent Properties (EIP-8004 data) */}
          <AgentPropertiesPanel agentId={agentId} chainId={chainId} />
        </div>

        {/* ============ RIGHT COLUMN ============ */}
        <div className="space-y-6">
          {/* Main auction info card */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-5">
            {/* Bid + Countdown row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              {/* Current / Starting Bid */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {hasBids ? 'Current Bid' : 'Starting Bid'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPrice(hasBids ? auction.highest_bid! : auction.start_price)}
                  </span>
                  <span className="text-lg text-muted-foreground">{token}</span>
                </div>
                {hasBids && auction.highest_bidder && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    by{' '}
                    <a
                      href={getExplorerUrl(chainId, auction.highest_bidder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary/80 hover:text-primary"
                    >
                      {formatAddress(auction.highest_bidder)}
                    </a>
                  </p>
                )}
              </div>

              {/* Countdown */}
              <CountdownDisplay endTime={auction.end_time} startTime={auction.start_time} />
            </div>

            {/* Reserve price indicator */}
            {hasReserve && <ReservePriceIndicator auction={auction} token={token} />}

            {/* Place Bid */}
            {status === 'live' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder={`Min bid: ${formatPrice(hasBids ? auction.highest_bid! : auction.start_price)} ${token}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="pr-14 bg-muted/30 border-border/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{token}</span>
                  </div>
                  <Button className="gap-2 px-6">
                    <Gavel className="size-4" />
                    Place Bid
                  </Button>
                </div>
                {hasBuyNow && (
                  <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
                    <ShoppingCart className="size-4" />
                    Buy Now for {formatPrice(auction.buy_now_price)} {token}
                  </Button>
                )}
              </div>
            )}

            {status === 'ended' && auction.winner && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 flex items-center gap-3">
                <Trophy className="size-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-foreground">Auction Won</p>
                  <p className="text-xs text-muted-foreground">
                    Winner:{' '}
                    <a
                      href={getExplorerUrl(chainId, auction.winner)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary/80 hover:text-primary"
                    >
                      {formatAddress(auction.winner)}
                    </a>
                    {auction.settled_price && (
                      <> — Settled at {formatPrice(auction.settled_price)} {token}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {status === 'upcoming' && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
                <Clock className="mx-auto mb-2 size-5 text-yellow-400" />
                <p className="text-sm font-medium text-foreground">Auction Not Started</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Starts {new Date(auction.start_time * 1000).toLocaleString()}
                </p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start Bid</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{formatPrice(auction.start_price)}</p>
                <p className="text-[10px] text-muted-foreground">{token}</p>
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reserve</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {hasReserve ? formatPrice(auction.reserve_price) : '—'}
                </p>
                {hasReserve && <p className="text-[10px] text-muted-foreground">{token}</p>}
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buy Now</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {hasBuyNow ? formatPrice(auction.buy_now_price) : '—'}
                </p>
                {hasBuyNow && <p className="text-[10px] text-muted-foreground">{token}</p>}
              </div>
              <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bids</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{auction.bid_count ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
            </div>
          </div>

          {/* Bid History */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              📜 Bid History
              {bids.length > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {bids.length}
                </span>
              )}
            </h3>
            <BidHistoryTable bids={bids} chainId={chainId} token={token} />
          </div>

          {/* Item Activity */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              ⚡ Item Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">From</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {/* Auction creation event */}
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5">
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 bg-blue-500/10 text-blue-400">
                        Created
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right text-xs text-foreground">
                      {formatPrice(auction.start_price)} {token}
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={getExplorerUrl(chainId, auction.seller)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-primary/80 hover:text-primary"
                      >
                        {formatAddress(auction.seller)}
                      </a>
                    </td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground">
                      {formatDistanceToNowSmart(new Date(auction.block_timestamp), { addSuffix: true })}
                    </td>
                  </tr>

                  {/* Bid events */}
                  {[...bids].sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()).map((bid) => (
                    <tr key={`activity-${bid.id}`} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-[10px] border-green-500/30 bg-green-500/10 text-green-400">
                          Bid
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-xs text-foreground">
                        {formatPrice(bid.amount)} {token}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={getExplorerUrl(chainId, bid.bidder)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary/80 hover:text-primary"
                        >
                          {formatAddress(bid.bidder)}
                        </a>
                      </td>
                      <td className="py-2.5 text-right text-xs text-muted-foreground">
                        {formatDistanceToNowSmart(new Date(bid.block_timestamp), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}

                  {/* Settled event */}
                  {status === 'ended' && auction.winner && (
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-[10px] border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                          Settled
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right text-xs text-foreground">
                        {auction.settled_price ? `${formatPrice(auction.settled_price)} ${token}` : '—'}
                      </td>
                      <td className="py-2.5 text-right">
                        <a
                          href={getExplorerUrl(chainId, auction.winner)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-primary/80 hover:text-primary"
                        >
                          {formatAddress(auction.winner)}
                        </a>
                      </td>
                      <td className="py-2.5 text-right text-xs text-muted-foreground">
                        {formatDistanceToNowSmart(new Date(auction.updated_at), { addSuffix: true })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {bids.length === 0 && status !== 'ended' && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
