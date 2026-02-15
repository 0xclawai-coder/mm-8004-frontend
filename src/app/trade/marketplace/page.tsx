'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AgentImage } from '@/components/ui/agent-image'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react'
import { useListings } from '@/hooks/useListings'
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
import { EmptyState } from '@/components/ui/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { cn, formatAddress, formatPrice, getTokenLabel } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import type { ColumnDef } from '@tanstack/react-table'
import type { MarketplaceListing, ListingSortOrder } from '@/types'

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

import { getChainLabel } from '@/lib/chain-utils'

// ============================================================
// Columns
// ============================================================

const columns: ColumnDef<MarketplaceListing, unknown>[] = [
  {
    id: 'rank',
    header: '#',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.index + 1}</span>
    ),
    enableSorting: false,
    size: 50,
  },
  {
    accessorKey: 'token_id',
    header: 'Identity',
    size: 240,
    cell: ({ row }) => {
      const l = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9 shrink-0 rounded-lg ring-1 ring-border">
            <AvatarImage
              src={l.agent_image ?? undefined}
              alt={l.agent_name ?? `Agent #${l.token_id}`}
            />
            <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/10 text-xs font-bold text-primary">
              #{l.token_id}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {l.agent_name || `Agent #${l.token_id}`}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {formatAddress(l.nft_contract)}
            </p>
          </div>
        </div>
      )
    },
    enableSorting: false,
    meta: {
      skeleton: (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ),
    },
  },
  {
    accessorKey: 'seller',
    header: 'Seller',
    size: 130,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {formatAddress(getValue<string>())}
      </span>
    ),
    enableSorting: false,
    meta: { className: 'hidden md:table-cell' },
  },
  {
    id: 'chain',
    header: 'Chain',
    size: 90,
    cell: ({ row }) => {
      const l = row.original
      return (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            l.chain_id === 143
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
          )}
        >
          {getChainLabel(l.chain_id)}
        </Badge>
      )
    },
    enableSorting: false,
    meta: { className: 'hidden lg:table-cell' },
  },
  {
    accessorKey: 'price',
    header: 'Price',
    size: 140,
    cell: ({ row }) => {
      const l = row.original
      return (
        <div className="text-right">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(l.price)}
          </span>{' '}
          <span className="text-xs text-muted-foreground">
            {getTokenLabel(l.payment_token)}
          </span>
        </div>
      )
    },
    enableSorting: true,
    meta: { className: 'text-right' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 90,
    cell: ({ getValue }) => {
      const status = getValue<string>()
      return (
        <Badge
          variant="outline"
          className={cn('text-[10px]', getStatusColor(status))}
        >
          {status}
        </Badge>
      )
    },
    enableSorting: false,
    meta: { className: 'hidden sm:table-cell' },
  },
  {
    accessorKey: 'block_timestamp',
    header: 'Listed',
    size: 100,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">
        <TimeCounter targetTime={new Date(getValue<string>())} />
      </span>
    ),
    enableSorting: false,
    meta: { className: 'hidden lg:table-cell' },
  },
]

// ============================================================
// Mobile Card Skeleton
// ============================================================

function MobileCardSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3"
        >
          <Skeleton className="size-14 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="shrink-0 space-y-2 text-right">
            <Skeleton className="ml-auto h-4 w-16" />
            <Skeleton className="ml-auto h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Mobile Card View
// ============================================================

function MobileListingCard({ listing }: { listing: MarketplaceListing }) {
  return (
    <Link
      href={`/trade/marketplace/${listing.chain_id}/${listing.listing_id}`}
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3 transition-colors active:bg-muted/30"
    >
      {/* Agent image */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-cyan-500/10 ring-1 ring-border">
        <AgentImage
          src={listing.agent_image}
          alt={listing.agent_name ?? `Agent #${listing.token_id}`}
          fallbackText={listing.agent_name ?? `#${listing.token_id}`}
          sizes="56px"
        />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-foreground">
          {listing.agent_name || `Agent #${listing.token_id}`}
        </p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {formatAddress(listing.seller)}
        </p>
      </div>

      {/* Price + status */}
      <div className="flex shrink-0 flex-col gap-1 text-right">
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(listing.price)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {getTokenLabel(listing.payment_token)}
        </p>
        <Badge
          variant="outline"
          className={cn('text-[10px]', getStatusColor(listing.status))}
        >
          {listing.status}
        </Badge>
      </div>
    </Link>
  )
}

// ============================================================
// Page
// ============================================================

export default function MarketplacePage() {
  const router = useRouter()
  const [chainId, setChainId] = useState<number | undefined>(undefined)
  const [sort, setSort] = useState<ListingSortOrder>('recent')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { data, isLoading } = useListings({
    chain_id: chainId,
    sort,
    page,
    limit,
  })

  const listings = data?.listings ?? []
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
        title="Deal Room"
        subtitle="Agents open for acquisition"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {!isLoading && <span>{total} Listings</span>}
          </div>
          <Select value={sort} onValueChange={(v) => { setSort(v as ListingSortOrder); setPage(1) }}>
            <SelectTrigger size="sm" className="w-auto gap-1.5 border-border/50 bg-card/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
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

      {/* Mobile Card View */}
      <div className="sm:hidden">
        {isLoading ? (
          <MobileCardSkeleton count={8} />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No Deals Found"
            description="There are no agents open for acquisition matching your filters yet."
          />
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <MobileListingCard
                key={`${listing.chain_id}-${listing.listing_id}`}
                listing={listing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Table (sm and above) — uses DataTable with server-side pagination */}
      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={listings}
          isLoading={isLoading}
          skeletonRows={limit}
          pageSize={999}
          emptyMessage="There are no agents open for acquisition matching your filters yet."
        />
      </div>

      {/* Server-side Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="inline-block h-4 w-24" />
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
          <span className="hidden items-center gap-1 sm:flex">
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
          </span>
          <span className="text-xs text-muted-foreground sm:hidden">{page}/{totalPages}</span>
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
