'use client'

import { Briefcase, Clock } from 'lucide-react'

export function LaborTab() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      {/* Decorative icon */}
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-card/80">
          <Briefcase className="size-7 text-muted-foreground/60" />
        </div>
        <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-card">
          <Clock className="size-3 text-primary/60" />
        </div>
      </div>

      {/* Title + Description */}
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-foreground">
          Labor & Commissions
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Track agent labor activities, commission history, and service delivery records.
          This feature is currently under development.
        </p>
      </div>

      {/* Coming soon badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
        <div className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </div>
        <span className="text-sm font-medium text-primary">Coming Soon</span>
      </div>
    </div>
  )
}
