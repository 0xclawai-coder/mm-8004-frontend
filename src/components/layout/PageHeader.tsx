interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  children,
}: PageHeaderProps) {
  return (
    <div className="relative pb-6">
      {/* Content */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 items-center gap-2">{children}</div>
        )}
      </div>

      {/* Gradient glow decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="mx-auto h-[2px] w-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm" />
      </div>
    </div>
  )
}
