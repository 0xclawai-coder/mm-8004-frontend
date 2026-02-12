// ============================================================
// Agent Types
// ============================================================

/** Agent metadata from EIP-8004 agentURI JSON */
export interface AgentMetadata {
  version: string
  endpoints: Array<{
    url: string
    protocol: string
  }>
  capabilities: string[]
  [key: string]: unknown
}

/** Agent summary (used in list views) */
export interface Agent {
  agent_id: number
  chain_id: number
  owner: string
  name: string | null
  description: string | null
  image: string | null
  categories: string[] | null
  x402_support: boolean
  active: boolean
  reputation_score: number | null
  feedback_count: number
  block_timestamp: string
}

/** Score grouped by tag */
export interface ScoreByTag {
  score_type: string
  label: string | null
  value: number
  count: number
  min_value: number | null
  max_value: number | null
  /** Scale classification: "percentage" | "elo" | "boolean" | "raw" */
  scale: string
}

/** Agent detail (single agent view) */
export interface AgentDetail extends Agent {
  uri: string | null
  metadata: AgentMetadata | null
  positive_feedback_count: number | null
  negative_feedback_count: number | null
  scores: ScoreByTag[]
}

// ============================================================
// Feedback Types
// ============================================================

export interface Feedback {
  id: number
  agent_id: number
  chain_id: number
  client_address: string
  feedback_index: number
  value: number
  value_decimals: number | null
  tag1: string | null
  tag2: string | null
  endpoint: string | null
  feedback_uri: string | null
  feedback_hash: string | null
  revoked: boolean
  tx_hash: string
  block_number: number
  block_timestamp: string
}

// ============================================================
// Activity Types
// ============================================================

export type EventType =
  | 'Registered'
  | 'URIUpdated'
  | 'MetadataSet'
  | 'NewFeedback'
  | 'FeedbackRevoked'
  | 'ResponseAppended'

export type EventCategory = 'identity' | 'reputation' | 'labor'

export interface Activity {
  id: number
  agent_id: number
  chain_id: number
  event_type: EventType
  event_data: Record<string, unknown>
  block_number: number
  block_timestamp: string
  tx_hash: string
  log_index: number
}

// ============================================================
// Leaderboard Types
// ============================================================

export interface LeaderboardEntry {
  rank: number
  agent_id: number
  chain_id: number
  name: string | null
  image: string | null
  categories: string[] | null
  x402_support: boolean
  reputation_score: number | null
  feedback_count: number | null
  owner: string
}

// ============================================================
// Marketplace Stats
// ============================================================

export interface CategoryCount {
  category: string
  count: number
}

export interface DashboardStats {
  total_agents: number
  total_feedbacks: number
  total_chains: number
  agents_by_chain: Record<string, number>
  top_categories: CategoryCount[]
  recent_registrations_24h: number
  recent_feedbacks_24h: number
}

// ============================================================
// Reputation History
// ============================================================

export interface ReputationHistoryPoint {
  date: string
  score: number
  feedback_count: number
}

export interface ReputationHistory {
  agent_id: number
  chain_id: number
  current_score: number | null
  history: ReputationHistoryPoint[]
  feedbacks: Feedback[]
}

export type ReputationRange = '7d' | '30d' | '90d' | 'all'

// ============================================================
// Pagination & API
// ============================================================

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  [key: string]: T[] | number
}

export interface AgentsResponse {
  agents: Agent[]
  total: number
  page: number
  limit: number
}

export interface ActivitiesResponse {
  activities: Activity[]
  total: number
  page: number
  limit: number
}

/** Activity with joined agent name/image (global feed) */
export interface GlobalActivity extends Activity {
  agent_name: string | null
  agent_image: string | null
}

export interface GlobalActivitiesResponse {
  activities: GlobalActivity[]
  total: number
  page: number
  limit: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
}

export interface ApiError {
  error: string
  message: string
  status: number
}

// ============================================================
// Marketplace Types
// ============================================================

export interface MarketplaceListing {
  id: number
  listing_id: number
  chain_id: number
  seller: string
  nft_contract: string
  token_id: string
  payment_token: string
  price: string
  expiry: number
  status: string
  buyer: string | null
  sold_price: string | null
  block_number: number
  block_timestamp: string
  tx_hash: string
  created_at: string
  updated_at: string
  agent_name: string | null
  agent_image: string | null
}

export interface MarketplaceAuction {
  id: number
  auction_id: number
  chain_id: number
  seller: string
  nft_contract: string
  token_id: string
  payment_token: string
  start_price: string
  reserve_price: string
  buy_now_price: string
  highest_bid: string | null
  highest_bidder: string | null
  start_time: number
  end_time: number
  bid_count: number | null
  status: string
  winner: string | null
  settled_price: string | null
  block_number: number
  block_timestamp: string
  tx_hash: string
  created_at: string
  updated_at: string
  agent_name: string | null
  agent_image: string | null
}

export interface MarketplaceBundle {
  id: number
  bundle_id: number
  chain_id: number
  seller: string
  nft_contracts: string[]
  token_ids: string[]
  payment_token: string
  price: string
  expiry: number
  item_count: number
  status: string
  buyer: string | null
  sold_price: string | null
  block_number: number
  block_timestamp: string
  tx_hash: string
  created_at: string
  updated_at: string
}

export interface MarketplaceStats {
  total_listings: number
  active_listings: number
  total_sales: number
  total_volume: string
  active_auctions: number
}

export interface ListingsResponse {
  listings: MarketplaceListing[]
  total: number
  page: number
  limit: number
}

export interface AuctionsResponse {
  auctions: MarketplaceAuction[]
  total: number
  page: number
  limit: number
}

export interface BundlesResponse {
  bundles: MarketplaceBundle[]
  total: number
  page: number
  limit: number
}

// ============================================================
// Auction Detail Types
// ============================================================

export interface AuctionBid {
  id: number
  auction_id: number
  chain_id: number
  bidder: string
  amount: string
  block_number: number
  block_timestamp: string
  tx_hash: string
}

export interface AuctionDetailResponse {
  auction: MarketplaceAuction
  bids: AuctionBid[]
}

export type ListingSortOrder = 'recent' | 'price_asc' | 'price_desc'
export type ListingStatus = 'Active' | 'Sold' | 'Cancelled' | 'Expired'
export type AuctionSortOrder = 'recent' | 'ending_soon' | 'highest_bid'

export interface ListingFilters {
  chain_id?: number
  nft_contract?: string
  seller?: string
  status?: ListingStatus
  sort?: ListingSortOrder
  page?: number
  limit?: number
}

export interface AuctionFilters {
  chain_id?: number
  nft_contract?: string
  seller?: string
  status?: string
  sort?: AuctionSortOrder
  page?: number
  limit?: number
}

export interface BundleFilters {
  chain_id?: number
  seller?: string
  status?: string
  page?: number
  limit?: number
}

// ============================================================
// Offer Types
// ============================================================

export interface MarketplaceOffer {
  id: number
  offer_id: number
  chain_id: number
  offerer: string
  nft_contract: string
  token_id: string
  payment_token: string
  amount: string
  expiry: number
  status: string
  block_number: number
  block_timestamp: string
  tx_hash: string
  created_at: string
  updated_at: string
}

export interface OffersResponse {
  offers: MarketplaceOffer[]
  total: number
  page: number
  limit: number
}

export interface OfferFilters {
  chain_id?: number
  nft_contract?: string
  token_id?: string
  offerer?: string
  status?: string
  page?: number
  limit?: number
}

// ============================================================
// Query Param Types
// ============================================================

export type SortOrder = 'recent' | 'score' | 'name'

export interface AgentFilters {
  chain_id?: number
  search?: string
  category?: string
  sort?: SortOrder
  page?: number
  limit?: number
}

export interface ActivityFilters {
  event_type?: EventCategory
  page?: number
  limit?: number
}

export interface LeaderboardFilters {
  chain_id?: number
  category?: string
  limit?: number
}
