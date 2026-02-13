import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function useContractAction(options?: { 
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void 
}) {
  const {
    data: txHash,
    writeContract,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isConfirmed && options?.successMessage) {
      toast.success(options.successMessage)
      options?.onSuccess?.()
    }
  }, [isConfirmed])

  useEffect(() => {
    if (error) {
      toast.error(options?.errorMessage || 'Transaction failed', {
        description: error.message.slice(0, 100),
      })
    }
  }, [error])

  return {
    txHash,
    writeContract,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    reset,
    isLoading: isPending || isConfirming,
  }
}
