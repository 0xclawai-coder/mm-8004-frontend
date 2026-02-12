'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { ChainSwitcher } from '@/components/wallet/ChainSwitcher'
import { MoltLogo } from '@/components/layout/MoltLogo'
import { navGroups } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const isGroupActive = (group: typeof navGroups[number]) =>
    group.items.some((item) => pathname.startsWith(item.href))

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="relative flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + Desktop Nav inline */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <MoltLogo size={28} />
            <span className="text-gradient-violet text-lg font-extrabold uppercase tracking-wider">
              MOLT
            </span>
          </Link>

          {/* Desktop Nav — inline next to logo */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              {navGroups.map((group) => {
                const active = isGroupActive(group)
                return (
                  <NavigationMenuItem key={group.label}>
                    <NavigationMenuTrigger
                      className={cn(
                        'h-8 bg-transparent px-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary rounded-full'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[280px] gap-1 p-2">
                        {group.items.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname.startsWith(item.href)
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className={cn(
                                  'flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-accent',
                                  isActive && 'bg-accent'
                                )}
                              >
                                <div className={cn(
                                  'flex size-8 shrink-0 items-center justify-center rounded-md',
                                  isActive
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  <Icon className="size-4" />
                                </div>
                                <div>
                                  <p className={cn(
                                    'text-sm font-medium',
                                    isActive ? 'text-primary' : 'text-foreground'
                                  )}>
                                    {item.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.subtitle}
                                  </p>
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: ChainSwitcher + Wallet + Mobile menu */}
        <div className="flex items-center gap-2">
          <ChainSwitcher />
          <ConnectButton />

          {/* Mobile hamburger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card">
              {/* Mobile logo */}
              <div className="flex items-center gap-2 px-4 pb-4 pt-2">
                <MoltLogo size={24} />
                <span className="text-gradient-violet text-lg font-extrabold uppercase tracking-wider">
                  MOLT
                </span>
              </div>

              <nav className="flex flex-col gap-1 px-2">
                {navGroups.map((group) => {
                  const isOpen = openSections[group.label] ?? isGroupActive(group)
                  return (
                    <div key={group.label}>
                      {/* Group toggle */}
                      <button
                        onClick={() => toggleSection(group.label)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-semibold transition-colors',
                          isGroupActive(group)
                            ? 'text-primary'
                            : 'text-foreground hover:bg-accent'
                        )}
                      >
                        {group.label}
                        <ChevronDown
                          className={cn(
                            'size-4 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>

                      {/* Collapsible items */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200',
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="flex flex-col gap-0.5 pb-2 pl-2">
                          {group.items.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.startsWith(item.href)
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSheetOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-colors',
                                  isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <Icon className="size-4" />
                                <div>
                                  <span className="font-medium">{item.label}</span>
                                  <p className="text-xs text-muted-foreground">
                                    {item.subtitle}
                                  </p>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </nav>

              {/* Mobile ChainSwitcher at bottom */}
              <div className="mt-auto border-t border-border px-4 pt-4">
                <ChainSwitcher />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Bottom gradient border line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </header>
  )
}
