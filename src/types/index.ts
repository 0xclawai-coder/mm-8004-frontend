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

/** Agent detail (single agent view) */
export interface AgentDetail extends Agent {
  uri: string | null
  metadata: AgentMetadata | null
  positive_feedback_count: number | null
  negative_feedback_count: number | null
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

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
}

export interface ApiError {
  error: string
  message: string
  status: number
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
