'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { toHex, parseEther } from 'viem'
import {
  Wallet,
  Edit3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  User,
  Plus,
  Tag,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { HoloCard } from '@/components/agents/HoloCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn, formatAddress } from '@/lib/utils'
import {
  CONTRACT_ADDRESSES,
  identityRegistryAbi,
  moltMarketplaceAbi,
  erc721ApproveAbi,
  NATIVE_TOKEN,
  type SupportedChainId,
} from '@/lib/contracts'
import type { Agent } from '@/types'

// ============================================================
// ERC721Enumerable partial ABI for on-chain querying
// ============================================================

const erc721EnumerableAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

import { getChainLabel, getExplorerTxUrl } from '@/lib/chain-utils'

// ============================================================
// Hook: fetch user's agents (try API first, then on-chain)
// ============================================================

function useUserAgents(address: string | undefined, chainId: number) {
  // Try API first
  const apiQuery = useQuery({
    queryKey: ['userAgents', address, chainId],
    enabled: !!address,
    queryFn: async (): Promise<Agent[]> => {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = new URL(`${apiBase}/agents`)
      url.searchParams.set('owner', address!)
      url.searchParams.set('limit', '100')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('API unavailable')
      const data = await res.json()
      return data.agents ?? []
    },
    retry: false,
  })

  // On-chain fallback: get balance
  const contractAddr = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.identityRegistry
  const { data: balance } = useReadContract({
    address: contractAddr,
    abi: erc721EnumerableAbi,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address && !!contractAddr && apiQuery.isError },
  })

  // Get token IDs by index
  const tokenCount = balance ? Number(balance) : 0
  const tokenIndexes = Array.from({ length: Math.min(tokenCount, 50) }, (_, i) => i)

  const { data: tokenResults } = useReadContracts({
    contracts: tokenIndexes.map((idx) => ({
      address: contractAddr!,
      abi: erc721EnumerableAbi,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [address as `0x${string}`, BigInt(idx)],
    })),
    query: { enabled: tokenCount > 0 && apiQuery.isError && !!contractAddr },
  })

  // Build agent list from on-chain data
  const onChainAgents: Agent[] = useMemo(() => {
    if (!tokenResults || !apiQuery.isError) return []
    return tokenResults
      .filter((r) => r.status === 'success' && r.result != null)
      .map((r, idx) => ({
        agent_id: Number(r.result),
        chain_id: chainId,
        owner: address || '',
        name: null,
        description: null,
        image: null,
        categories: null,
        x402_support: false,
        active: true,
        reputation_score: null,
        feedback_count: 0,
        block_timestamp: new Date().toISOString(),
      }))
  }, [tokenResults, apiQuery.isError, chainId, address])

  return {
    agents: apiQuery.isError ? onChainAgents : (apiQuery.data ?? []),
    isLoading: apiQuery.isLoading,
    isError: apiQuery.isError && tokenCount === 0,
  }
}

// ============================================================
// List for Sale Dialog
// ============================================================

const DURATION_OPTIONS = [
  { label: '1 Day', seconds: 86400 },
  { label: '3 Days', seconds: 259200 },
  { label: '7 Days', seconds: 604800 },
  { label: '30 Days', seconds: 2592000 },
] as const

interface ListForSaleDialogProps {
  agent: Agent
  chainId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ListForSaleDialog({ agent, chainId, open, onOpenChange }: ListForSaleDialogProps) {
  const [price, setPrice] = useState('')
  const [duration, setDuration] = useState(604800) // default 7 days
  const [step, setStep] = useState<'approve' | 'list' | 'done'>('approve')

  const identityAddr = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.identityRegistry
  const marketplaceAddr = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.moltMarketplace

  // Check if already approved
  const { data: approvedAddr, refetch: refetchApproval } = useReadContract({
    address: identityAddr,
    abi: erc721ApproveAbi,
    functionName: 'getApproved',
    args: [BigInt(agent.agent_id)],
    query: { enabled: !!identityAddr && open },
  })

  const isApproved = approvedAddr?.toString().toLowerCase() === marketplaceAddr?.toLowerCase()

  // Approve TX
  const {
    data: approveTxHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash })

  // Auto-advance to list step after approval
  useMemo(() => {
    if (isApproveConfirmed || isApproved) setStep('list')
  }, [isApproveConfirmed, isApproved])

  // List TX
  const {
    data: listTxHash,
    writeContract: writeList,
    isPending: isListPending,
    error: listError,
    reset: resetList,
  } = useWriteContract()

  const { isLoading: isListConfirming, isSuccess: isListConfirmed } =
    useWaitForTransactionReceipt({ hash: listTxHash })

  useMemo(() => {
    if (isListConfirmed) setStep('done')
  }, [isListConfirmed])

  const handleApprove = useCallback(() => {
    if (!identityAddr || !marketplaceAddr) return
    writeApprove({
      address: identityAddr,
      abi: erc721ApproveAbi,
      functionName: 'approve',
      args: [marketplaceAddr, BigInt(agent.agent_id)],
    })
  }, [identityAddr, marketplaceAddr, agent.agent_id, writeApprove])

  const handleList = useCallback(() => {
    if (!identityAddr || !marketplaceAddr || !price) return
    const expiry = BigInt(Math.floor(Date.now() / 1000) + duration)
    writeList({
      address: marketplaceAddr,
      abi: moltMarketplaceAbi,
      functionName: 'list',
      args: [identityAddr, BigInt(agent.agent_id), NATIVE_TOKEN, parseEther(price), expiry],
    })
  }, [identityAddr, marketplaceAddr, agent.agent_id, price, duration, writeList])

  const handleClose = useCallback(() => {
    resetApprove()
    resetList()
    setPrice('')
    setDuration(604800)
    setStep('approve')
    onOpenChange(false)
  }, [resetApprove, resetList, onOpenChange])

  const errorMessage = (approveError || listError)?.message?.slice(0, 200)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List for Sale</DialogTitle>
          <DialogDescription>
            List <span className="font-semibold">{agent.name || `Agent #${agent.agent_id}`}</span> on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Price (MON)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={step === 'done'}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration</label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setDuration(opt.seconds)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                    duration === opt.seconds
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 text-muted-foreground hover:border-primary/50'
                  )}
                  disabled={step === 'done'}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 text-xs">
            <div className={cn('flex items-center gap-1.5', step === 'approve' ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('size-5 rounded-full flex items-center justify-center text-[10px] font-bold', step === 'approve' ? 'bg-primary text-primary-foreground' : isApproved || isApproveConfirmed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground')}>
                {isApproved || isApproveConfirmed ? '✓' : '1'}
              </div>
              Approve
            </div>
            <div className="h-px flex-1 bg-border/50" />
            <div className={cn('flex items-center gap-1.5', step === 'list' ? 'text-primary' : step === 'done' ? 'text-green-500' : 'text-muted-foreground')}>
              <div className={cn('size-5 rounded-full flex items-center justify-center text-[10px] font-bold', step === 'list' ? 'bg-primary text-primary-foreground' : step === 'done' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground')}>
                {step === 'done' ? '✓' : '2'}
              </div>
              List
            </div>
          </div>

          {/* TX status */}
          {step === 'done' && listTxHash && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <CheckCircle2 className="size-4 text-green-400 shrink-0" />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-green-400">Listed Successfully!</p>
                <a
                  href={getExplorerTxUrl(chainId, listTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-primary hover:underline break-all"
                >
                  {listTxHash.slice(0, 20)}...
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <XCircle className="size-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive break-all">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 'done' ? 'Done' : 'Cancel'}
          </Button>
          {step !== 'done' && (
            <Button
              onClick={step === 'approve' && !isApproved ? handleApprove : handleList}
              disabled={
                (step === 'approve' && (isApprovePending || isApproveConfirming)) ||
                (step === 'list' && (isListPending || isListConfirming || !price || parseFloat(price) <= 0))
              }
              className="bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90"
            >
              {isApprovePending || isListPending ? 'Confirm in wallet...' :
               isApproveConfirming || isListConfirming ? 'Confirming...' :
               step === 'approve' && !isApproved ? 'Approve Marketplace' : 'List for Sale'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Edit Agent Dialog
// ============================================================

interface EditAgentDialogProps {
  agent: Agent
  chainId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditAgentDialog({ agent, chainId, open, onOpenChange }: EditAgentDialogProps) {
  const [newUri, setNewUri] = useState('')
  const [metaKey, setMetaKey] = useState('')
  const [metaValue, setMetaValue] = useState('')
  const [editMode, setEditMode] = useState<'uri' | 'metadata'>('uri')

  const contractAddr = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.identityRegistry

  const {
    data: txHash,
    writeContract,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash: txHash })

  const handleSetUri = useCallback(() => {
    if (!contractAddr || !newUri.trim()) return
    writeContract({
      address: contractAddr,
      abi: identityRegistryAbi,
      functionName: 'setAgentURI',
      args: [BigInt(agent.agent_id), newUri.trim()],
    })
  }, [contractAddr, newUri, writeContract, agent.agent_id])

  const handleSetMetadata = useCallback(() => {
    if (!contractAddr || !metaKey.trim() || !metaValue.trim()) return
    writeContract({
      address: contractAddr,
      abi: identityRegistryAbi,
      functionName: 'setMetadata',
      args: [BigInt(agent.agent_id), metaKey.trim(), toHex(metaValue.trim())],
    })
  }, [contractAddr, metaKey, metaValue, writeContract, agent.agent_id])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setNewUri('')
    setMetaKey('')
    setMetaValue('')
    resetWrite()
  }, [onOpenChange, resetWrite])

  const errorMessage = writeError
    ? writeError.message.includes('User rejected')
      ? 'Transaction was rejected.'
      : writeError.message.slice(0, 200)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="size-5 text-primary" />
            Edit Agent #{agent.agent_id}
          </DialogTitle>
          <DialogDescription>
            Update your agent&apos;s URI or metadata on-chain.
          </DialogDescription>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => { setEditMode('uri'); resetWrite() }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-medium transition-all',
              editMode === 'uri'
                ? 'border-primary/50 bg-primary/20 text-primary'
                : 'border-border/50 text-muted-foreground hover:text-foreground'
            )}
          >
            Update URI
          </button>
          <button
            onClick={() => { setEditMode('metadata'); resetWrite() }}
            className={cn(
              'rounded-full border px-4 py-1.5 text-xs font-medium transition-all',
              editMode === 'metadata'
                ? 'border-primary/50 bg-primary/20 text-primary'
                : 'border-border/50 text-muted-foreground hover:text-foreground'
            )}
          >
            Set Metadata
          </button>
        </div>

        {/* URI form */}
        {editMode === 'uri' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Agent URI</label>
              <Input
                placeholder="https://example.com/agent-metadata.json"
                value={newUri}
                onChange={(e) => setNewUri(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Calls <code className="font-mono text-primary/80">setAgentURI(agentId, newURI)</code>
              </p>
            </div>
          </div>
        )}

        {/* Metadata form */}
        {editMode === 'metadata' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Metadata Key</label>
              <Input
                placeholder="e.g., name, description, image, category"
                value={metaKey}
                onChange={(e) => setMetaKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Metadata Value</label>
              <Input
                placeholder="Value (will be encoded as bytes)"
                value={metaValue}
                onChange={(e) => setMetaValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Calls <code className="font-mono text-primary/80">setMetadata(agentId, key, value)</code>
              </p>
            </div>
          </div>
        )}

        {/* TX status */}
        {isConfirmed && (
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <CheckCircle2 className="size-4 text-green-400 shrink-0" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-green-400">Transaction Confirmed!</p>
              {txHash && (
                <a
                  href={getExplorerTxUrl(chainId, txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-mono text-primary hover:underline break-all"
                >
                  {txHash.slice(0, 20)}...
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <XCircle className="size-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive break-all">{errorMessage}</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {isConfirmed ? 'Done' : 'Cancel'}
          </Button>
          {!isConfirmed && (
            <Button
              onClick={editMode === 'uri' ? handleSetUri : handleSetMetadata}
              disabled={
                isPending ||
                isConfirming ||
                (editMode === 'uri' ? !newUri.trim() : !metaKey.trim() || !metaValue.trim())
              }
              className="bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded-full" />
                  {isPending ? 'Confirm...' : 'Confirming...'}
                </span>
              ) : (
                editMode === 'uri' ? 'Update URI' : 'Set Metadata'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Card Skeleton
// ============================================================

function AgentCardSkeleton() {
  return (
    <div className="w-full max-w-[300px]">
      <div className="aspect-[5/7] overflow-hidden rounded-2xl border border-border/50 bg-card/95">
        <Skeleton className="h-[55%] w-full rounded-none" />
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-7 w-24" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between border-t border-border/30 pt-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Connect Wallet Prompt
// ============================================================

function ConnectWalletPrompt() {
  const { openConnectModal } = useConnectModal()

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your portfolio of incorporated entities.
            </p>
          </div>
          <Button
            size="lg"
            onClick={openConnectModal}
            className="w-full bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Wallet className="size-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Profile Page
// ============================================================

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [sellingAgent, setSellingAgent] = useState<Agent | null>(null)

  const { agents, isLoading } = useUserAgents(address, chainId)

  if (!isConnected || !address) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="My Portfolio"
          subtitle="Manage your incorporated entities"
        />
        <ConnectWalletPrompt />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Portfolio"
        subtitle="Manage your incorporated entities"
      >
        <Link href="/create">
          <Button className="gap-2 bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90">
            <Plus className="size-4" />
            Incorporate Agent
          </Button>
        </Link>
      </PageHeader>

      {/* Wallet info */}
      <section className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <User className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground font-mono">{formatAddress(address)}</p>
          <p className="text-xs text-muted-foreground">
            {getChainLabel(chainId)} · {isLoading ? '...' : `${agents.length} agent${agents.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </section>

      {/* Agent Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <AgentCardSkeleton key={i} />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={User}
            title="No Entities Found"
            description="You haven't incorporated any entities on this chain yet."
            action={{ label: 'Incorporate Your First Agent', href: '/create' }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agents.map((agent) => (
              <div key={`${agent.chain_id}-${agent.agent_id}`} className="relative group">
                <Link href={`/explore/agents/${agent.chain_id}/${agent.agent_id}`}>
                  <HoloCard
                    name={agent.name || `Agent #${agent.agent_id}`}
                    image={agent.image}
                    description={agent.description}
                    score={agent.reputation_score}
                    feedbackCount={agent.feedback_count}
                    chainId={agent.chain_id}
                    owner={agent.owner}
                  />
                </Link>
                {/* Action button overlays */}
                <div className="absolute right-3 top-3 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSellingAgent(agent)
                    }}
                    className="gap-1.5 bg-card/90 backdrop-blur-sm border-border/50"
                  >
                    <Tag className="size-3" />
                    Sell
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingAgent(agent)
                    }}
                    className="gap-1.5 bg-card/90 backdrop-blur-sm border-border/50"
                  >
                    <Edit3 className="size-3" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* List for Sale Dialog */}
      {sellingAgent && (
        <ListForSaleDialog
          agent={sellingAgent}
          chainId={chainId}
          open={!!sellingAgent}
          onOpenChange={(open) => {
            if (!open) setSellingAgent(null)
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingAgent && (
        <EditAgentDialog
          agent={editingAgent}
          chainId={chainId}
          open={!!editingAgent}
          onOpenChange={(open) => {
            if (!open) setEditingAgent(null)
          }}
        />
      )}
    </div>
  )
}
