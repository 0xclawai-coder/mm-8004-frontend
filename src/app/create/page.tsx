'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { decodeEventLog, toHex, type Log } from 'viem'
import {
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  Sparkles,
  Cpu,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { HoloCard } from '@/components/agents/HoloCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  CONTRACT_ADDRESSES,
  identityRegistryAbi,
  type SupportedChainId,
} from '@/lib/contracts'

// ============================================================
// Constants
// ============================================================

const CATEGORIES = ['Legal', 'Design', 'Trading', 'DeFi', 'Arbitrage', 'Other'] as const

const PROTOCOL_OPTIONS = ['HTTP', 'WebSocket', 'gRPC', 'x402', 'Other'] as const

interface Endpoint {
  url: string
  protocol: string
}

interface FormState {
  agentUri: string
  name: string
  description: string
  imageUrl: string
  categories: string[]
  x402Support: boolean
  endpoints: Endpoint[]
}

interface FormErrors {
  agentUri?: string
  name?: string
  description?: string
  imageUrl?: string
  endpoints?: string
}

type TxStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error'

const INITIAL_FORM: FormState = {
  agentUri: '',
  name: '',
  description: '',
  imageUrl: '',
  categories: [],
  x402Support: false,
  endpoints: [],
}

// ============================================================
// Helper: encode metadata entries
// ============================================================

function buildMetadataEntries(form: FormState): Array<{ metadataKey: string; metadataValue: `0x${string}` }> {
  const entries: Array<{ metadataKey: string; metadataValue: `0x${string}` }> = []

  if (form.name.trim()) {
    entries.push({ metadataKey: 'name', metadataValue: toHex(form.name.trim()) })
  }
  if (form.description.trim()) {
    entries.push({ metadataKey: 'description', metadataValue: toHex(form.description.trim()) })
  }
  if (form.imageUrl.trim()) {
    entries.push({ metadataKey: 'image', metadataValue: toHex(form.imageUrl.trim()) })
  }
  if (form.categories.length > 0) {
    entries.push({ metadataKey: 'categories', metadataValue: toHex(JSON.stringify(form.categories)) })
  }
  if (form.x402Support) {
    entries.push({ metadataKey: 'x402_support', metadataValue: toHex('true') })
  }
  if (form.endpoints.length > 0) {
    const validEndpoints = form.endpoints.filter((ep) => ep.url.trim())
    if (validEndpoints.length > 0) {
      entries.push({ metadataKey: 'endpoints', metadataValue: toHex(JSON.stringify(validEndpoints)) })
    }
  }

  return entries
}

// ============================================================
// Helpers
// ============================================================

function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

function getExplorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === 143) return `https://monadexplorer.com/tx/${txHash}`
  if (chainId === 10143) return `https://testnet.monadexplorer.com/tx/${txHash}`
  return '#'
}

// ============================================================
// Live Preview Component
// ============================================================

function LivePreview({ form, chainId }: { form: FormState; chainId: number }) {
  return (
    <div className="sticky top-24 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Live Preview
      </h3>
      <HoloCard
        name={form.name || undefined}
        image={form.imageUrl || undefined}
        score={0}
        tags={form.categories.slice(0, 3).map((c) => ({ label: c, icon: <Sparkles className="size-2.5" /> as React.ReactNode, className: 'bg-primary/10 text-primary border-primary/20' }))}
        chainId={chainId}
      />
      {/* Endpoints & Metadata summary below card */}
      {(form.endpoints.length > 0 || buildMetadataEntries(form).length > 0) && (
        <Card className="border-border/50 bg-card/80 py-0">
          <CardContent className="flex flex-col gap-3 p-4">
            {form.endpoints.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Endpoints
                </p>
                {form.endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {ep.protocol || 'HTTP'}
                    </Badge>
                    <span className="truncate font-mono text-[11px]">
                      {ep.url || 'https://...'}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {buildMetadataEntries(form).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  On-chain Metadata
                </p>
                {buildMetadataEntries(form).map((entry) => (
                  <div key={entry.metadataKey} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                      {entry.metadataKey}
                    </Badge>
                    <span className="truncate text-muted-foreground text-[11px]">✓</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Connect Wallet Prompt
// ============================================================

function ConnectWalletPrompt() {
  const { openConnectModal } = useConnectModal()

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Card className="w-full max-w-lg border border-border/60 bg-card/90">
        <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-violet-500/10 to-cyan-500/10 border border-primary/20">
            <Wallet className="size-10 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect your wallet to register a new AI agent on the Monad chain with on-chain identity and reputation.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button
              size="lg"
              onClick={openConnectModal}
              className="w-full bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity text-base"
            >
              <Wallet className="size-4" />
              Connect Wallet
            </Button>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 p-3">
                <Cpu className="size-4 text-primary/60" />
                <span className="text-[10px] text-muted-foreground text-center">EIP-8004 Identity</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 p-3">
                <Shield className="size-4 text-cyan-400/60" />
                <span className="text-[10px] text-muted-foreground text-center">x402 Payments</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 p-3">
                <Star className="size-4 text-yellow-400/60" />
                <span className="text-[10px] text-muted-foreground text-center">On-chain Rep</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export default function CreateMoltPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  // Form state
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [txDialogOpen, setTxDialogOpen] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)

  // Contract write
  const {
    data: txHash,
    writeContract,
    isPending: isWritePending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for receipt
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Parse agentId from Registered event
  const registeredAgentId = useMemo(() => {
    if (!receipt?.logs) return null
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: identityRegistryAbi,
          data: log.data,
          topics: (log as Log).topics,
        })
        if (decoded.eventName === 'Registered' && 'agentId' in decoded.args) {
          return (decoded.args as { agentId: bigint }).agentId
        }
      } catch {
        // Not this event, skip
      }
    }
    return null
  }, [receipt])

  // Redirect to agent detail on success
  useEffect(() => {
    if (isConfirmed && registeredAgentId != null) {
      const timer = setTimeout(() => {
        router.push(`/explore/agents/${chainId}/${registeredAgentId.toString()}`)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isConfirmed, registeredAgentId, chainId, router])

  // Derive tx status
  const txStatus: TxStatus = useMemo(() => {
    if (isConfirmed) return 'success'
    if (isConfirming) return 'confirming'
    if (isWritePending) return 'pending'
    if (writeError || txError) return 'error'
    return 'idle'
  }, [isConfirmed, isConfirming, isWritePending, writeError, txError])

  // --------------------------------------------------------
  // Form handlers
  // --------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      if (field in errors) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors]
  )

  const toggleCategory = useCallback((category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }, [])

  const addEndpoint = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      endpoints: [...prev.endpoints, { url: '', protocol: 'HTTP' }],
    }))
  }, [])

  const removeEndpoint = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      endpoints: prev.endpoints.filter((_, i) => i !== index),
    }))
  }, [])

  const updateEndpoint = useCallback(
    (index: number, field: keyof Endpoint, value: string) => {
      setForm((prev) => ({
        ...prev,
        endpoints: prev.endpoints.map((ep, i) =>
          i === index ? { ...ep, [field]: value } : ep
        ),
      }))
    },
    []
  )

  // --------------------------------------------------------
  // Validation
  // --------------------------------------------------------

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!form.agentUri.trim()) {
      newErrors.agentUri = 'Agent URI is required'
    } else {
      try {
        new URL(form.agentUri)
      } catch {
        newErrors.agentUri = 'Must be a valid URL (e.g., https://... or ipfs://...)'
      }
    }

    if (!form.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (form.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (form.imageUrl.trim()) {
      try {
        new URL(form.imageUrl)
      } catch {
        newErrors.imageUrl = 'Must be a valid URL'
      }
    }

    const hasInvalidEndpoints = form.endpoints.some((ep) => !ep.url.trim())
    if (hasInvalidEndpoints) {
      newErrors.endpoints = 'All endpoint URLs must be filled in'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form])

  // --------------------------------------------------------
  // Submit
  // --------------------------------------------------------

  const handleSubmit = useCallback(() => {
    if (!validate()) return

    setTxError(null)
    setTxDialogOpen(true)

    const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId]
    if (!addresses) {
      setTxError(`Unsupported chain (${chainId}). Please switch to Monad Mainnet or Testnet.`)
      return
    }

    try {
      const metadata = buildMetadataEntries(form)

      if (metadata.length > 0) {
        // Use register(string agentURI, MetadataEntry[] metadata)
        writeContract({
          address: addresses.identityRegistry,
          abi: identityRegistryAbi,
          functionName: 'register',
          args: [form.agentUri, metadata],
        })
      } else {
        // Use register(string agentURI) — no metadata
        writeContract({
          address: addresses.identityRegistry,
          abi: identityRegistryAbi,
          functionName: 'register',
          args: [form.agentUri],
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setTxError(message)
    }
  }, [validate, chainId, writeContract, form])

  // --------------------------------------------------------
  // Reset after success
  // --------------------------------------------------------

  const handleCreateAnother = useCallback(() => {
    setForm(INITIAL_FORM)
    setErrors({})
    setTxDialogOpen(false)
    setTxError(null)
    resetWrite()
  }, [resetWrite])

  // --------------------------------------------------------
  // Render: not connected
  // --------------------------------------------------------

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-radial">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pt-10 lg:px-8">
          <div className="flex flex-col gap-3 pb-4 text-center">
            <h1 className="text-gradient-glow text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Create Your Molt
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Register a new AI agent on the Monad chain
            </p>
          </div>
          <ConnectWalletPrompt />
        </div>
      </div>
    )
  }

  // --------------------------------------------------------
  // Render: connected — full form
  // --------------------------------------------------------

  const errorMessage =
    txError ||
    (writeError
      ? writeError.message.includes('User rejected')
        ? 'Transaction was rejected by the user.'
        : writeError.message.length > 200
          ? writeError.message.slice(0, 200) + '...'
          : writeError.message
      : null)

  return (
    <div className="min-h-screen bg-gradient-radial">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-6 text-center">
          <h1 className="text-gradient-glow text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Create Your Molt
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Register a new AI agent on the Monad chain
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ====== LEFT: Form ====== */}
          <div className="space-y-8">
            {/* Agent URI */}
            <div className="space-y-2">
              <label htmlFor="agentUri" className="text-sm font-medium text-foreground">
                Agent URI <span className="text-destructive">*</span>
              </label>
              <Input
                id="agentUri"
                placeholder="https://example.com/agent-metadata.json or ipfs://..."
                value={form.agentUri}
                onChange={(e) => updateField('agentUri', e.target.value)}
                aria-invalid={!!errors.agentUri}
                className={cn(errors.agentUri && 'border-destructive')}
              />
              {errors.agentUri && (
                <p className="text-xs text-destructive">{errors.agentUri}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The metadata URI that points to your agent&apos;s EIP-8004 JSON metadata.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                placeholder="My AI Agent"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                aria-invalid={!!errors.name}
                className={cn(errors.name && 'border-destructive')}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="description"
                placeholder="Describe what your AI agent does, its capabilities, and how it can help..."
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                aria-invalid={!!errors.description}
                rows={4}
                maxLength={1000}
                className={cn(
                  'placeholder:text-muted-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm resize-none',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                  errors.description && 'border-destructive'
                )}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {form.description.length}/1000
              </p>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium text-foreground">
                Image URL <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/avatar.png"
                value={form.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                aria-invalid={!!errors.imageUrl}
                className={cn(errors.imageUrl && 'border-destructive')}
              />
              {errors.imageUrl && (
                <p className="text-xs text-destructive">{errors.imageUrl}</p>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Categories <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const selected = form.categories.includes(category)
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                        selected
                          ? 'border-primary/50 bg-primary/20 text-primary shadow-sm'
                          : 'border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      )}
                    >
                      {selected && <CheckCircle2 className="size-3" />}
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* x402 Support */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.x402Support}
                onClick={() => updateField('x402Support', !form.x402Support)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  form.x402Support ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none block size-5 rounded-full bg-white shadow-lg transition-transform',
                    form.x402Support ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
              <div>
                <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => updateField('x402Support', !form.x402Support)}>
                  x402 Support
                </label>
                <p className="text-xs text-muted-foreground">
                  Enable x402 payment protocol support for this agent
                </p>
              </div>
            </div>

            {/* Endpoints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Endpoints <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEndpoint}
                  className="gap-1"
                >
                  <Plus className="size-3" />
                  Add Endpoint
                </Button>
              </div>

              {form.endpoints.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No endpoints added yet. Click &quot;Add Endpoint&quot; to define your agent&apos;s service endpoints.
                </p>
              )}

              {form.endpoints.map((endpoint, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="https://api.example.com/v1/agent"
                      value={endpoint.url}
                      onChange={(e) => updateEndpoint(index, 'url', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PROTOCOL_OPTIONS.map((proto) => (
                        <button
                          key={proto}
                          type="button"
                          onClick={() => updateEndpoint(index, 'protocol', proto)}
                          className={cn(
                            'rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer',
                            endpoint.protocol === proto
                              ? 'border-primary/50 bg-primary/20 text-primary'
                              : 'border-border/50 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {proto}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEndpoint(index)}
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}

              {errors.endpoints && (
                <p className="text-xs text-destructive">{errors.endpoints}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
              <Button
                type="button"
                size="lg"
                onClick={handleSubmit}
                disabled={isWritePending || isConfirming}
                className="w-full bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity text-base font-semibold"
              >
                {isWritePending || isConfirming ? (
                  <span className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full" />
                    {isWritePending ? 'Confirm in Wallet...' : 'Confirming...'}
                  </span>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Register Agent
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                This will call{' '}
                <code className="font-mono text-primary/80">
                  IdentityRegistry.register(uri, metadata[])
                </code>{' '}
                on {getChainLabel(chainId)}
              </p>
            </div>
          </div>

          {/* ====== RIGHT: Live Preview ====== */}
          <div className="lg:block">
            <LivePreview form={form} chainId={chainId} />
          </div>
        </div>
      </div>

      {/* ====== Transaction Status Dialog ====== */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          {/* Pending / Confirming */}
          {(txStatus === 'pending' || txStatus === 'confirming') && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Skeleton className="size-5 rounded-full" />
                  {txStatus === 'pending'
                    ? 'Waiting for Confirmation'
                    : 'Transaction Submitted'}
                </DialogTitle>
                <DialogDescription>
                  {txStatus === 'pending'
                    ? 'Please confirm the transaction in your wallet.'
                    : 'Your transaction is being confirmed on the Monad chain. This usually takes a few seconds.'}
                </DialogDescription>
              </DialogHeader>
              {txHash && (
                <div className="flex flex-col gap-1 rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  <a
                    href={getExplorerTxUrl(chainId, txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-mono text-primary hover:underline break-all"
                  >
                    {txHash}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}
            </>
          )}

          {/* Success */}
          {txStatus === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="size-5" />
                  Agent Registered!
                </DialogTitle>
                <DialogDescription>
                  Your AI agent has been successfully registered on the Monad chain.
                  {registeredAgentId != null && (
                    <> Agent ID: <strong>#{registeredAgentId.toString()}</strong>. Redirecting...</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-1 rounded-lg bg-gradient-to-r from-primary/10 via-violet-glow/10 to-cyan-accent/10 border border-primary/20 p-4 text-center">
                <p className="text-lg font-bold text-gradient-glow">
                  Welcome to the Molt Network!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your agent is now on-chain and ready to build its reputation.
                </p>
              </div>

              {txHash && (
                <div className="flex flex-col gap-1 rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  <a
                    href={getExplorerTxUrl(chainId, txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-mono text-primary hover:underline break-all"
                  >
                    {txHash}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              )}

              <DialogFooter className="flex-col gap-2 sm:flex-col">
                {registeredAgentId != null && (
                  <Link href={`/explore/agents/${chainId}/${registeredAgentId.toString()}`} className="w-full">
                    <Button className="w-full" variant="outline">
                      <ExternalLink className="size-4" />
                      View Agent
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={handleCreateAnother}
                  className="w-full bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90"
                >
                  <Plus className="size-4" />
                  Create Another
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Error */}
          {txStatus === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="size-5" />
                  Transaction Failed
                </DialogTitle>
                <DialogDescription>
                  Something went wrong while registering your agent.
                </DialogDescription>
              </DialogHeader>

              {errorMessage && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-xs text-destructive break-all">{errorMessage}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTxDialogOpen(false)
                    setTxError(null)
                    resetWrite()
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setTxError(null)
                    resetWrite()
                    handleSubmit()
                  }}
                >
                  Try Again
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
