import { Skeleton } from '@/components/ui/skeleton'

export default function MarketplaceLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative pb-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <Skeleton className="h-8 w-full max-w-md rounded-lg" />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40">
        <div className="space-y-0 divide-y divide-border/30">
          <div className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20" />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-6" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="hidden h-3 w-24 md:block" />
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="hidden h-5 w-14 rounded-full sm:block" />
              <Skeleton className="hidden h-3 w-16 lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
