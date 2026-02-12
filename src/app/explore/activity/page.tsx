'use client'

import {
  Activity,
  Users,
  MessageSquare,
  UserPlus,
  MessagesSquare,
  Radio,
  Zap,
} from 'lucide-react'
import { useStats } from '@/hooks/useStats'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
// Page
// ============================================================

export default function ActivityPage() {
  const { data: stats, isLoading } = useStats()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recent Activity"
        subtitle="Global on-chain events across all agents"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Total Agents"
              value={stats?.total_agents ?? 0}
              icon={<Users className="size-5" />}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              label="Total Feedbacks"
              value={stats?.total_feedbacks ?? 0}
              icon={<MessageSquare className="size-5" />}
              accent="bg-cyan-500/10 text-cyan-400"
            />
            <StatCard
              label="24h Registrations"
              value={stats?.recent_registrations_24h ?? 0}
              icon={<UserPlus className="size-5" />}
              accent="bg-green-500/10 text-green-400"
              subtext="New agents last 24h"
            />
            <StatCard
              label="24h Feedbacks"
              value={stats?.recent_feedbacks_24h ?? 0}
              icon={<MessagesSquare className="size-5" />}
              accent="bg-yellow-500/10 text-yellow-400"
              subtext="Feedbacks last 24h"
            />
          </>
        )}
      </div>

      {/* Chain breakdown mini-cards */}
      {!isLoading && stats?.agents_by_chain && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(stats.agents_by_chain).map(([chainId, count]) => {
            const label = chainId === '143' ? 'Monad' : chainId === '10143' ? 'Monad Testnet' : `Chain ${chainId}`
            const dotColor = chainId === '143' ? 'bg-green-400' : 'bg-yellow-400'
            return (
              <div
                key={chainId}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3"
              >
                <span className={cn('inline-block size-2 rounded-full', dotColor)} />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{count} agents</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Transactions Empty State */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/40 py-20">
          <div className="relative mb-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Radio className="size-7 text-primary" />
            </div>
            <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-cyan-500/20">
              <Zap className="size-3 text-cyan-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">
            Activity feed coming soon
          </p>
          <p className="mt-1 max-w-sm text-center text-xs text-muted-foreground">
            The global activity feed will be available with the next indexer update.
            Agent registration events, feedback submissions, and marketplace
            transactions will appear here in real-time.
          </p>
        </div>
      </section>
    </div>
  )
}
