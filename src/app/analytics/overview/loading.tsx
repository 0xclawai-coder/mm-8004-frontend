import { Skeleton } from '@/components/ui/skeleton'

export default function OverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative pb-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/60 p-4">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Category card */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Chain card */}
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}
