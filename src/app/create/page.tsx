'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi'
import {
  Wallet,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Star,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
// Helper: get chain label
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
  const hasContent = form.name || form.description || form.imageUrl || form.categories.length > 0

  return (
    <div className="sticky top-24">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Live Preview
      </h3>
      <Card className="relative overflow-hidden border-border/50 bg-card/80 py-0 transition-all duration-300">
        <CardContent className="flex flex-col gap-4 p-5">
          {/* Top row: Avatar + Name + Description */}
          <div className="flex items-start gap-3">
            <Avatar className="size-12 shrink-0 ring-2 ring-border">
              {form.imageUrl ? (
                <AvatarImage src={form.imageUrl} alt={form.name || 'Agent'} />
              ) : null}
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                {form.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-foreground">
                {form.name || 'Agent Name'}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {form.description || 'No description yet'}
              </p>
            </div>
          </div>

          {/* Category tags */}
          {form.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.categories.slice(0, 3).map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                >
                  {category}
                </Badge>
              ))}
              {form.categories.length > 3 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{form.categories.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Bottom row: Score + Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="size-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">0.0</span>
              </div>
              <span className="text-xs text-muted-foreground">New agent</span>
            </div>

            <div className="flex items-center gap-1.5">
              {form.x402Support && (
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
                  chainId === 143
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                )}
              >
                {getChainLabel(chainId)}
              </Badge>
            </div>
          </div>

          {/* Endpoints preview */}
          {form.endpoints.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Endpoints
              </p>
              <div className="space-y-1">
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
            </div>
          )}

          {/* Empty state hint */}
          {!hasContent && (
            <p className="text-center text-xs text-muted-foreground/50 py-2">
              Fill in the form to see a live preview
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// Connect Wallet Prompt
// ============================================================

function ConnectWalletPrompt() {
  const { connect, connectors } = useConnect()

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="size-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Connect Your Wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need to connect your wallet to register a new AI agent on the Monad chain.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              const connector = connectors[0]
              if (connector) {
                connect({ connector })
              }
            }}
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
// Main Page Component
// ============================================================

export default function CreateMoltPage() {
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
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

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
      // Clear error for the field when user types
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

    // Validate endpoints: if any endpoint is added, url must be non-empty
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

    // Determine contract address from chain
    const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId]
    if (!addresses) {
      setTxError(`Unsupported chain (${chainId}). Please switch to Monad Mainnet or Testnet.`)
      return
    }

    try {
      writeContract({
        address: addresses.identityRegistry,
        abi: identityRegistryAbi,
        functionName: 'register',
        args: [form.agentUri],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setTxError(message)
    }
  }, [validate, chainId, writeContract, form.agentUri])

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
          {/* Header */}
          <div className="mb-4 text-center">
            <h1 className="text-gradient-glow text-3xl font-extrabold sm:text-4xl lg:text-5xl">
              Create Your Molt
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
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
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-gradient-glow text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Create Your Molt
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
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
                        'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                        selected
                          ? 'border-primary/50 bg-primary/20 text-primary shadow-sm'
                          : 'border-border/50 bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      )}
                    >
                      {selected && <CheckCircle2 className="mr-1 size-3" />}
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
            <div className="pt-4 border-t border-border/50">
              <Button
                type="button"
                size="lg"
                onClick={handleSubmit}
                disabled={isWritePending || isConfirming}
                className="w-full bg-gradient-to-r from-primary to-violet-glow text-primary-foreground hover:opacity-90 transition-opacity text-base font-semibold"
              >
                {isWritePending || isConfirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isWritePending ? 'Confirm in Wallet...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Register Agent
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                This will call <code className="font-mono text-primary/80">IdentityRegistry.register()</code> on{' '}
                {getChainLabel(chainId)}
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
                  <Loader2 className="size-5 animate-spin text-primary" />
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
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
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
                  It will appear in the marketplace once the indexer picks it up.
                </DialogDescription>
              </DialogHeader>

              {/* Confetti-style success banner */}
              <div className="rounded-lg bg-gradient-to-r from-primary/10 via-violet-glow/10 to-cyan-accent/10 border border-primary/20 p-4 text-center">
                <p className="text-lg font-bold text-gradient-glow">
                  Welcome to the Molt Network!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your agent is now on-chain and ready to build its reputation.
                </p>
              </div>

              {txHash && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
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
                <Link href="/explore/agents" className="w-full">
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="size-4" />
                    Browse Agents
                  </Button>
                </Link>
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
