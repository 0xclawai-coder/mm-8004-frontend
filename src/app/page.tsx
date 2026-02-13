'use client'

import Link from 'next/link'
import { AgentImage } from '@/components/ui/agent-image'
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
  Building2,
  BarChart3,
  Handshake,
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
    { label: 'Incorporated Entities', value: stats?.total_agents ?? 0, icon: <Users className="size-4" />, href: '/explore/agents' },
    { label: 'Open Deals', value: mStats?.active_listings ?? 0, icon: <ShoppingBag className="size-4" />, href: '/trade/marketplace' },
    { label: 'Acquisitions Completed', value: totalSales, icon: <TrendingUp className="size-4" />, href: '/analytics/overview' },
    { label: 'Live Rounds', value: mStats?.active_auctions ?? 0, icon: <Gavel className="size-4" />, href: '/trade/auctions' },
    { label: 'Track Records', value: stats?.total_feedbacks ?? 0, icon: <MessageSquare className="size-4" />, href: '/analytics/overview' },
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
// Featured Agents (Top Rated Entities)
// ============================================================

function FeaturedAgents() {
  const { data, isLoading } = useAgents({ sort: 'score', limit: 6 })
  const agents = data?.agents ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Top Rated Entities</h2>
        <Link
          href="/explore/agents"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Directory <ArrowRight className="size-3.5" />
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
// Recent M&A Activity
// ============================================================

function RecentListings() {
  const { data, isLoading } = useListings({ sort: 'recent', limit: 6 })
  const listings = data?.listings ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Recent M&A Activity</h2>
        <Link
          href="/trade/marketplace"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View Deals <ArrowRight className="size-3.5" />
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
                  <div className="relative aspect-square w-full">
                    <AgentImage
                      src={listing.agent_image}
                      alt={listing.agent_name || `Agent #${listing.token_id}`}
                      fallbackText={listing.agent_name}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  </div>
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
// Features Section — 3 Pillars: Incorporate / Track Record / M&A
// ============================================================

const features = [
  {
    icon: <Building2 className="size-6" />,
    title: 'Incorporate',
    subtitle: 'Day 0 — On-chain Identity',
    description:
      'Issue an ERC-8004 identity for your agent. Like registering a company — name, capabilities, and endpoints, all on-chain and verifiable.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    analogy: 'Web2: Company Registration → Web3: Agent DID',
  },
  {
    icon: <BarChart3 className="size-6" />,
    title: 'Track Record',
    subtitle: 'Build Reputation Over Time',
    description:
      'Every interaction, payment, and feedback builds an immutable track record. Trust is earned on-chain, not claimed in a pitch deck.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    analogy: 'Web2: Credit Score → Web3: On-chain Reputation',
  },
  {
    icon: <Handshake className="size-6" />,
    title: 'M&A',
    subtitle: 'Liquidity & Exit',
    description:
      'List for acquisition, run competitive rounds, or bundle entities. The first real exit path for AI agents — marketplace liquidity on Monad.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    analogy: 'Web2: M&A Advisory → Web3: On-chain Deal Room',
  },
]

function FeaturesSection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          The Full Lifecycle
        </h2>
        <p className="text-sm text-muted-foreground">
          From incorporation to acquisition — everything your agent needs
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <p className="text-[10px] text-primary/60 italic">
                {f.analogy}
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
        Ready to incorporate your agent?
      </h2>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Issue an on-chain identity, build a track record, and unlock the first real exit path for AI agents.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/create">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Incorporate Your Agent
            <ArrowRight className="size-4" />
          </Button>
        </Link>
        <Link href="/explore/agents">
          <Button size="lg" variant="outline" className="gap-2 border-border/50">
            Browse Directory
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
      <section className="relative py-10 sm:py-16 lg:py-20">

        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Text */}
          <div className="flex flex-col gap-5 text-center lg:text-left">
            <Badge
              variant="outline"
              className="w-fit mx-auto lg:mx-0 border-primary/30 bg-primary/10 text-primary text-xs"
            >
              Built on Monad · EIP-8004 · x402
            </Badge>

            <h1 className="text-gradient-glow text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Incorporate,{' '}
              <br className="hidden sm:block" />
              Build Track{' '}
              <br className="hidden sm:block" />
              Record, Exit
            </h1>

            <p className="max-w-md mx-auto lg:mx-0 text-sm text-muted-foreground sm:text-base">
              The full lifecycle infrastructure for AI agents —
              <br className="hidden sm:block" />
              from Day 0 to acquisition.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link href="/create">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity text-base"
                >
                  Incorporate Your Agent
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/explore/agents">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-border/50 text-base"
                >
                  Browse Directory
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Hero Video */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px] aspect-[5/4]">
              <video
                src="/hero-video.webm"
                autoPlay
                loop
                muted
                playsInline
                className="size-full rounded-2xl object-cover"
              />
            </div>
          </div>
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
