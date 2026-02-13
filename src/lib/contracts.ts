// Contract addresses per chain
export const CONTRACT_ADDRESSES = {
  // Monad Mainnet (chain ID 143)
  143: {
    identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const,
    reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const,
    marketplace: '0x3cc802d9885924fD1e8e358B1441Fe8300282cBe' as const,
    moltMarketplace: '0x48C803679fe35B2b85922B094E963A74680AAd9E' as const,
  },
  // Monad Testnet (chain ID 10143)
  10143: {
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const,
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const,
    marketplace: '0x3cc802d9885924fD1e8e358B1441Fe8300282cBe' as const,
    moltMarketplace: '0x0fd6B881b208d2b0b7Be11F1eB005A2873dD5D2e' as const,
  },
} as const

// ============================================================
// MoltMarketplace ABI (buy, makeOffer, bid, buyNow)
// ============================================================

export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000' as const

// WMON (Wrapped MON) — needed for offers/auctions that require ERC-20
export const WMON_ADDRESSES = {
  143: '0x3bd359C1119Da7Da1d913d1c4D2b7C461115433a' as const,   // Monad Mainnet (verified)
  10143: '0xc0574d351f35eb7683d58528fd73da842e7aef4d' as const,  // Monad Testnet (deployed by us)
} as const

export function getWmonAddress(chainId: number): `0x${string}` | undefined {
  return WMON_ADDRESSES[chainId as keyof typeof WMON_ADDRESSES]
}

// WMON ABI (WETH9-compatible: deposit/withdraw + ERC-20)
export const wmonAbi = [
  { name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'wad', type: 'uint256' }], outputs: [] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'guy', type: 'address' }, { name: 'wad', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
] as const

export const moltMarketplaceAbi = [
  // buy(uint256 listingId) payable
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  // makeOffer(address nftContract, uint256 tokenId, address paymentToken, uint256 amount, uint256 expiry) returns (uint256 offerId)
  {
    name: 'makeOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [{ name: 'offerId', type: 'uint256' }],
  },
  // makeOfferWithNative(address nftContract, uint256 tokenId, uint256 expiry) payable returns (uint256 offerId)
  {
    name: 'makeOfferWithNative',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [{ name: 'offerId', type: 'uint256' }],
  },
  // bid(uint256 auctionId, uint256 amount) payable
  {
    name: 'bid',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'auctionId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  // buyNow — settles auction immediately at buyNowPrice (called via bid internally, but exposed here for direct buy-now)
  // The contract uses bid() with amount >= buyNowPrice to trigger _settleBuyNow,
  // so we use bid() for buy-now as well.

  // list(address nftContract, uint256 tokenId, address paymentToken, uint256 price, uint256 expiry) returns (uint256)
  {
    name: 'list',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [{ name: 'listingId', type: 'uint256' }],
  },
  // cancelListing(uint256 listingId)
  {
    name: 'cancelListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
  },
  // updateListingPrice(uint256 listingId, uint256 newPrice)
  {
    name: 'updateListingPrice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'listingId', type: 'uint256' },
      { name: 'newPrice', type: 'uint256' },
    ],
    outputs: [],
  },
  // acceptOffer(uint256 offerId)
  {
    name: 'acceptOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: [],
  },
  // cancelOffer(uint256 offerId)
  {
    name: 'cancelOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: [],
  },
  // createAuction
  {
    name: 'createAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'startingPrice', type: 'uint256' },
      { name: 'buyNowPrice', type: 'uint256' },
      { name: 'minBidIncrement', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: 'auctionId', type: 'uint256' }],
  },
  // settleAuction(uint256 auctionId)
  {
    name: 'settleAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [],
  },
  // cancelAuction(uint256 auctionId)
  {
    name: 'cancelAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [],
  },
  // createDutchAuction
  {
    name: 'createDutchAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'paymentToken', type: 'address' },
      { name: 'startPrice', type: 'uint256' },
      { name: 'endPrice', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: 'auctionId', type: 'uint256' }],
  },
  // buyDutchAuction(uint256 auctionId) payable
  {
    name: 'buyDutchAuction',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [],
  },
  // cancelDutchAuction(uint256 auctionId)
  {
    name: 'cancelDutchAuction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'auctionId', type: 'uint256' }],
    outputs: [],
  },
  // createBundleListing
  {
    name: 'createBundleListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContracts', type: 'address[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'paymentToken', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [{ name: 'bundleId', type: 'uint256' }],
  },
  // buyBundle(uint256 bundleId) payable
  {
    name: 'buyBundle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'bundleId', type: 'uint256' }],
    outputs: [],
  },
  // cancelBundleListing(uint256 bundleId)
  {
    name: 'cancelBundleListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'bundleId', type: 'uint256' }],
    outputs: [],
  },
  // makeCollectionOffer
  {
    name: 'makeCollectionOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'nftContract', type: 'address' },
      { name: 'paymentToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
    outputs: [{ name: 'offerId', type: 'uint256' }],
  },
  // acceptCollectionOffer(uint256 offerId, uint256 tokenId)
  {
    name: 'acceptCollectionOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'offerId', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  // cancelCollectionOffer(uint256 offerId)
  {
    name: 'cancelCollectionOffer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'offerId', type: 'uint256' }],
    outputs: [],
  },
] as const

// ERC-721 approve ABI (for listing flow — approve marketplace to transfer NFT)
export const erc721ApproveAbi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

// ERC-20 approve ABI (for offer flow)
export const erc20Abi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

/** Parse price strings like "200e+16", "2000000000000000000", etc. to BigInt */
export function parsePriceToBigInt(priceStr: string): bigint {
  // Handle scientific notation like "200e+16"
  const num = Number(priceStr)
  if (Number.isFinite(num)) {
    // Convert to integer string to avoid floating point issues
    return BigInt(num.toLocaleString('fullwide', { useGrouping: false }).split('.')[0])
  }
  // Fallback: try direct BigInt parse
  return BigInt(priceStr)
}

/** Get MoltMarketplace contract address for a chain */
export function getMoltMarketplaceAddress(chainId: number): `0x${string}` | undefined {
  const addrs = CONTRACT_ADDRESSES[chainId as SupportedChainId]
  return addrs?.moltMarketplace
}

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

// IdentityRegistry ABI — corrected from official contract artifact (backend/abi/IdentityRegistry.json)
export const identityRegistryAbi = [
  // register() — no args
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  // register(string agentURI) — with URI
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  // register(string agentURI, MetadataEntry[] metadata) — with URI + metadata
  {
    name: 'register',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentURI', type: 'string' },
      {
        name: 'metadata',
        type: 'tuple[]',
        components: [
          { name: 'metadataKey', type: 'string' },
          { name: 'metadataValue', type: 'bytes' },
        ],
      },
    ],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  // setAgentURI
  {
    name: 'setAgentURI',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newURI', type: 'string' },
    ],
    outputs: [],
  },
  // setMetadata
  {
    name: 'setMetadata',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' },
      { name: 'metadataValue', type: 'bytes' },
    ],
    outputs: [],
  },
  // Events — corrected signatures from actual contract
  {
    name: 'Registered',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
  {
    name: 'URIUpdated',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'newURI', type: 'string', indexed: false },
      { name: 'updatedBy', type: 'address', indexed: true },
    ],
  },
  {
    name: 'MetadataSet',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'indexedMetadataKey', type: 'string', indexed: true },
      { name: 'metadataKey', type: 'string', indexed: false },
      { name: 'metadataValue', type: 'bytes', indexed: false },
    ],
  },
] as const

// ReputationRegistry ABI — corrected from official contract artifact (backend/abi/ReputationRegistry.json)
export const reputationRegistryAbi = [
  // giveFeedback
  {
    name: 'giveFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  // revokeFeedback
  {
    name: 'revokeFeedback',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'feedbackIndex', type: 'uint64' },
    ],
    outputs: [],
  },
  // Events — corrected signatures from actual contract
  {
    name: 'NewFeedback',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'clientAddress', type: 'address', indexed: true },
      { name: 'feedbackIndex', type: 'uint64', indexed: false },
      { name: 'value', type: 'int128', indexed: false },
      { name: 'valueDecimals', type: 'uint8', indexed: false },
      { name: 'indexedTag1', type: 'string', indexed: true },
      { name: 'tag1', type: 'string', indexed: false },
      { name: 'tag2', type: 'string', indexed: false },
      { name: 'endpoint', type: 'string', indexed: false },
      { name: 'feedbackURI', type: 'string', indexed: false },
      { name: 'feedbackHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    name: 'FeedbackRevoked',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'clientAddress', type: 'address', indexed: true },
      { name: 'feedbackIndex', type: 'uint64', indexed: true },
    ],
  },
  {
    name: 'ResponseAppended',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'clientAddress', type: 'address', indexed: true },
      { name: 'feedbackIndex', type: 'uint64', indexed: false },
      { name: 'responder', type: 'address', indexed: true },
      { name: 'responseURI', type: 'string', indexed: false },
      { name: 'responseHash', type: 'bytes32', indexed: false },
    ],
  },
] as const
