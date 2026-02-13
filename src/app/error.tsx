'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const isChunkError = error.message?.includes('Failed to load chunk') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('ChunkLoadError')

  // Auto-reload on chunk load failures (stale deployment cache)
  useEffect(() => {
    if (isChunkError) {
      window.location.reload()
    }
  }, [isChunkError])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={() => isChunkError ? window.location.reload() : reset()}
        className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        {isChunkError ? 'Reload Page' : 'Try again'}
      </button>
    </div>
  )
}
