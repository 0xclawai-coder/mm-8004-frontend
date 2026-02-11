import { describe, it, expect } from 'vitest'
import type {
  Agent,
  AgentDetail,
  Feedback,
  Activity,
  EventType,
  LeaderboardEntry,
  DashboardStats,
  ReputationHistory,
  ReputationRange,
  AgentsResponse,
  ActivitiesResponse,
  LeaderboardResponse,
  ApiError,
  AgentFilters,
  ActivityFilters,
  LeaderboardFilters,
  SortOrder,
} from '../../types'

describe('Type compatibility tests', () => {
  describe('Agent type', () => {
    it('creates a valid Agent object', () => {
      const agent: Agent = {
        agent_id: 1,
        chain_id: 143,
        owner: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Test Agent',
        description: 'A test agent for DeFi',
        image: 'https://example.com/image.png',
        categories: ['DeFi', 'Trading'],
        x402_support: true,
        active: true,
        reputation_score: 4.5,
        feedback_count: 25,
        block_timestamp: '2024-01-15T10:30:00Z',
      }

      expect(agent.agent_id).toBe(1)
      expect(agent.chain_id).toBe(143)
      expect(agent.owner).toBe('0x1234567890abcdef1234567890abcdef12345678')
      expect(agent.categories).toContain('DeFi')
      expect(agent.x402_support).toBe(true)
    })

    it('allows testnet chain_id (10143)', () => {
      const agent: Agent = {
        agent_id: 42,
        chain_id: 10143,
        owner: '0xabcdef',
        name: 'Testnet Agent',
        description: '',
        image: '',
        categories: [],
        x402_support: false,
        active: true,
        reputation_score: 0,
        feedback_count: 0,
        block_timestamp: '2024-06-01T00:00:00Z',
      }

      expect(agent.chain_id).toBe(10143)
    })
  })

  describe('AgentDetail type', () => {
    it('extends Agent with additional fields', () => {
      const detail: AgentDetail = {
        agent_id: 1,
        chain_id: 143,
        owner: '0xowner',
        name: 'Detail Agent',
        description: 'Detailed description',
        image: 'https://example.com/detail.png',
        categories: ['Legal'],
        x402_support: true,
        active: true,
        reputation_score: 8.5,
        feedback_count: 50,
        block_timestamp: '2024-01-01T00:00:00Z',
        uri: 'https://agent.example.com/metadata.json',
        metadata: {
          version: '1.0',
          endpoints: [{ url: 'https://api.example.com', protocol: 'x402' }],
          capabilities: ['consult', 'review'],
        },
        positive_feedback_count: 45,
        negative_feedback_count: 5,
      }

      expect(detail.uri).toBe('https://agent.example.com/metadata.json')
      expect(detail.metadata).not.toBeNull()
      expect(detail.metadata!.version).toBe('1.0')
      expect(detail.positive_feedback_count).toBe(45)
      expect(detail.negative_feedback_count).toBe(5)
    })

    it('allows null metadata', () => {
      const detail: AgentDetail = {
        agent_id: 2,
        chain_id: 10143,
        owner: '0xowner2',
        name: 'No Metadata Agent',
        description: '',
        image: '',
        categories: [],
        x402_support: false,
        active: true,
        reputation_score: 0,
        feedback_count: 0,
        block_timestamp: '2024-01-01T00:00:00Z',
        uri: '',
        metadata: null,
        positive_feedback_count: 0,
        negative_feedback_count: 0,
      }

      expect(detail.metadata).toBeNull()
    })
  })

  describe('Feedback type', () => {
    it('creates a valid Feedback object', () => {
      const feedback: Feedback = {
        id: 1,
        agent_id: 1,
        chain_id: 143,
        client_address: '0xclient',
        feedback_index: 0,
        value: 5,
        value_decimals: 0,
        tag1: 'quality',
        tag2: 'speed',
        endpoint: 'https://api.example.com/service',
        feedback_uri: 'https://feedback.example.com/1',
        feedback_hash: '0xhash123',
        revoked: false,
        tx_hash: '0xtx123',
        block_number: 500,
        block_timestamp: '2024-02-01T00:00:00Z',
      }

      expect(feedback.value).toBe(5)
      expect(feedback.revoked).toBe(false)
      expect(feedback.tag1).toBe('quality')
    })
  })

  describe('Activity type', () => {
    it('creates a valid Activity object', () => {
      const activity: Activity = {
        id: 1,
        agent_id: 1,
        chain_id: 143,
        event_type: 'Registered',
        event_data: { owner: '0xowner', uri: 'https://example.com' },
        block_number: 1000,
        tx_hash: '0xtxhash',
        log_index: 0,
        block_timestamp: '2024-01-01T00:00:00Z',
      }

      expect(activity.event_type).toBe('Registered')
      expect(activity.block_number).toBe(1000)
    })

    it('supports all EventType values', () => {
      const eventTypes: EventType[] = [
        'Registered',
        'URIUpdated',
        'MetadataSet',
        'NewFeedback',
        'FeedbackRevoked',
        'ResponseAppended',
      ]

      expect(eventTypes).toHaveLength(6)
      expect(eventTypes).toContain('Registered')
      expect(eventTypes).toContain('FeedbackRevoked')
    })
  })

  describe('LeaderboardEntry type', () => {
    it('creates a valid LeaderboardEntry', () => {
      const entry: LeaderboardEntry = {
        rank: 1,
        agent_id: 5,
        chain_id: 143,
        name: 'Top Agent',
        image: 'https://img.example.com/top.png',
        categories: ['DeFi', 'Arbitrage'],
        x402_support: true,
        reputation_score: 9.8,
        feedback_count: 200,
        owner: '0xtopowner',
      }

      expect(entry.rank).toBe(1)
      expect(entry.reputation_score).toBe(9.8)
    })
  })

  describe('DashboardStats type', () => {
    it('creates a valid DashboardStats object', () => {
      const stats: DashboardStats = {
        total_agents: 100,
        total_feedbacks: 500,
        total_chains: 2,
        agents_by_chain: { '143': 60, '10143': 40 },
        top_categories: [
          { category: 'DeFi', count: 30 },
          { category: 'Trading', count: 20 },
        ],
        recent_registrations_24h: 5,
        recent_feedbacks_24h: 15,
      }

      expect(stats.total_agents).toBe(100)
      expect(stats.agents_by_chain['143']).toBe(60)
      expect(stats.top_categories).toHaveLength(2)
      expect(stats.top_categories[0].category).toBe('DeFi')
    })
  })

  describe('ReputationHistory type', () => {
    it('creates a valid ReputationHistory', () => {
      const history: ReputationHistory = {
        agent_id: 1,
        chain_id: 143,
        current_score: 7.5,
        history: [
          { date: '2024-01-01', score: 5.0, feedback_count: 5 },
          { date: '2024-01-15', score: 7.5, feedback_count: 10 },
        ],
        feedbacks: [],
      }

      expect(history.current_score).toBe(7.5)
      expect(history.history).toHaveLength(2)
      expect(history.history[1].score).toBe(7.5)
    })
  })

  describe('API response types', () => {
    it('creates a valid AgentsResponse', () => {
      const response: AgentsResponse = {
        agents: [],
        total: 0,
        page: 1,
        limit: 20,
      }

      expect(response.agents).toHaveLength(0)
      expect(response.page).toBe(1)
      expect(response.limit).toBe(20)
    })

    it('creates a valid ActivitiesResponse', () => {
      const response: ActivitiesResponse = {
        activities: [],
        total: 0,
        page: 1,
        limit: 20,
      }

      expect(response.activities).toHaveLength(0)
    })

    it('creates a valid LeaderboardResponse', () => {
      const response: LeaderboardResponse = {
        leaderboard: [],
      }

      expect(response.leaderboard).toHaveLength(0)
    })

    it('creates a valid ApiError', () => {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Invalid agent id format',
        status: 400,
      }

      expect(error.status).toBe(400)
      expect(error.error).toBe('Bad Request')
    })
  })

  describe('Agent ID format parsing', () => {
    it('parses a valid mainnet agent ID', () => {
      const id = '143-1'
      const parts = id.split('-')
      expect(parts).toHaveLength(2)
      expect(Number(parts[0])).toBe(143)
      expect(Number(parts[1])).toBe(1)
    })

    it('parses a valid testnet agent ID', () => {
      const id = '10143-42'
      const parts = id.split('-')
      expect(parts).toHaveLength(2)
      expect(Number(parts[0])).toBe(10143)
      expect(Number(parts[1])).toBe(42)
    })

    it('constructs agent ID from chain_id and agent_id', () => {
      const chainId = 143
      const agentId = 7
      const id = `${chainId}-${agentId}`
      expect(id).toBe('143-7')
    })

    it('rejects an ID without a dash', () => {
      const id = '143'
      const parts = id.split('-')
      expect(parts).toHaveLength(1)
      // No second part — invalid format
      expect(parts[1]).toBeUndefined()
    })

    it('handles large agent IDs', () => {
      const id = '143-999999999'
      const parts = id.split('-')
      expect(Number(parts[1])).toBe(999999999)
    })
  })

  describe('Query filter types', () => {
    it('creates AgentFilters with all fields', () => {
      const filters: AgentFilters = {
        chain_id: 143,
        search: 'defi agent',
        category: 'DeFi',
        sort: 'score',
        page: 2,
        limit: 10,
      }

      expect(filters.chain_id).toBe(143)
      expect(filters.sort).toBe('score')
    })

    it('allows minimal AgentFilters (all optional)', () => {
      const filters: AgentFilters = {}
      expect(filters.chain_id).toBeUndefined()
      expect(filters.search).toBeUndefined()
    })

    it('validates SortOrder values', () => {
      const sorts: SortOrder[] = ['recent', 'score', 'name']
      expect(sorts).toHaveLength(3)
    })

    it('validates ReputationRange values', () => {
      const ranges: ReputationRange[] = ['7d', '30d', '90d', 'all']
      expect(ranges).toHaveLength(4)
    })

    it('creates ActivityFilters', () => {
      const filters: ActivityFilters = {
        event_type: 'identity',
        page: 1,
        limit: 50,
      }

      expect(filters.event_type).toBe('identity')
    })

    it('creates LeaderboardFilters', () => {
      const filters: LeaderboardFilters = {
        chain_id: 10143,
        category: 'Trading',
        limit: 25,
      }

      expect(filters.chain_id).toBe(10143)
      expect(filters.limit).toBe(25)
    })
  })
})
