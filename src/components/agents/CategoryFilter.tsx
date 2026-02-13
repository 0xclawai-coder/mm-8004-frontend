'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Based on actual DB categories (top 10 by count)
const categories = [
  'All',
  'DeFi',
  'Analytics',
  'Security',
  'Identity',
  'Trading',
  'AI',
  'Compute',
  'Gaming',
  'Social',
  'DAO',
]

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
        // API expects lowercase
        const value = category === 'All' ? '' : category.toLowerCase()
        return (
          <Button
            key={category}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(value)}
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
