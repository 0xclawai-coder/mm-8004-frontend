import { Skeleton } from '@/components/ui/skeleton'

export default function RankingsLoading() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="relative pb-6 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
        <Skeleton className="h-8 w-full max-w-lg rounded-lg" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/40">
        <div className="space-y-0 divide-y divide-border/30">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
              <Skeleton className="ml-auto h-4 w-10" />
              <Skeleton className="hidden h-4 w-8 sm:block" />
              <Skeleton className="hidden h-5 w-10 rounded-full lg:block" />
              <Skeleton className="hidden h-5 w-16 rounded-full lg:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
