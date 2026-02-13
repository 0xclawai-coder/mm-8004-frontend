import { cn } from '@/lib/utils'

interface MoltisLogoProps {
  size?: number
  className?: string
}

export function MoltisLogo({ size = 28, className }: MoltisLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="moltis-logo-bg"
          x1="3"
          y1="3"
          x2="29"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient
          id="moltis-logo-shine"
          x1="16"
          y1="0"
          x2="16"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Hexagon background */}
      <path
        d="M16 2.5L27.8 9.25V22.75L16 29.5L4.2 22.75V9.25L16 2.5Z"
        fill="url(#moltis-logo-bg)"
      />

      {/* Top shine overlay */}
      <path
        d="M16 2.5L27.8 9.25V22.75L16 29.5L4.2 22.75V9.25L16 2.5Z"
        fill="url(#moltis-logo-shine)"
      />

      {/* M monogram */}
      <path
        d="M10.5 22V11L16 16.5L21.5 11V22"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
