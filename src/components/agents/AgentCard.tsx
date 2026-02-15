'use client'

import Link from 'next/link'
import { Star, Bot } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import type { Agent } from '@/types'

interface AgentCardProps {
  agent: Agent | null
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

import { getChainLabel } from '@/lib/chain-utils'

export function AgentCard({ agent }: AgentCardProps) {
  const agentPath = agent ? `/explore/agents/${agent.chain_id}/${agent.agent_id}` : '#'

  const content = (
    <Card className={cn(
      'relative h-full overflow-hidden border-border/50 bg-card/80 py-0 transition-all duration-300',
      agent && 'group-hover:scale-[1.02] group-hover:border-primary/30 group-hover:glow-violet'
    )}>
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Top row: Avatar + Name + Description + Created */}
        <div className="flex items-start gap-3">
          {agent ? (
            <Avatar className="size-12 shrink-0 ring-2 ring-border">
              <AvatarImage src={agent.image ?? undefined} alt={agent.name ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/20 text-primary text-sm font-semibold">
                {agent.name ? agent.name.charAt(0).toUpperCase() : <Bot className="size-5 text-primary/60" />}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Skeleton className="size-12 shrink-0 rounded-full" />
          )}
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              {agent ? (
                <h3 className="truncate text-sm font-bold text-foreground">
                  {agent.name || `Agent #${agent.agent_id}`}
                </h3>
              ) : (
                <Skeleton className="h-4 w-28" />
              )}
              {agent ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  <TimeCounter targetTime={new Date(agent.block_timestamp)} />
                </span>
              ) : (
                <Skeleton className="h-3 w-12 shrink-0" />
              )}
            </div>
            {/* Always reserve min-h-8 for description area to prevent layout shift */}
            <div className="min-h-8">
              {agent ? (
                agent.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {agent.description}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {agent.categories && agent.categories.length > 0 ? (
                      agent.categories.slice(0, 2).map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                        >
                          {category}
                        </Badge>
                      ))
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5',
                          agent.chain_id === 143
                            ? 'border-green-500/30 bg-green-500/10 text-green-400'
                            : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                        )}
                      >
                        {getChainLabel(agent.chain_id)}
                      </Badge>
                    )}
                  </div>
                )
              ) : (
                <Skeleton className="h-3 w-20" />
              )}
            </div>
          </div>
        </div>

        {/* Bottom row: Score + Feedbacks + Badges */}
        <div className="flex items-center justify-between">
          {agent ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Star className={cn('size-3.5', getScoreColor(agent.reputation_score ?? 0))} />
                  <span className={cn('text-sm font-semibold', getScoreColor(agent.reputation_score ?? 0))}>
                    {(agent.reputation_score ?? 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {agent.feedback_count} feedback{agent.feedback_count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {agent.x402_support && (
                  <Badge
                    variant="outline"
                    className="border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent text-[10px] px-1.5"
                  >
                    x402
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] px-1.5',
                    agent.chain_id === 143
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                  )}
                >
                  {getChainLabel(agent.chain_id)}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!agent) return content

  return (
    <Link href={agentPath} className="group block">
      {content}
    </Link>
  )
}
