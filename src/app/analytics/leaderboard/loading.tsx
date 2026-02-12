import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="space-y-8">
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

      {/* Filters */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-full max-w-md rounded-lg" />
        <Skeleton className="h-8 w-full max-w-lg rounded-lg" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50">
        <div className="space-y-0 divide-y divide-border/30">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
              </div>
              <Skeleton className="hidden h-5 w-14 rounded-full sm:block" />
              <Skeleton className="ml-auto h-4 w-10" />
              <Skeleton className="hidden h-4 w-8 md:block" />
              <Skeleton className="hidden h-5 w-16 rounded-full lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
