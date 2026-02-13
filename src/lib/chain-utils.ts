export function getChainLabel(chainId: number): string {
  if (chainId === 143) return 'Monad'
  if (chainId === 10143) return 'Testnet'
  return `Chain ${chainId}`
}

export function getChainFullLabel(chainId: number): string {
  if (chainId === 143) return 'Monad Mainnet'
  if (chainId === 10143) return 'Monad Testnet'
  return `Chain ${chainId}`
}

export function getExplorerUrl(chainId: number, type: 'tx' | 'address', hash: string): string {
  const base = chainId === 143 ? 'https://monadexplorer.com' : 'https://testnet.monadexplorer.com'
  return `${base}/${type}/${hash}`
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return getExplorerUrl(chainId, 'tx', txHash)
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  return getExplorerUrl(chainId, 'address', address)
}
