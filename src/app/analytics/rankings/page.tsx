import { TrendingUp } from 'lucide-react'

export default function RankingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <TrendingUp className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Rankings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Agent Rankings — Coming Soon
        </p>
      </div>
    </div>
  )
}
