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
  Loader2,
  Wallet,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { cn, formatAddress, formatPrice, getTokenLabel, formatDistanceToNowSmart } from '@/lib/utils'
import { useAuctionDetail } from '@/hooks/useAuctionDetail'
import { HoloCard } from '@/components/agents/HoloCard'
import {
  NATIVE_TOKEN,
  moltMarketplaceAbi,
  parsePriceToBigInt,
  getMoltMarketplaceAddress,
} from '@/lib/contracts'
import type { AuctionBid, MarketplaceAuction, AgentDetail } from '@/types'

import { getChainFullLabel as getChainLabel, getExplorerUrl as getExplorerUrlBase } from '@/lib/chain-utils'

// ============================================================
// Helpers
// ============================================================

function getExplorerUrl(chainId: number, hash: string, type: 'address' | 'tx' = 'address'): string {
  return getExplorerUrlBase(chainId, type, hash)
}

function getAuctionStatus(auction: MarketplaceAuction): 'upcoming' | 'live' | 'ended' {
  const now = Math.floor(Date.now() / 1000)
  if (now < auction.start_time) return 'upcoming'
  if (now >= auction.end_time) return 'ended'
  return 'live'
}

function isNativeToken(token: string): boolean {
  return token.toLowerCase() === NATIVE_TOKEN.toLowerCase()
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
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Auction Ended</p>
        <p className="text-lg font-bold text-red-400">Finished</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        {days > 0 && (
          <div className="flex items-baseline gap-0.5 rounded-md bg-muted/50 px-2 py-1 text-center">
            <span className="text-lg font-bold tabular-nums text-foreground">{days}</span>
            <span className="text-[10px] text-muted-foreground">d</span>
          </div>
        )}
        <div className="flex items-baseline gap-0.5 rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(hours).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground">h</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="flex items-baseline gap-0.5 rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(minutes).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground">m</span>
        </div>
        <span className="text-muted-foreground font-bold">:</span>
        <div className="flex items-baseline gap-0.5 rounded-md bg-muted/50 px-2 py-1 text-center">
          <span className="text-lg font-bold tabular-nums text-foreground">{String(seconds).padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground">s</span>
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
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Gavel className="size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No bids yet</p>
        <p className="text-xs text-muted-foreground/60">Be the first to place a bid!</p>
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
                <span className="inline-flex items-baseline gap-1">
                  <span className="font-semibold text-foreground">{formatPrice(bid.amount)}</span>
                  <span className="text-xs text-muted-foreground">{token}</span>
                </span>
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
// Agent Properties Panel (right column — no truncate)
// ============================================================

function AgentPropertiesSection({ agent, chainId }: { agent: AgentDetail; chainId: number }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Layers className="size-4 text-primary" />
        Agent Properties
      </h3>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
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
                className="inline-flex items-center gap-1 font-mono text-xs text-primary/80 hover:text-primary transition-colors"
              >
                {formatAddress(agent.owner)}
                <ExternalLink className="size-2.5" />
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
    </div>
  )
}

// ============================================================
// Endpoints Section
// ============================================================

function EndpointsSection({ agent, chainId }: { agent: AgentDetail; chainId: number }) {
  if (!agent.metadata?.endpoints || agent.metadata.endpoints.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Globe className="size-4 text-primary" />
        Endpoints
      </h3>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-2">
        {agent.metadata.endpoints.map((ep, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Badge variant="outline" className={cn(
              'text-[10px] shrink-0',
              ep.protocol === 'x402'
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                : 'border-primary/30 bg-primary/10 text-primary',
            )}>
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

function ProvenanceSection({ agent, chainId }: { agent: AgentDetail; chainId: number }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        📋 Provenance
      </h3>
      <div className="rounded-xl border border-border/50 bg-card/60 p-4">
        <div className="divide-y divide-border/30">
          <InfoRow label="Chain">
            <span className="text-xs text-foreground/80">{getChainLabel(chainId)}</span>
          </InfoRow>
          <InfoRow label="Standard">
            <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">EIP-8004</Badge>
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
              </a>
            </div>
          </InfoRow>
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
    <div className="space-y-8">
      <Link href="/trade/auctions">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Auctions
        </Button>
      </Link>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
          <Gavel className="size-12 text-muted-foreground/30" />
          <h2 className="text-xl font-semibold text-foreground">Auction Not Found</h2>
          <p className="text-sm text-muted-foreground">
            Could not find auction &quot;{id}&quot;.
          </p>
          <Link href="/trade/auctions">
            <Button variant="default" size="sm">
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
  params: Promise<{ chainId: string; auctionId: string }>
}) {
  const { chainId: chainIdParam, auctionId } = use(params)
  const [bidAmount, setBidAmount] = useState('')

  const chainId = parseInt(chainIdParam, 10)
  const id = `${chainIdParam}-${auctionId}`

  // Wallet
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()

  const { data, isLoading, error } = useAuctionDetail(id)
  const auction = data?.auction
  const bids = data?.bids ?? []

  // Extract embedded agent from auction response (avoids second API call)
  const agent = (data as Record<string, unknown> | undefined)?.agent as AgentDetail | undefined
  const agentId = auction ? `${auction.chain_id}-${auction.token_id}` : ''

  // Contract
  const marketplaceAddress = getMoltMarketplaceAddress(chainId)

  // Place Bid
  const {
    data: bidTxHash,
    writeContract: writeBid,
    isPending: isBidPending,
    error: bidError,
    reset: resetBid,
  } = useWriteContract()

  const { isLoading: isBidConfirming, isSuccess: isBidConfirmed } =
    useWaitForTransactionReceipt({ hash: bidTxHash })

  // Buy Now (uses bid with amount >= buyNowPrice)
  const {
    data: buyNowTxHash,
    writeContract: writeBuyNow,
    isPending: isBuyNowPending,
    error: buyNowError,
    reset: resetBuyNow,
  } = useWriteContract()

  const { isLoading: isBuyNowConfirming, isSuccess: isBuyNowConfirmed } =
    useWaitForTransactionReceipt({ hash: buyNowTxHash })

  // Is seller?
  const isSeller = isConnected && address && auction
    ? address.toLowerCase() === auction.seller.toLowerCase()
    : false

  // Place bid handler
  const handlePlaceBid = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    if (!auction || !marketplaceAddress || !bidAmount) return
    if (isSeller) {
      toast.error('Seller cannot bid on their own auction')
      return
    }

    const amountWei = parsePriceToBigInt((parseFloat(bidAmount) * 1e18).toString())

    writeBid({
      address: marketplaceAddress,
      abi: moltMarketplaceAbi,
      functionName: 'bid',
      args: [BigInt(auction.auction_id), amountWei],
      value: isNativeToken(auction.payment_token) ? amountWei : undefined,
    })
  }

  // Buy Now handler
  const handleBuyNow = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }
    if (!auction || !marketplaceAddress) return
    if (isSeller) {
      toast.error('Seller cannot buy their own auction')
      return
    }

    const buyNowPriceWei = parsePriceToBigInt(auction.buy_now_price)

    // Use bid() with amount = buyNowPrice to trigger _settleBuyNow in contract
    writeBuyNow({
      address: marketplaceAddress,
      abi: moltMarketplaceAbi,
      functionName: 'bid',
      args: [BigInt(auction.auction_id), buyNowPriceWei],
      value: isNativeToken(auction.payment_token) ? buyNowPriceWei : undefined,
    })
  }

  // Toast effects
  useEffect(() => {
    if (isBidConfirmed) {
      toast.success('Bid placed! 🎉', {
        description: `Your bid of ${bidAmount} has been recorded.`,
      })
      setBidAmount('')
    }
  }, [isBidConfirmed, bidAmount])

  useEffect(() => {
    if (bidError) {
      toast.error('Bid failed', {
        description: bidError.message.slice(0, 100),
      })
    }
  }, [bidError])

  useEffect(() => {
    if (isBuyNowConfirmed) {
      toast.success('Purchase successful! 🎉', {
        description: 'You bought the agent identity at the buy-now price.',
      })
    }
  }, [isBuyNowConfirmed])

  useEffect(() => {
    if (buyNowError) {
      toast.error('Buy Now failed', {
        description: buyNowError.message.slice(0, 100),
      })
    }
  }, [buyNowError])

  // ── Settle Auction ──
  const {
    data: settleTxHash,
    writeContract: writeSettle,
    isPending: isSettlePending,
  } = useWriteContract()
  const { isLoading: isSettleConfirming, isSuccess: isSettleConfirmed } =
    useWaitForTransactionReceipt({ hash: settleTxHash })

  const handleSettleAuction = () => {
    if (!auction || !marketplaceAddress) return
    writeSettle({
      address: marketplaceAddress,
      abi: moltMarketplaceAbi,
      functionName: 'settleAuction',
      args: [BigInt(auction.auction_id)],
    })
  }

  // ── Cancel Auction ──
  const {
    data: cancelTxHash,
    writeContract: writeCancel,
    isPending: isCancelPending,
  } = useWriteContract()
  const { isLoading: isCancelConfirming, isSuccess: isCancelConfirmed } =
    useWaitForTransactionReceipt({ hash: cancelTxHash })

  const handleCancelAuction = () => {
    if (!auction || !marketplaceAddress) return
    writeCancel({
      address: marketplaceAddress,
      abi: moltMarketplaceAbi,
      functionName: 'cancelAuction',
      args: [BigInt(auction.auction_id)],
    })
  }

  useEffect(() => {
    if (isSettleConfirmed) toast.success('Auction settled! 🎉')
  }, [isSettleConfirmed])

  useEffect(() => {
    if (isCancelConfirmed) toast.success('Auction cancelled')
  }, [isCancelConfirmed])

  if (error && !isLoading) return <ErrorState id={id} />

  const status = auction ? getAuctionStatus(auction) : 'upcoming'
  const token = auction ? getTokenLabel(auction.payment_token) : ''
  const hasBids = auction ? auction.highest_bid !== null && parseFloat(auction.highest_bid) > 0 : false
  const hasReserve = auction ? parseFloat(auction.reserve_price) > 0 : false
  const hasBuyNow = auction ? parseFloat(auction.buy_now_price) > 0 : false
  const isBidding = isBidPending || isBidConfirming
  const isBuyingNow = isBuyNowPending || isBuyNowConfirming

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link href="/trade/auctions">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to Auctions
        </Button>
      </Link>

      {/* Two-column layout: Left = HoloCard only, Right = everything */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        {/* ============ LEFT COLUMN — HoloCard only (sticky) ============ */}
        <div className="flex justify-center lg:sticky lg:top-8 lg:self-start lg:justify-start">
          {auction ? (
            <HoloCard
              image={agent?.image ?? auction.agent_image}
              name={auction.agent_name || agent?.name || `Agent #${auction.token_id}`}
              description={agent?.description ?? null}
              score={agent?.reputation_score ?? null}
              feedbackCount={agent?.feedback_count ?? 0}
              chainId={auction.chain_id}
              owner={auction.seller}
              agent={agent ?? undefined}
            />
          ) : (
            <div className="w-full max-w-[300px] aspect-[5/7] rounded-2xl border border-border/50 bg-card/95 overflow-hidden">
              {/* Image area — matches HoloCard 55% */}
              <Skeleton className="h-[55%] w-full rounded-none" />
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

        {/* ============ RIGHT COLUMN — everything ============ */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">MOLT MARKETPLACE</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                {auction ? (auction.agent_name || `Agent #${auction.token_id}`) : <Skeleton className="inline-block h-8 w-48" />}
              </h1>
              {auction ? (
                <>
                  <StatusBadge status={status} />
                  <Badge variant="outline" className={cn(
                    'text-xs',
                    chainId === 143
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  )}>
                    {getChainLabel(chainId)}
                  </Badge>
                </>
              ) : (
                <>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </>
              )}
            </div>
            {auction ? (
              <p className="text-sm text-muted-foreground">
                Sold by{' '}
                <a
                  href={getExplorerUrl(chainId, auction.seller)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-primary/80 hover:text-primary transition-colors"
                >
                  {formatAddress(auction.seller)}
                  <ExternalLink className="size-2.5" />
                </a>
              </p>
            ) : (
              <Skeleton className="h-4 w-48" />
            )}
          </div>

          {/* Main auction info card with CTA */}
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 space-y-5">
            {auction ? (
              <>
                {/* Bid + Countdown row */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground">
                      {hasBids ? 'Current Bid' : 'Starting Bid'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(hasBids ? auction.highest_bid! : auction.start_price)}
                      </span>
                      <span className="text-lg text-muted-foreground">{token}</span>
                    </div>
                    {hasBids && auction.highest_bidder && (
                      <p className="text-xs text-muted-foreground">
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

                  <CountdownDisplay endTime={auction.end_time} startTime={auction.start_time} />
                </div>

                {hasReserve && <ReservePriceIndicator auction={auction} token={token} />}

                {/* Place Bid CTA */}
                {status === 'live' && (
                  <div className="space-y-3">
                    {!isConnected ? (
                      <Button
                        size="lg"
                        className="w-full gap-2 text-base font-semibold"
                        onClick={openConnectModal}
                      >
                        <Wallet className="size-5" />
                        Connect Wallet to Bid
                      </Button>
                    ) : isSeller ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/50 p-3">
                          <Gavel className="size-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">You are the seller</span>
                        </div>
                        <div className="flex gap-2">
                          {auction && getAuctionStatus(auction) === 'ended' && hasBids && (
                            <Button
                              className="flex-1 gap-2"
                              onClick={handleSettleAuction}
                              disabled={isSettlePending || isSettleConfirming}
                            >
                              {isSettlePending || isSettleConfirming ? (
                                <><Loader2 className="size-4 animate-spin" />{isSettlePending ? 'Confirm…' : 'Settling…'}</>
                              ) : (
                                'Settle Auction'
                              )}
                            </Button>
                          )}
                          {!hasBids && (
                            <Button
                              variant="destructive"
                              className="flex-1 gap-2"
                              onClick={handleCancelAuction}
                              disabled={isCancelPending || isCancelConfirming}
                            >
                              {isCancelPending || isCancelConfirming ? (
                                <><Loader2 className="size-4 animate-spin" />{isCancelPending ? 'Confirm…' : 'Cancelling…'}</>
                              ) : (
                                'Cancel Auction'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="number"
                              placeholder={`Min bid: ${formatPrice(hasBids ? auction.highest_bid! : auction.start_price)} ${token}`}
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              className="pr-14 bg-muted/30 border-border/50"
                              disabled={isBidding}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{token}</span>
                          </div>
                          <Button
                            className="gap-2 px-6"
                            onClick={handlePlaceBid}
                            disabled={isBidding || !bidAmount || parseFloat(bidAmount) <= 0}
                          >
                            {isBidding ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                {isBidPending ? 'Confirm…' : 'Pending…'}
                              </>
                            ) : (
                              <>
                                <Gavel className="size-4" />
                                Place Bid
                              </>
                            )}
                          </Button>
                        </div>
                        {hasBuyNow && (
                          <Button
                            variant="outline"
                            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={handleBuyNow}
                            disabled={isBuyingNow}
                          >
                            {isBuyingNow ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                {isBuyNowPending ? 'Confirm in Wallet…' : 'Confirming…'}
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="size-4" />
                                Buy Now for {formatPrice(auction.buy_now_price)} {token}
                              </>
                            )}
                          </Button>
                        )}
                      </>
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
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 text-center">
                    <Clock className="size-5 text-yellow-400" />
                    <p className="text-sm font-medium text-foreground">Auction Not Started</p>
                    <p className="text-xs text-muted-foreground">
                      Starts {new Date(auction.start_time * 1000).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Settle Auction — show when ended and has bids */}
                {status === 'ended' && hasBids && !auction.winner && (
                  <Button
                    className="w-full gap-2"
                    onClick={handleSettleAuction}
                    disabled={isSettlePending || isSettleConfirming}
                  >
                    {isSettlePending || isSettleConfirming ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {isSettlePending ? 'Confirm in Wallet…' : 'Settling…'}
                      </>
                    ) : (
                      <>
                        <Gavel className="size-4" />
                        Settle Auction
                      </>
                    )}
                  </Button>
                )}

                {/* Cancel Auction — show if seller and no bids */}
                {isSeller && !hasBids && status !== 'ended' && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={handleCancelAuction}
                    disabled={isCancelPending || isCancelConfirming}
                  >
                    {isCancelPending || isCancelConfirming ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {isCancelPending ? 'Confirm…' : 'Cancelling…'}
                      </>
                    ) : (
                      'Cancel Auction'
                    )}
                  </Button>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start Bid</p>
                    <p className="text-sm font-semibold text-foreground">{formatPrice(auction.start_price)}</p>
                    <p className="text-[10px] text-muted-foreground">{token}</p>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reserve</p>
                    <p className="text-sm font-semibold text-foreground">
                      {hasReserve ? formatPrice(auction.reserve_price) : '—'}
                    </p>
                    {hasReserve && <p className="text-[10px] text-muted-foreground">{token}</p>}
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buy Now</p>
                    <p className="text-sm font-semibold text-foreground">
                      {hasBuyNow ? formatPrice(auction.buy_now_price) : '—'}
                    </p>
                    {hasBuyNow && <p className="text-[10px] text-muted-foreground">{token}</p>}
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bids</p>
                    <p className="text-sm font-semibold text-foreground">{auction.bid_count ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Skeleton for bid + countdown */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-48" />
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-40" />
                  </div>
                </div>
                {/* Skeleton for CTA */}
                <Skeleton className="h-10 w-full rounded-lg" />
                {/* Skeleton for stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1 rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                      <Skeleton className="mx-auto h-3 w-12" />
                      <Skeleton className="mx-auto h-5 w-16" />
                      <Skeleton className="mx-auto h-3 w-8" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bid History */}
          <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              📜 Bid History
              {bids.length > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {bids.length}
                </span>
              )}
            </h3>
            {auction ? (
              <BidHistoryTable bids={bids} chainId={chainId} token={token} />
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-3" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agent Properties */}
          {agent && <AgentPropertiesSection agent={agent} chainId={chainId} />}

          {/* Endpoints */}
          {agent && <EndpointsSection agent={agent} chainId={chainId} />}

          {/* Provenance */}
          {agent && <ProvenanceSection agent={agent} chainId={chainId} />}

          {/* Item Activity */}
          <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              ⚡ Item Activity
            </h3>
            {auction ? (
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
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
