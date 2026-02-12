'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gavel, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAuctions } from '@/hooks/useAuctions'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatPrice, getTokenLabel } from '@/lib/utils'
import type { MarketplaceAuction, AuctionSortOrder } from '@/types'

function getTimeLeft(endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = endTime - now
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86400)
  const hours = Math.floor((diff % 86400) / 3600)
  const mins = Math.floor((diff % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function hasStarted(startTime: number): boolean {
  return Math.floor(Date.now() / 1000) >= startTime
}

function isEnded(endTime: number): boolean {
  return Math.floor(Date.now() / 1000) >= endTime
}

// ============================================================
// Auction Card
// ============================================================

function AuctionCard({ auction }: { auction: MarketplaceAuction }) {
  const started = hasStarted(auction.start_time)
  const ended = isEnded(auction.end_time)
  const hasBids = auction.highest_bid !== null && parseFloat(auction.highest_bid) > 0
  const token = getTokenLabel(auction.payment_token)

  return (
    <div className="group overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-colors hover:border-primary/30">
      {/* Image area */}
      <div className="relative aspect-square bg-gradient-to-br from-primary/20 via-card to-cyan-accent/10">
        {auction.agent_image ? (
          <Image
            src={auction.agent_image}
            alt={auction.agent_name ?? `Agent #${auction.token_id}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-3xl font-bold text-primary/40">
              #{auction.token_id}
            </span>
          </div>
        )}

        {/* Status badge overlay */}
        {ended ? (
          <Badge className="absolute top-2 left-2 border-none bg-destructive/80 text-[10px] text-destructive-foreground">
            Ended
          </Badge>
        ) : !started ? (
          <Badge className="absolute top-2 left-2 border-none bg-yellow-500/80 text-[10px] text-black">
            Upcoming
          </Badge>
        ) : (
          <Badge className="absolute top-2 left-2 border-none bg-green-500/80 text-[10px] text-black">
            Live
          </Badge>
        )}

        {/* Buy now price */}
        {parseFloat(auction.buy_now_price) > 0 && !ended && (
          <Badge
            variant="outline"
            className="absolute top-2 right-2 border-primary/30 bg-card/80 text-[10px] text-primary backdrop-blur-sm"
          >
            Buy Now {formatPrice(auction.buy_now_price)} {token}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3 p-3">
        {/* Name + bid count */}
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {auction.agent_name || `Agent #${auction.token_id}`}
          </p>
          {(auction.bid_count ?? 0) > 0 && (
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Gavel className="size-3" />
              {auction.bid_count}
            </div>
          )}
        </div>

        {/* Bid + Time */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">
              {hasBids ? 'Current Bid' : 'Starting Bid'}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'inline-block size-1.5 rounded-full',
                  hasBids ? 'bg-green-400' : 'bg-muted-foreground'
                )}
              />
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(hasBids ? auction.highest_bid! : auction.start_price)}
              </span>
              <span className="text-xs text-muted-foreground">{token}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Ends In</p>
            <p
              className={cn(
                'text-sm font-medium',
                ended
                  ? 'text-destructive'
                  : !started
                    ? 'text-yellow-400'
                    : 'text-foreground'
              )}
            >
              {!started ? 'Not Started' : getTimeLeft(auction.end_time)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Skeleton
// ============================================================

function AuctionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="ml-auto h-3 w-12" />
            <Skeleton className="ml-auto h-4 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function AuctionsPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState<AuctionSortOrder>('ending_soon')
  const [page, setPage] = useState(1)
  const limit = 24

  const { data, isLoading } = useAuctions({
    chain_id: chainId,
    sort,
    page,
    limit,
  })

  const auctions = data?.auctions ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  // Page numbers
  const pageNumbers: number[] = []
  const maxVisible = 5
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
  const endPage = Math.min(totalPages, startPage + maxVisible - 1)
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auctions"
        subtitle="Live & Upcoming Auctions"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span>{total} Auctions</span>
            )}
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v as AuctionSortOrder); setPage(1) }}>
            <SelectTrigger size="sm" className="w-auto gap-1.5 border-border/50 bg-card/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending_soon">Ending Soonest</SelectItem>
              <SelectItem value="highest_bid">Highest Bid</SelectItem>
              <SelectItem value="recent">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <ChainFilter
            selected={chainId}
            onSelect={(v) => { setChainId(v); setPage(1) }}
            className="w-max"
          />
        </div>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: limit }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No Auctions Found"
          description="There are no auctions matching your filters right now. Check back soon!"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {auctions.map((auction) => (
            <Link
              key={`${auction.chain_id}-${auction.auction_id}`}
              href={`/trade/auctions/${auction.chain_id}-${auction.auction_id}`}
            >
              <AuctionCard auction={auction} />
            </Link>
          ))}
        </div>
      )}

      {/* Pagination — always rendered to prevent layout shift */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="inline-block h-4 w-40" />
          ) : total > 0 ? (
            <>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</>
          ) : (
            <>&nbsp;</>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs"
          >
            <ChevronLeft className="size-3.5" />
            Prev
          </Button>
          {isLoading && pageNumbers.length === 0 ? (
            <Skeleton className="h-8 w-8 rounded-md" />
          ) : (
            pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                disabled={isLoading}
                className={cn(
                  'size-8 p-0 text-xs',
                  p !== page && 'border-border/50 bg-card/80',
                  isLoading && 'opacity-60',
                )}
              >
                {p}
              </Button>
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs"
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
