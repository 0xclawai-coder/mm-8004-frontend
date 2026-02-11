'use client'

import { useAccount, useSwitchChain } from 'wagmi'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { monadMainnet, monadTestnet } from '@/lib/chains'

const chains = [
  { chain: monadMainnet, color: 'bg-green-400' },
  { chain: monadTestnet, color: 'bg-yellow-400' },
]

export function ChainSwitcher() {
  const { chain, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  if (!isConnected) return null

  const currentChain = chains.find((c) => c.chain.id === chain?.id)
  const dotColor = currentChain?.color || 'bg-gray-400'
  const chainName = chain?.name || 'Unknown'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-xs sm:flex"
        >
          <span className={cn('inline-block size-2 rounded-full', dotColor)} />
          {chainName}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {chains.map(({ chain: c, color }) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => switchChain({ chainId: c.id })}
            className={cn(
              'cursor-pointer gap-2',
              chain?.id === c.id && 'bg-accent'
            )}
          >
            <span className={cn('inline-block size-2 rounded-full', color)} />
            <span className="text-sm">{c.name}</span>
            {chain?.id === c.id && (
              <span className="ml-auto text-[10px] text-muted-foreground">current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
