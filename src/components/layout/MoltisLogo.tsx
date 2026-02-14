import { cn } from '@/lib/utils'

interface MoltisLogoProps {
  size?: number
  className?: string
}

export function MoltisLogo({ size = 28, className }: MoltisLogoProps) {
  return (
    <img
      src="/moltis-logo.png"
      alt="Moltis"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
