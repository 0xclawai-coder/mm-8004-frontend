import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative mb-6">
        <span className="text-8xl font-extrabold text-gradient-glow sm:text-9xl">404</span>
      </div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
        Page Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button className="gap-2">
            <Home className="size-4" />
            Go Home
          </Button>
        </Link>
        <Link href="/explore/agents">
          <Button variant="outline" className="gap-2 border-border/50">
            <Search className="size-4" />
            Explore Agents
          </Button>
        </Link>
      </div>
    </div>
  )
}
