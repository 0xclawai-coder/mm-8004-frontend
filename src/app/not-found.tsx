import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative pb-6">
        <span className="text-8xl font-extrabold text-gradient-glow sm:text-9xl">404</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          Page Not Found
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-8">
        <Link href="/">
          <Button className="gap-2">
            <Home className="size-4" />
            Go Home
          </Button>
        </Link>
        <Link href="/explore/agents">
          <Button variant="outline" className="gap-2 border-border/50">
            <Search className="size-4" />
            Browse Directory
          </Button>
        </Link>
      </div>
    </div>
  )
}
