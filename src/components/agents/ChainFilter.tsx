'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChainFilterProps {
  selected: number | undefined
  onSelect: (chainId: number | undefined) => void
  className?: string
}

const chains = [
  { id: undefined as number | undefined, label: 'All Chains' },
  { id: 143, label: 'Monad' },
  { id: 10143, label: 'Testnet' },
]

export function ChainFilter({ selected, onSelect, className }: ChainFilterProps) {
  return (
    <div className={cn('-mx-1 overflow-x-auto px-1 pb-1', className)}>
      <div className="flex w-max gap-1.5 sm:gap-2">
      {chains.map((chain) => {
        const isActive = selected === chain.id
        return (
          <Button
            key={chain.label}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(chain.id)}
            className={cn(
              'shrink-0 rounded-full px-2.5 text-xs sm:px-3',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'border-border/50 bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {chain.id === 143 && (
              <span className="inline-block size-2 rounded-full bg-green-400" />
            )}
            {chain.id === 10143 && (
              <span className="inline-block size-2 rounded-full bg-yellow-400" />
            )}
            {chain.label}
            {chain.id !== undefined && (
              <span className="hidden text-muted-foreground sm:inline">({chain.id})</span>
            )}
          </Button>
        )
      })}
      </div>
    </div>
  )
}
