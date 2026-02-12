'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, ExternalLink, Link2, Shield, CircleDot, Hash, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import TimeCounter from '@/components/ui/time-counter'
import type { AgentDetail } from '@/types'

interface BasicInfoPanelProps {
  agent: AgentDetail
}

function getExplorerUrl(chainId: number, address: string): string {
  if (chainId === 143) return `https://monadexplorer.com/address/${address}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/address/${address}`
  return `#`
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

function truncateAddress(address: string): string {
  if (!address || address.length < 12) return address || ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function CopyableValue({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [value])

  return (
    <button
      onClick={handleCopy}
      className={cn('inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors', className)}
      title="Copy"
    >
      {copied ? <Check className="size-3 text-green-400" /> : <Copy className="size-3" />}
    </button>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="shrink-0 text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  )
}

export function BasicInfoPanel({ agent }: BasicInfoPanelProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-1">
      <h3 className="text-base font-semibold text-foreground pb-2">Basic Information</h3>

      {/* Contract State */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 pb-2">
          <Link2 className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contract State</span>
        </div>
        <div className="divide-y divide-border/30">
          <InfoRow label="Agent ID">
            <div className="flex items-center gap-1.5">
              <Hash className="size-3 text-muted-foreground" />
              <span className="font-mono text-sm text-foreground">{agent.agent_id}</span>
            </div>
          </InfoRow>

          <InfoRow label="Chain">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                agent.chain_id === 143
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              )}
            >
              {getChainLabel(agent.chain_id)}
            </Badge>
          </InfoRow>

          <InfoRow label="Owner">
            <div className="flex items-center gap-1.5">
              <a
                href={getExplorerUrl(agent.chain_id, agent.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary/80 hover:text-primary transition-colors"
              >
                {truncateAddress(agent.owner)}
                <ExternalLink className="ml-1 inline size-2.5" />
              </a>
              <CopyableValue value={agent.owner} />
            </div>
          </InfoRow>

          <InfoRow label="x402">
            {agent.x402_support ? (
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] gap-1">
                <Shield className="size-2.5" />
                Supported
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">No</span>
            )}
          </InfoRow>

          <InfoRow label="Status">
            <div className="flex items-center gap-1.5">
              <CircleDot className={cn('size-3', agent.active ? 'text-green-400' : 'text-red-400')} />
              <span className={cn('text-xs font-medium', agent.active ? 'text-green-400' : 'text-red-400')}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </InfoRow>
        </div>
      </div>

      {/* Off-chain Metadata */}
      <div className="space-y-0.5 pt-3">
        <div className="flex items-center gap-2 pb-2">
          <Layers className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Off-chain Metadata</span>
        </div>
        <div className="divide-y divide-border/30">
          {agent.uri && (
            <InfoRow label="Agent URI">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-foreground/80 truncate max-w-[160px]">
                  {agent.uri.length > 24 ? `${agent.uri.slice(0, 12)}...${agent.uri.slice(-8)}` : agent.uri}
                </span>
                <CopyableValue value={agent.uri} />
              </div>
            </InfoRow>
          )}

          {agent.categories && agent.categories.length > 0 && (
            <InfoRow label="Categories">
              <div className="flex flex-wrap justify-end gap-1">
                {agent.categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {cat}
                  </Badge>
                ))}
              </div>
            </InfoRow>
          )}

          <InfoRow label="Created">
            <span className="text-xs text-foreground/80"><TimeCounter targetTime={new Date(agent.block_timestamp)} /></span>
          </InfoRow>
        </div>
      </div>
    </div>
  )
}
