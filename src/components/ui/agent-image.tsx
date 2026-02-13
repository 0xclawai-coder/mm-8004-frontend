'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface AgentImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  fallbackText?: string
}

/**
 * Image component with built-in fallback for agents.
 * Shows a gradient + first letter when src is missing or fails to load.
 */
export function AgentImage({
  src,
  alt,
  fill = true,
  className,
  sizes = '300px',
  fallbackText,
}: AgentImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    const letter = (fallbackText ?? alt)?.[0]?.toUpperCase() ?? '?'
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary/30 via-violet-dim/30 to-cyan-accent/20',
          fill ? 'size-full' : '',
          className
        )}
      >
        <span className="text-5xl font-bold text-primary/40 select-none">
          {letter}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={cn('object-cover', className)}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  )
}
