'use client'

import { useState } from 'react'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { useBundles } from '@/hooks/useBundles'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChainFilter } from '@/components/agents/ChainFilter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatAddress, formatPrice, getTokenLabel } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import type { MarketplaceBundle } from '@/types'

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
      return 'border-green-500/30 bg-green-500/10 text-green-400'
    case 'Sold':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    case 'Cancelled':
      return 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
    default:
      return ''
  }
}

// ============================================================
// Bundle Card
// ============================================================

function BundleCard({ bundle }: { bundle: MarketplaceBundle }) {
  const token = getTokenLabel(bundle.payment_token)
  const isExpired = bundle.expiry > 0 && Math.floor(Date.now() / 1000) >= bundle.expiry

  return (
    <div className="group overflow-hidden rounded-xl border border-border/50 bg-card/60 transition-colors hover:border-primary/30">
      {/* Image area */}
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-primary/20 via-card to-cyan-accent/10">
        <div className="flex flex-col items-center gap-2">
          <Package className="size-10 text-primary/40" />
          <span className="text-sm font-semibold text-primary/60">
            {bundle.item_count} items
          </span>
        </div>

        {/* Status badge */}
        <Badge
          className={cn(
            'absolute top-2 left-2 border-none text-[10px]',
            isExpired
              ? 'bg-destructive/80 text-destructive-foreground'
              : bundle.status === 'Active'
                ? 'bg-green-500/80 text-black'
                : bundle.status === 'Sold'
                  ? 'bg-blue-500/80 text-white'
                  : 'bg-muted/80 text-muted-foreground'
          )}
        >
          {isExpired ? 'Expired' : bundle.status}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            Bundle #{bundle.bundle_id}
          </p>
          <Badge variant="outline" className={cn('shrink-0 text-[10px]', getStatusColor(bundle.status))}>
            {bundle.item_count} NFTs
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">Price</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(bundle.price)}
              </span>
              <span className="text-xs text-muted-foreground">{token}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Seller</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {formatAddress(bundle.seller)}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Listed <TimeCounter targetTime={new Date(bundle.block_timestamp)} />
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Skeleton
// ============================================================

function BundleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="ml-auto h-3 w-10" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function BundlesPage() {
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const limit = 24

  const { data, isLoading } = useBundles({
    chain_id: chainId,
    page,
    limit,
  })

  const bundles = data?.bundles ?? []
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
      <PageHeader title="Bundles" subtitle="Buy and sell agent identity bundles" />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isLoading ? <Skeleton className="h-4 w-24" /> : <span>{total} Bundles</span>}
        </div>
        <ChainFilter selected={chainId} onSelect={(v) => { setChainId(v); setPage(1) }} />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: limit }).map((_, i) => <BundleCardSkeleton key={i} />)}
        </div>
      ) : bundles.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Bundles Listed"
          description="Bundle listings will appear here once sellers create multi-NFT packages."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {bundles.map((bundle) => (
            <BundleCard key={`${bundle.chain_id}-${bundle.bundle_id}`} bundle={bundle} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="inline-block h-4 w-40" />
          ) : total > 0 ? (
            <>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</>
          ) : (
            <>&nbsp;</>
          )}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading} className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs">
            <ChevronLeft className="size-3.5" /> Prev
          </Button>
          {pageNumbers.map((p) => (
            <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)} disabled={isLoading} className={cn('size-8 p-0 text-xs', p !== page && 'border-border/50 bg-card/80')}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading} className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs">
            Next <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
