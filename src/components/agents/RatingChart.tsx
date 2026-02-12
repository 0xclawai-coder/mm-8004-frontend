'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAgentReputation } from '@/hooks/useAgent'
import type { ReputationRange, ReputationHistoryPoint } from '@/types'

interface RatingChartProps {
  agentId: string
  chainId: number
}

const RANGES: { label: string; value: ReputationRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ReputationHistoryPoint
  }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/50 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">
        {new Date(data.date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-foreground">
          {data.score.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">
          ({data.feedback_count} feedback{data.feedback_count !== 1 ? 's' : ''})
        </span>
      </div>
    </div>
  )
}

export function RatingChart({ agentId, chainId }: RatingChartProps) {
  const id = `${chainId}-${agentId}`
  const [range, setRange] = useState<ReputationRange>('30d')
  const { data, isLoading, error } = useAgentReputation(id, range)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
          <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/50 p-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-10 rounded-md" />
            ))}
          </div>
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-6">
        <p className="text-sm text-muted-foreground">
          Failed to load reputation chart.
        </p>
      </div>
    )
  }

  const history = data?.history || []

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card/60 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Reputation Over Time
          </h3>
          {data?.current_score != null && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {data.current_score.toFixed(2)}
            </span>
          )}
        </div>

        {/* Range selector */}
        <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/50 p-0.5">
          {RANGES.map((r) => (
            <Button
              key={r.value}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 px-3 text-xs font-medium',
                range === r.value
                  ? 'bg-primary/20 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {history.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available for this range.</p>
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="oklch(0.25 0.04 280 / 0.4)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                stroke="oklch(0.50 0.02 280)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="oklch(0.50 0.02 280)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-4}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: 'oklch(0.62 0.22 285 / 0.3)',
                  strokeDasharray: '4 4',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="oklch(0.62 0.22 285)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'oklch(0.62 0.22 285)',
                  stroke: 'oklch(0.17 0.035 280)',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
