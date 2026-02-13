import {
  ShoppingCart,
  Gavel,
  Package,
  Search,
  Activity,
  BarChart3,
  Trophy,
  TrendingUp,
  PlusCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  subtitle: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Directory',
    items: [
      {
        href: '/explore/agents',
        label: 'Entities',
        subtitle: 'Browse Incorporated Agents',
        icon: Search,
      },
      {
        href: '/explore/activity',
        label: 'Feed',
        subtitle: 'On-chain Activity Feed',
        icon: Activity,
      },
      {
        href: '/create',
        label: 'Incorporate',
        subtitle: 'Register Agent DID',
        icon: PlusCircle,
      },
    ],
  },
  {
    label: 'M&A',
    items: [
      {
        href: '/trade/marketplace',
        label: 'Deals',
        subtitle: 'Agents Open for Acquisition',
        icon: ShoppingCart,
      },
      {
        href: '/trade/auctions',
        label: 'Live Rounds',
        subtitle: 'Competitive Acquisition Rounds',
        icon: Gavel,
      },
      {
        href: '/trade/bundles',
        label: 'Bundles',
        subtitle: 'Entity Bundles',
        icon: Package,
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        href: '/analytics/overview',
        label: 'Market Overview',
        subtitle: 'Deal Volume & Metrics',
        icon: BarChart3,
      },
      {
        href: '/analytics/leaderboard',
        label: 'Leaderboard',
        subtitle: 'Top Acquirers & Sellers',
        icon: Trophy,
      },
      {
        href: '/analytics/rankings',
        label: 'Entity Rankings',
        subtitle: 'By Track Record Score',
        icon: TrendingUp,
      },
    ],
  },
]
