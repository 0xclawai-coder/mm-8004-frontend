import { Gavel } from 'lucide-react'

export default function AuctionsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="rounded-2xl border border-border/50 bg-card/60 p-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Gavel className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Auctions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Live & Upcoming Auctions — Coming Soon
        </p>
      </div>
    </div>
  )
}
