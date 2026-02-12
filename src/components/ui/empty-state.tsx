import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16',
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border/50 bg-card/60">
        <Icon className="size-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-xs text-center text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Link href={action.href} className="mt-4">
          <Button size="sm" variant="outline" className="border-border/50">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}
