'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const categories = ['All', 'Legal', 'Design', 'Trading', 'DeFi', 'Arbitrage', 'Other']

interface CategoryFilterProps {
  selected: string
  onSelect: (category: string) => void
  className?: string
}

export function CategoryFilter({ selected, onSelect, className }: CategoryFilterProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((category) => {
        const isActive = selected === category || (category === 'All' && !selected)
        return (
          <Button
            key={category}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(category === 'All' ? '' : category)}
            className={cn(
              'shrink-0 rounded-full text-xs',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'border-border/50 bg-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground'
            )}
          >
            {category}
          </Button>
        )
      })}
      </div>
      {/* Scroll fade indicator */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
    </div>
  )
}
