import type {
  AgentDetail,
  AgentFilters,
  AgentsResponse,
  ActivitiesResponse,
  ActivityFilters,
  AuctionBid,
  AuctionDetailResponse,
  AuctionFilters,
  MarketplaceAuction,
  AuctionsResponse,
  BundleFilters,
  BundlesResponse,
  DashboardStats,
  GlobalActivitiesResponse,
  LeaderboardFilters,
  LeaderboardResponse,
  ListingFilters,
  ListingsResponse,
  MarketplaceListing,
  MarketplaceStats,
  OfferFilters,
  OffersResponse,
  ReputationHistory,
  ReputationRange,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

async function fetchApi<T>(
  path: string,
  params?: Record<string, string | undefined>
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, v)
      }
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json()
    throw err
  }
  return res.json()
}

// ============================================================
// Agent endpoints
// ============================================================

/** GET /api/agents — list agents with filters */
export function getAgents(filters?: AgentFilters): Promise<AgentsResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.sort) params.sort = filters.sort
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<AgentsResponse>('/agents', params)
}

/** GET /api/agents/:id — single agent detail */
export function getAgent(id: string): Promise<AgentDetail> {
  return fetchApi<AgentDetail>(`/agents/${id}`)
}

/** GET /api/agents/:id/reputation — reputation history + feedbacks */
export function getAgentReputation(
  id: string,
  range?: ReputationRange
): Promise<ReputationHistory> {
  const params: Record<string, string | undefined> = {}
  if (range) params.range = range
  return fetchApi<ReputationHistory>(`/agents/${id}/reputation`, params)
}

/** GET /api/agents/:id/activity — activity log */
export function getAgentActivity(
  id: string,
  filters?: ActivityFilters
): Promise<ActivitiesResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.event_type) params.event_type = filters.event_type
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<ActivitiesResponse>(`/agents/${id}/activity`, params)
}

/** GET /api/activity — global activity feed across all agents */
export function getGlobalActivity(
  filters?: ActivityFilters
): Promise<GlobalActivitiesResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.event_type) params.event_type = filters.event_type
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<GlobalActivitiesResponse>('/activity', params)
}

// ============================================================
// Leaderboard
// ============================================================

/** GET /api/leaderboard — agents ranked by reputation */
export function getLeaderboard(
  filters?: LeaderboardFilters
): Promise<LeaderboardResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.category) params.category = filters.category
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<LeaderboardResponse>('/leaderboard', params)
}

// ============================================================
// Stats
// ============================================================

/** GET /api/stats — global marketplace statistics */
export function getStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/stats')
}

// ============================================================
// Marketplace endpoints
// ============================================================

/** GET /api/marketplace/listings — list marketplace listings */
export function getListings(filters?: ListingFilters): Promise<ListingsResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.nft_contract) params.nft_contract = filters.nft_contract
    if (filters.seller) params.seller = filters.seller
    if (filters.status) params.status = filters.status
    if (filters.sort) params.sort = filters.sort
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<ListingsResponse>('/marketplace/listings', params)
}

/** GET /api/marketplace/auctions — list auctions */
export function getAuctions(filters?: AuctionFilters): Promise<AuctionsResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.nft_contract) params.nft_contract = filters.nft_contract
    if (filters.seller) params.seller = filters.seller
    if (filters.status) params.status = filters.status
    if (filters.sort) params.sort = filters.sort
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<AuctionsResponse>('/marketplace/auctions', params)
}

/** GET /api/marketplace/auctions/:id — single auction detail with bids */
export async function getAuctionDetail(id: string): Promise<AuctionDetailResponse> {
  const raw = await fetchApi<Record<string, unknown>>(`/marketplace/auctions/${id}`)
  // API returns flat structure with bids[] embedded — normalize to { auction, bids }
  if ('auction_id' in raw && !('auction' in raw)) {
    const { bids, ...auction } = raw as Record<string, unknown> & { bids?: AuctionBid[] }
    return { auction: auction as unknown as MarketplaceAuction, bids: bids ?? [] }
  }
  return raw as unknown as AuctionDetailResponse
}

/** GET /api/marketplace/bundles — list bundles */
export function getBundles(filters?: BundleFilters): Promise<BundlesResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.seller) params.seller = filters.seller
    if (filters.status) params.status = filters.status
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<BundlesResponse>('/marketplace/bundles', params)
}

/** GET /api/marketplace/listings/:id — single listing detail */
export function getListing(id: string): Promise<MarketplaceListing> {
  return fetchApi<MarketplaceListing>(`/marketplace/listings/${id}`)
}

/** GET /api/marketplace/offers — list offers */
export function getOffers(filters?: OfferFilters): Promise<OffersResponse> {
  const params: Record<string, string | undefined> = {}
  if (filters) {
    if (filters.chain_id !== undefined) params.chain_id = String(filters.chain_id)
    if (filters.nft_contract) params.nft_contract = filters.nft_contract
    if (filters.token_id) params.token_id = filters.token_id
    if (filters.offerer) params.offerer = filters.offerer
    if (filters.status) params.status = filters.status
    if (filters.page !== undefined) params.page = String(filters.page)
    if (filters.limit !== undefined) params.limit = String(filters.limit)
  }
  return fetchApi<OffersResponse>('/marketplace/offers', params)
}

/** GET /api/marketplace/stats — marketplace statistics */
export function getMarketplaceStats(): Promise<MarketplaceStats> {
  return fetchApi<MarketplaceStats>('/marketplace/stats')
}
