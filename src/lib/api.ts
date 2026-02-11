import type {
  AgentDetail,
  AgentFilters,
  AgentsResponse,
  ActivitiesResponse,
  ActivityFilters,
  DashboardStats,
  LeaderboardFilters,
  LeaderboardResponse,
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
