import { Skeleton } from '@/components/ui/skeleton'

export default function AuctionsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="relative pb-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-52" />
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

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card/60">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="ml-auto h-3 w-12" />
                  <Skeleton className="ml-auto h-4 w-14" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
