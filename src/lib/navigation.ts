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
    label: 'Trade',
    items: [
      {
        href: '/trade/marketplace',
        label: 'Marketplace',
        subtitle: 'Buy and Sell AI Agents',
        icon: ShoppingCart,
      },
      {
        href: '/trade/auctions',
        label: 'Auctions',
        subtitle: 'Live & Upcoming Auctions',
        icon: Gavel,
      },
      {
        href: '/trade/bundles',
        label: 'Bundles',
        subtitle: 'Agent Bundles',
        icon: Package,
      },
    ],
  },
  {
    label: 'Explorer',
    items: [
      {
        href: '/explore/agents',
        label: 'Agents',
        subtitle: 'Browse AI Agents',
        icon: Search,
      },
      {
        href: '/explore/activity',
        label: 'Activity',
        subtitle: 'Recent Transactions',
        icon: Activity,
      },
      {
        href: '/create',
        label: 'Create Molt',
        subtitle: 'Register New Agent',
        icon: PlusCircle,
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        href: '/analytics/overview',
        label: 'Overview',
        subtitle: 'Marketplace Stats',
        icon: BarChart3,
      },
      {
        href: '/analytics/leaderboard',
        label: 'Top Wallets',
        subtitle: 'Wallet Trading Leaderboard',
        icon: Trophy,
      },
      {
        href: '/analytics/rankings',
        label: 'Agent Rankings',
        subtitle: 'Agents by Reputation Score',
        icon: TrendingUp,
      },
    ],
  },
]
