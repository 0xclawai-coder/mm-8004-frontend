'use client'

import { useState, useMemo } from 'react'
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Globe, ExternalLink, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import { RatingChart } from '@/components/agents/RatingChart'
import { useAgentActivity } from '@/hooks/useAgentActivity'
import type { AgentDetail, Activity } from '@/types'

interface OverviewTabProps {
  agent: AgentDetail
  agentId: string
  chainId: number
  agentNumericId: string
  onSwitchToFeedback?: () => void
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function getScoreBg(score: number): string {
  if (score >= 70) return 'border-green-500/30 bg-green-500/10'
  if (score >= 40) return 'border-yellow-500/30 bg-yellow-500/10'
  return 'border-red-500/30 bg-red-500/10'
}


function getExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${txHash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${txHash}`
  return `#`
}

function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address || ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function StatCard({
  icon,
  label,
  value,
  colorClass,
  borderClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  colorClass: string
  borderClass: string
}) {
  return (
    <div className={cn('rounded-lg border p-4 text-center', borderClass)}>
      <div className={cn('mx-auto mb-2 flex size-8 items-center justify-center rounded-lg', borderClass)}>
        {icon}
      </div>
      <p className={cn('text-xl font-bold tabular-nums', colorClass)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function FeedbackPreview({ event, chainId }: { event: Activity; chainId: number }) {
  const data = event.event_data || {}
  const clientAddress = (data.client ?? data.client_address) as string | undefined
  const value = data.value as number | undefined
  const valueDecimals = (data.valueDecimals ?? data.value_decimals ?? 0) as number
  const tag1 = data.tag1 as string | undefined

  // Apply decimal correction
  const displayValue = value !== undefined
    ? value / Math.pow(10, valueDecimals)
    : undefined

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-card/40 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/20">
          <MessageSquare className="size-3.5 text-violet-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {clientAddress && (
              <a
                href={getExplorerUrl(chainId, event.tx_hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary/70 hover:text-primary transition-colors"
              >
                {truncateAddress(clientAddress)}
                <ExternalLink className="ml-1 inline size-2.5" />
              </a>
            )}
            <span className="text-xs text-muted-foreground"><TimeCounter targetTime={new Date(event.block_timestamp)} /></span>
          </div>
          {tag1 && (
            <Badge variant="secondary" className="mt-1 text-[10px] bg-primary/10 text-primary border-primary/20">
              {tag1}
            </Badge>
          )}
        </div>
      </div>
      {displayValue !== undefined && (
        <div className={cn(
          'shrink-0 rounded-lg border px-3 py-1.5 text-center',
          getScoreBg(displayValue),
        )}>
          <span className={cn('text-lg font-bold tabular-nums', getScoreColor(displayValue))}>
            {Number.isInteger(displayValue) ? displayValue : displayValue.toFixed(1)}
          </span>
          {tag1 && (
            <span className="ml-1 text-[10px] text-muted-foreground">{tag1}</span>
          )}
        </div>
      )}
    </div>
  )
}

const SCALE_LABELS: Record<string, string> = {
  all: 'All',
  percentage: '0~100',
  elo: 'ELO',
  boolean: 'Boolean',
  raw: 'Raw',
}

export function OverviewTab({ agent, agentId, chainId, agentNumericId, onSwitchToFeedback }: OverviewTabProps) {
  const [scaleFilter, setScaleFilter] = useState('all')

  const { data: reputationData } = useAgentActivity(agentId, {
    event_type: 'reputation',
    limit: 3,
  })

  const recentFeedbacks = reputationData?.activities || []
  const endpoints = agent.metadata?.endpoints || []

  // Available scale types from scores
  const availableScales = useMemo(() => {
    if (!agent.scores) return []
    const scales = [...new Set(agent.scores.map((s) => s.scale))]
    return scales
  }, [agent.scores])

  // Filtered scores
  const filteredScores = useMemo(() => {
    if (!agent.scores) return []
    if (scaleFilter === 'all') return agent.scores
    return agent.scores.filter((s) => s.scale === scaleFilter)
  }, [agent.scores, scaleFilter])

  return (
    <div className="space-y-6 py-4">
      {/* Statistics Overview */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Statistics Overview</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Star className={cn('size-4', getScoreColor(agent.reputation_score ?? 0))} />}
            label="Average Score"
            value={(agent.reputation_score ?? 0).toFixed(1)}
            colorClass={getScoreColor(agent.reputation_score ?? 0)}
            borderClass={getScoreBg(agent.reputation_score ?? 0)}
          />
          <StatCard
            icon={<MessageSquare className="size-4 text-blue-400" />}
            label="Total Feedback"
            value={agent.feedback_count}
            colorClass="text-foreground"
            borderClass="border-blue-500/30 bg-blue-500/10"
          />
          <StatCard
            icon={<ThumbsUp className="size-4 text-green-400" />}
            label="Positive"
            value={agent.positive_feedback_count ?? 0}
            colorClass="text-green-400"
            borderClass="border-green-500/30 bg-green-500/10"
          />
          <StatCard
            icon={<ThumbsDown className="size-4 text-red-400" />}
            label="Negative"
            value={agent.negative_feedback_count ?? 0}
            colorClass="text-red-400"
            borderClass="border-red-500/30 bg-red-500/10"
          />
        </div>
      </div>

      {/* Scores by Tag */}
      {agent.scores && agent.scores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Scores by Tag</h3>
            </div>
            {availableScales.length > 1 && (
              <div className="flex items-center gap-1">
                {['all', ...availableScales].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setScaleFilter(scale)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                      scaleFilter === scale
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    {SCALE_LABELS[scale] ?? scale}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filteredScores.map((s) => (
              <div
                key={s.score_type}
                className={cn(
                  'rounded-lg border p-3',
                  s.scale === 'percentage' ? getScoreBg(s.value) : 'border-border/50 bg-card/60',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'text-lg font-bold tabular-nums',
                    s.scale === 'percentage' ? getScoreColor(s.value) : 'text-foreground',
                  )}>
                    {Number.isInteger(s.value) ? s.value : s.value.toFixed(1)}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    {SCALE_LABELS[s.scale] ?? s.scale}
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-medium text-foreground">{s.score_type}</p>
                <div className="flex items-center justify-between mt-0.5">
                  {s.label && (
                    <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                  )}
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {s.count}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reputation Chart */}
      <RatingChart agentId={agentNumericId} chainId={chainId} />

      {/* Services */}
      {endpoints.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Services</h3>
          </div>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/40 px-4 py-3"
              >
                <Badge
                  variant="outline"
                  className="shrink-0 text-[10px] font-mono uppercase border-primary/30 bg-primary/10 text-primary"
                >
                  {ep.protocol || 'HTTP'}
                </Badge>
                <a
                  href={ep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate font-mono text-xs text-foreground/80 hover:text-primary transition-colors"
                >
                  {ep.url}
                  <ExternalLink className="ml-1 inline size-2.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Feedback */}
      {recentFeedbacks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Feedback
            </h3>
            {onSwitchToFeedback && agent.feedback_count > 3 && (
              <button
                onClick={onSwitchToFeedback}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View all ({agent.feedback_count})
              </button>
            )}
          </div>
          <div className="space-y-2">
            {recentFeedbacks.map((event) => (
              <FeedbackPreview key={event.id} event={event} chainId={chainId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
