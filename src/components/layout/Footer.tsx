import Link from 'next/link'
import { MoltLogo } from '@/components/layout/MoltLogo'
import { Separator } from '@/components/ui/separator'

const footerLinks = [
  {
    title: 'Directory',
    links: [
      { label: 'Entities', href: '/explore/agents' },
      { label: 'Deals', href: '/trade/marketplace' },
      { label: 'Live Rounds', href: '/trade/auctions' },
      { label: 'Incorporate', href: '/create' },
    ],
  },
  {
    title: 'Intelligence',
    links: [
      { label: 'Market Overview', href: '/analytics/overview' },
      { label: 'Leaderboard', href: '/analytics/leaderboard' },
      { label: 'Entity Rankings', href: '/analytics/rankings' },
      { label: 'Feed', href: '/explore/activity' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'EIP-8004 Spec', href: 'https://eips.ethereum.org/EIPS/eip-8004', external: true },
      { label: 'x402 Protocol', href: 'https://www.x402.org', external: true },
      { label: 'Monad', href: 'https://www.monad.xyz', external: true },
      { label: 'Documentation', href: '#' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Twitter', href: 'https://twitter.com/molt_lab', external: true },
      { label: 'Discord', href: '#', external: true },
      { label: 'GitHub', href: 'https://github.com/molt-lab', external: true },
      { label: 'Blog', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <Separator className="opacity-50" />
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Grid */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerLinks.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <MoltLogo size={20} />
            <span className="text-gradient-violet text-sm font-extrabold uppercase tracking-wider">
              MOLT
            </span>
            <span className="text-xs text-muted-foreground">
              · Built on Monad
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Molt Lab. The M&A Infrastructure for AI Agents.
          </p>
        </div>
      </div>
    </footer>
  )
}
