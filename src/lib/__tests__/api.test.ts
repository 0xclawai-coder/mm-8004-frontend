import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test the API module's URL construction and parameter building logic.
// Since the module uses `fetch` internally, we mock `fetch` globally.

describe('API module', () => {
  const originalFetch = globalThis.fetch
  const MOCK_API_BASE = 'http://localhost:3001/api'

  beforeEach(() => {
    // Reset modules so we get fresh imports each time
    vi.resetModules()
    // Set the environment variable
    process.env.NEXT_PUBLIC_API_URL = MOCK_API_BASE
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    delete process.env.NEXT_PUBLIC_API_URL
  })

  describe('URL construction', () => {
    it('builds URL for /agents endpoint', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({ agents: [], total: 0, page: 1, limit: 20 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      await getAgents()
      expect(capturedUrl).toContain('/agents')
    })

    it('builds URL with chain_id filter parameter', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({ agents: [], total: 0, page: 1, limit: 20 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      await getAgents({ chain_id: 143 })
      const parsed = new URL(capturedUrl)
      expect(parsed.searchParams.get('chain_id')).toBe('143')
    })

    it('builds URL with search and category filters', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({ agents: [], total: 0, page: 1, limit: 20 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      await getAgents({ search: 'defi bot', category: 'DeFi', sort: 'score' })
      const parsed = new URL(capturedUrl)
      expect(parsed.searchParams.get('search')).toBe('defi bot')
      expect(parsed.searchParams.get('category')).toBe('DeFi')
      expect(parsed.searchParams.get('sort')).toBe('score')
    })

    it('omits undefined and empty parameters', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({ agents: [], total: 0, page: 1, limit: 20 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      await getAgents({ search: '', category: undefined })
      const parsed = new URL(capturedUrl)
      expect(parsed.searchParams.has('search')).toBe(false)
      expect(parsed.searchParams.has('category')).toBe(false)
    })

    it('builds URL for agent detail endpoint', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgent } = await import('../api')
      await getAgent('143-1')
      expect(capturedUrl).toContain('/agents/143-1')
    })

    it('builds URL for agent reputation endpoint', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgentReputation } = await import('../api')
      await getAgentReputation('143-1', '7d')
      const parsed = new URL(capturedUrl)
      expect(capturedUrl).toContain('/agents/143-1/reputation')
      expect(parsed.searchParams.get('range')).toBe('7d')
    })

    it('builds URL for agent activity endpoint', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgentActivity } = await import('../api')
      await getAgentActivity('10143-5', { event_type: 'identity', page: 2, limit: 10 })
      const parsed = new URL(capturedUrl)
      expect(capturedUrl).toContain('/agents/10143-5/activity')
      expect(parsed.searchParams.get('event_type')).toBe('identity')
      expect(parsed.searchParams.get('page')).toBe('2')
      expect(parsed.searchParams.get('limit')).toBe('10')
    })

    it('builds URL for leaderboard endpoint with filters', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({ leaderboard: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getLeaderboard } = await import('../api')
      await getLeaderboard({ chain_id: 143, category: 'DeFi', limit: 10 })
      const parsed = new URL(capturedUrl)
      expect(capturedUrl).toContain('/leaderboard')
      expect(parsed.searchParams.get('chain_id')).toBe('143')
      expect(parsed.searchParams.get('category')).toBe('DeFi')
      expect(parsed.searchParams.get('limit')).toBe('10')
    })

    it('builds URL for stats endpoint', async () => {
      let capturedUrl = ''
      globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
        capturedUrl = url.toString()
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getStats } = await import('../api')
      await getStats()
      expect(capturedUrl).toContain('/stats')
    })
  })

  describe('Error handling', () => {
    it('throws on non-OK response', async () => {
      const errorBody = { error: 'Not found', message: 'Agent not found', status: 404 }
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify(errorBody), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgent } = await import('../api')
      await expect(getAgent('143-999')).rejects.toEqual(errorBody)
    })

    it('throws on 500 server error', async () => {
      const errorBody = { error: 'Internal Server Error', message: 'DB failure', status: 500 }
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify(errorBody), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      await expect(getAgents()).rejects.toEqual(errorBody)
    })
  })

  describe('Response parsing', () => {
    it('returns parsed JSON on success', async () => {
      const mockResponse = {
        agents: [
          {
            agent_id: 1,
            chain_id: 143,
            owner: '0xabc',
            name: 'TestAgent',
            description: 'Test',
            image: '',
            categories: ['DeFi'],
            x402_support: true,
            active: true,
            reputation_score: 4.5,
            feedback_count: 10,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      }
      globalThis.fetch = vi.fn(async () => {
        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }) as unknown as typeof fetch

      const { getAgents } = await import('../api')
      const result = await getAgents()
      expect(result.agents).toHaveLength(1)
      expect(result.agents[0].name).toBe('TestAgent')
      expect(result.total).toBe(1)
    })
  })
})
