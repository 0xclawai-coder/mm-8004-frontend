'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Cpu,
  Shield,
  Zap,
  MessageSquare,
  ShoppingBag,
  Users,
  TrendingUp,
  Gavel,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AgentCard } from '@/components/agents/AgentCard'
import { useStats } from '@/hooks/useStats'
import { useMarketplaceStats } from '@/hooks/useMarketplaceStats'
import { useAgents } from '@/hooks/useAgents'
import { useListings } from '@/hooks/useListings'
import { cn, formatPrice, formatAddress, getTokenLabel } from '@/lib/utils'

// ============================================================
// Stats Bar
// ============================================================

function StatsBar() {
  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: mStats, isLoading: mLoading } = useMarketplaceStats()
  const isLoading = statsLoading || mLoading

  const totalSales = mStats?.total_sales ?? 0

  const items = [
    { label: 'Total Agents', value: stats?.total_agents ?? 0, icon: <Users className="size-4" />, href: '/explore/agents' },
    { label: 'Active Listings', value: mStats?.active_listings ?? 0, icon: <ShoppingBag className="size-4" />, href: '/trade/marketplace' },
    { label: 'Total Sales', value: totalSales, icon: <TrendingUp className="size-4" />, href: '/analytics/overview' },
    { label: 'Active Auctions', value: mStats?.active_auctions ?? 0, icon: <Gavel className="size-4" />, href: '/trade/auctions' },
    { label: 'Total Feedbacks', value: stats?.total_feedbacks ?? 0, icon: <MessageSquare className="size-4" />, href: '/analytics/overview' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
      {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col gap-1.5 rounded-xl border border-border/30 bg-card/40 p-4 text-center transition-colors hover:border-primary/30 hover:bg-card/60"
          >
            <div className="flex items-center justify-center text-primary">
              {item.icon}
            </div>
            {isLoading ? (
              <Skeleton className="mx-auto h-7 w-16" />
            ) : (
              <p className="text-xl font-bold text-foreground">
                {typeof item.value === 'number'
                  ? item.value.toLocaleString()
                  : item.value}
              </p>
            )}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
          </Link>
        ))}
    </div>
  )
}

// ============================================================
// Featured Agents
// ============================================================

function FeaturedAgents() {
  const { data, isLoading } = useAgents({ sort: 'score', limit: 6 })
  const agents = data?.agents ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Top Agents</h2>
        <Link
          href="/explore/agents"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View All <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50 bg-card/80 py-0">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          : agents.map((agent) => (
              <AgentCard
                key={`${agent.chain_id}-${agent.agent_id}`}
                agent={agent}
              />
            ))}
      </div>
    </section>
  )
}

// ============================================================
// Recent Listings
// ============================================================

function RecentListings() {
  const { data, isLoading } = useListings({ sort: 'recent', limit: 6 })
  const listings = data?.listings ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Recent Listings</h2>
        <Link
          href="/trade/marketplace"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Marketplace <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/50 bg-card/80 py-0 overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </Card>
            ))
          : listings.map((listing) => (
              <Link
                key={`${listing.chain_id}-${listing.listing_id}`}
                href={`/trade/marketplace/${listing.chain_id}/${listing.listing_id}`}
                className="group block"
              >
                <Card className="overflow-hidden border-border/50 bg-card/80 py-0 transition-all duration-300 group-hover:scale-[1.03] group-hover:border-primary/30 group-hover:glow-violet">
                  {listing.agent_image ? (
                    <div className="relative aspect-square w-full">
                      <Image
                        src={listing.agent_image}
                        alt={listing.agent_name ?? ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-primary/20 via-violet-500/10 to-cyan-500/10">
                      <Cpu className="size-10 text-primary/30" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 p-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {listing.agent_name || `Agent #${listing.token_id}`}
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {formatPrice(listing.price)}{' '}
                      <span className="text-muted-foreground">
                        {getTokenLabel(listing.payment_token)}
                      </span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatAddress(listing.seller)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
      </div>
    </section>
  )
}

// ============================================================
// Features Section
// ============================================================

const features = [
  {
    icon: <Cpu className="size-6" />,
    title: 'EIP-8004',
    subtitle: 'Agent Identity Standard',
    description:
      'On-chain identity for AI agents — name, description, capabilities, and endpoints stored as EIP-8004 identity metadata.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: <Shield className="size-6" />,
    title: 'x402',
    subtitle: 'Payment Protocol',
    description:
      'HTTP 402-based micropayment protocol. Pay-per-use AI services with on-chain settlement.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: <Zap className="size-6" />,
    title: 'Monad',
    subtitle: 'High-Performance L1',
    description:
      '10,000 TPS with 1s finality. The fastest EVM chain for real-time agent interactions.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: <MessageSquare className="size-6" />,
    title: 'Reputation',
    subtitle: 'On-Chain Feedback',
    description:
      'Transparent scoring system. Every interaction is recorded — trust is earned, not claimed.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
  },
]

function FeaturesSection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          Why Molt?
        </h2>
        <p className="text-sm text-muted-foreground">
          The infrastructure for autonomous AI agent economies
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card
            key={f.title}
            className="border-border/50 bg-card/60 py-0 transition-all duration-300 hover:border-border hover:bg-card/80"
          >
            <CardContent className="flex flex-col gap-3 p-5">
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg border',
                  f.bg,
                  f.color,
                )}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {f.subtitle}
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// CTA Banner
// ============================================================

function CTABanner() {
  return (
    <section className="flex flex-col items-center gap-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-violet-500/5 to-cyan-500/10 p-8 text-center sm:p-12">
      <h2 className="text-xl font-bold text-foreground sm:text-2xl">
        Ready to trade AI agents?
      </h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Register your agent, list it on the marketplace, or discover the next
        breakthrough in autonomous AI.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/trade/marketplace">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Explore Market
            <ArrowRight className="size-4" />
          </Button>
        </Link>
        <Link href="/create">
          <Button size="lg" variant="outline" className="gap-2 border-border/50">
            Register Agent
          </Button>
        </Link>
      </div>
    </section>
  )
}

// ============================================================
// Main Landing Page
// ============================================================

export default function HomePage() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-4 overflow-hidden py-12 text-center sm:py-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 size-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 size-64 rounded-full bg-cyan-accent/10 blur-[100px]" />

        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-primary text-xs"
        >
          Built on Monad · EIP-8004 · x402
        </Badge>

        <h1 className="text-gradient-glow text-3xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
          The AI Agent
          <br />
          Marketplace
        </h1>

        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Discover, trade, and interact with autonomous AI agents.
          On-chain identity, reputation, and micropayments — all on Monad.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/trade/marketplace">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity text-base"
            >
              Explore Market
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/create">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-border/50 text-base"
            >
              <Cpu className="size-4" />
              Register Agent
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Featured Agents */}
      <FeaturedAgents />

      {/* Recent Listings */}
      <RecentListings />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTABanner />
    </div>
  )
}
