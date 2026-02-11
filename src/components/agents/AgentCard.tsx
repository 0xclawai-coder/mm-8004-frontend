'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

interface AgentCardProps {
  agent: Agent
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

export function AgentCard({ agent }: AgentCardProps) {
  const agentPath = `/explore/agents/${agent.chain_id}-${agent.agent_id}`

  return (
    <Link href={agentPath} className="group block">
      <Card className="relative overflow-hidden border-border/50 bg-card/80 py-0 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/30 group-hover:glow-violet">
        <CardContent className="flex flex-col gap-4 p-5">
          {/* Top row: Avatar + Name + Description */}
          <div className="flex items-start gap-3">
            <Avatar className="size-12 shrink-0 ring-2 ring-border">
              <AvatarImage src={agent.image ?? undefined} alt={agent.name ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {agent.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-foreground">
                {agent.name || `Agent #${agent.agent_id}`}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {agent.description || 'No description available'}
              </p>
            </div>
          </div>

          {/* Category tags */}
          {agent.categories && agent.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agent.categories.slice(0, 3).map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                >
                  {category}
                </Badge>
              ))}
              {agent.categories.length > 3 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{agent.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Bottom row: Score + Feedbacks + Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Reputation score */}
              <div className="flex items-center gap-1">
                <Star className={cn('size-3.5', getScoreColor(agent.reputation_score ?? 0))} />
                <span className={cn('text-sm font-semibold', getScoreColor(agent.reputation_score ?? 0))}>
                  {(agent.reputation_score ?? 0).toFixed(1)}
                </span>
              </div>
              {/* Feedback count */}
              <span className="text-xs text-muted-foreground">
                {agent.feedback_count} feedback{agent.feedback_count !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* x402 badge */}
              {agent.x402_support && (
                <Badge
                  variant="outline"
                  className="border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent text-[10px] px-1.5"
                >
                  x402
                </Badge>
              )}
              {/* Chain badge */}
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
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
