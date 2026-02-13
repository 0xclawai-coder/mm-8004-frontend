'use client'

import {
  Users,
  MessageSquare,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Zap,
  Tag,
  Link2,
} from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { useMarketplaceStats } from '@/hooks/useMarketplaceStats'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatPrice } from '@/lib/utils'

// ============================================================
// Stat Card
// ============================================================

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: string
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
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
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-bold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/60 py-0">
      <CardContent className="flex items-center gap-4 p-4">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Category Bar
// ============================================================

function CategoryBar({
  category,
  count,
  maxCount,
}: {
  category: string
  count: number
  maxCount: number
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <Badge
        variant="secondary"
        className="w-24 shrink-0 justify-center border-primary/20 bg-primary/10 text-primary text-[10px]"
      >
        {category}
      </Badge>
      <div className="flex-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-10 text-right text-xs font-medium text-foreground">
        {count}
      </span>
    </div>
  )
}

// ============================================================
// Chain Breakdown Card
// ============================================================

function ChainCard({
  chainId,
  count,
  total,
}: {
  chainId: string
  count: number
  total: number
}) {
  const label =
    chainId === '143'
      ? 'Monad'
      : chainId === '10143'
        ? 'Monad Testnet'
        : `Chain ${chainId}`
  const dotColor = chainId === '143' ? 'bg-green-400' : 'bg-yellow-400'
  const borderColor =
    chainId === '143'
      ? 'border-green-500/30'
      : 'border-yellow-500/30'
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border bg-card/40 px-4 py-3',
        borderColor
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('inline-block size-2.5 rounded-full', dotColor)} />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Chain ID: {chainId}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{count}</p>
        <p className="text-xs text-muted-foreground">{pct}%</p>
      </div>
    </div>
  )
}

// ============================================================
// Page
// ============================================================

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: mktStats, isLoading: mktLoading } = useMarketplaceStats()

  const isLoading = statsLoading || mktLoading
  const totalAgents = stats?.total_agents ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Intelligence"
        subtitle="Deal volume, metrics, and market insights"
      />

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
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
              label="Open Deals"
              value={mktStats?.active_listings ?? 0}
              icon={<ShoppingBag className="size-5" />}
              accent="bg-green-500/10 text-green-400"
            />
            <StatCard
              label="Total Volume"
              value={
                mktStats?.total_volume
                  ? `${formatPrice(mktStats.total_volume)} MON`
                  : '0 MON'
              }
              icon={<DollarSign className="size-5" />}
              accent="bg-yellow-500/10 text-yellow-400"
            />
            <StatCard
              label="Acquisitions"
              value={mktStats?.total_sales ?? 0}
              icon={<TrendingUp className="size-5" />}
              accent="bg-purple-500/10 text-purple-400"
            />
            <StatCard
              label="24h Activity"
              value={
                (stats?.recent_registrations_24h ?? 0) +
                (stats?.recent_feedbacks_24h ?? 0)
              }
              icon={<Zap className="size-5" />}
              accent="bg-orange-500/10 text-orange-400"
            />
          </>
        )}
      </div>

      {/* Top Categories */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Tag className="size-4 text-primary" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          ) : stats?.top_categories && stats.top_categories.length > 0 ? (
            <div className="space-y-2.5">
              {stats.top_categories.map((cat) => (
                <CategoryBar
                  key={cat.category}
                  category={cat.category}
                  count={cat.count}
                  maxCount={stats.top_categories[0]?.count ?? 1}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No category data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Agents by Chain */}
      <Card className="border-border/50 bg-card/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Link2 className="size-4 text-primary" />
            Agents by Chain
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : stats?.agents_by_chain &&
            Object.keys(stats.agents_by_chain).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(stats.agents_by_chain).map(([chainId, count]) => (
                <ChainCard
                  key={chainId}
                  chainId={chainId}
                  count={count}
                  total={totalAgents}
                />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No chain data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
