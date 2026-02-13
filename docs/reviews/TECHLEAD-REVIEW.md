# Tech Lead Review — Molt Marketplace

**Reviewer:** Architecture & API Contract Review  
**Date:** 2025-02-13  
**Scope:** API spec vs implementation, architecture, type consistency, API completeness, cross-cutting concerns

---

## 1. API Spec vs Implementation

### 🔴 Critical

#### 1.1 — `docs/api-contract.md` is severely out of date; does not document any marketplace endpoints

The API contract doc describes 6 endpoints (agents, agent detail, reputation, activity, leaderboard, stats). The actual backend has **20+ endpoints** including the entire marketplace module:

| Implemented but undocumented | Route |
|---|---|
| `GET /api/marketplace/listings` | List fixed-price listings |
| `GET /api/marketplace/listings/:id` | Single listing detail (with embedded agent) |
| `GET /api/marketplace/offers` | List offers |
| `GET /api/marketplace/collection-offers` | List collection offers |
| `GET /api/marketplace/auctions` | List auctions |
| `GET /api/marketplace/auctions/:id` | Auction detail with bids |
| `GET /api/marketplace/dutch-auctions` | List dutch auctions |
| `GET /api/marketplace/bundles` | List bundles |
| `GET /api/marketplace/user/:address` | User portfolio |
| `GET /api/marketplace/stats` | Marketplace statistics |
| `GET /api/activity` | Global activity feed |
| `GET /api/agents/:id/marketplace` | Agent marketplace history |

**Impact:** Any developer or integration partner relying on the API contract will miss the entire marketplace surface. This must be brought up to date.

#### 1.2 — `/api/stats` response shape has diverged from the spec

The spec shows `StatsResponse` with only identity/reputation fields. The actual implementation adds four marketplace fields that break the documented contract:

```rust
// ACTUAL (not in spec)
pub total_listings: i64,
pub active_listings: i64,
pub total_sales: i64,
pub total_volume: BigDecimal,
```

Frontend `DashboardStats` type **does NOT include these fields**, meaning the frontend is silently dropping marketplace stats data from `/api/stats`.

#### 1.3 — `GET /api/agents` does not support `owner` filter in backend, but frontend Profile page sends `?owner=` query

In `frontend/src/app/profile/page.tsx` (line ~97):
```ts
url.searchParams.set('owner', address!)
```

But `AgentListParams` in the backend has no `owner` field — this parameter is silently ignored. The profile page falls back to on-chain querying, which works, but the intended behavior (API-based filtering by owner) is broken.

**Fix:** Add `owner: Option<String>` to `AgentListParams` and filter in `db::agents::get_agents`.

### 🟡 Important

#### 1.4 — `docs/shared-types.md` describes `created_at` on Agent; backend returns `block_timestamp` instead

The spec says `created_at: string` on the Agent type. The actual `AgentListItem` struct and the SQL query return `block_timestamp` (aliased from `COALESCE(a.block_timestamp, a.created_at)`). The frontend type also uses `block_timestamp`. The docs are stale here.

#### 1.5 — Spec says `GET /api/agents` returns `reputation_score` between 0.0–5.0; actual range is unconstrained

The backend computes `AVG(value / POWER(10, value_decimals))` without clamping to [0, 5]. If feedback values use different scales (percentage scores 0–100, Elo ratings 800–2000), the "reputation_score" could be any number. This is partially addressed by the `ScoreByTag` system but the aggregate score is still misleading.

#### 1.6 — Spec says `positive_feedback_count` = feedbacks where `value > 0`; actual uses threshold `>= 3`

```sql
-- ACTUAL
COUNT(CASE WHEN f.value / POWER(10, ...) >= 3 THEN 1 ELSE NULL END) AS positive_feedback_count
COUNT(CASE WHEN f.value / POWER(10, ...) < 3 THEN 1 ELSE NULL END) AS negative_feedback_count
```

The spec says `value > 0` for positive, `value <= 0` for negative. The implementation uses a 3.0 threshold instead. This discrepancy affects all agent detail views.

### ✅ Well Done

#### 1.7 — All 6 documented endpoints exist and work as specified

The original EIP-8004 agent endpoints (`/agents`, `/agents/:id`, `/agents/:id/reputation`, `/agents/:id/activity`, `/leaderboard`, `/stats`) are all implemented with the correct query parameters, path parsing, and response shapes.

#### 1.8 — Composite ID format `{chain_id}-{agent_id}` is consistently used

Both `parse_agent_id()` in agents.rs and `parse_id()` in marketplace.rs follow the documented `chainId-entityId` format with proper error handling.

---

## 2. Architecture Review

### ✅ Well Done

#### 2.1 — Data flow matches the architecture diagram perfectly

The documented flow `Events → Indexer → DB → API → Frontend` is accurately implemented:
- **Indexer** (alloy): polls `eth_getLogs` with parallel batching (10 concurrent batches of 100 blocks)
- **DB** (sqlx/PostgreSQL): clean separation between write operations (indexer) and read operations (API)
- **API** (Axum): stateless read-only handlers
- **Frontend** (Next.js + TanStack Query): client-side data fetching with caching

#### 2.2 — Indexer architecture is solid and production-ready

- Parallel batch processing with `PARALLEL_BATCHES = 10`
- Sequential consistency: breaks on first batch failure to avoid gaps
- Block timestamp caching to minimize RPC calls
- Cursor tracking per chain/contract pair
- Lazy connection pool: server starts accepting connections immediately while migrations run in background
- Migration retry with exponential backoff

#### 2.3 — Event → DB write → activity_log pipeline is well-designed

Marketplace events are cross-referenced with the agent identity contract (`maybe_insert_agent_activity`), so marketplace events for agent NFTs automatically appear in the agent's activity feed. This is a clever integration pattern.

### 🟡 Important

#### 2.4 — N+1 query risk in `/api/stats`

`get_stats()` executes **9 separate SQL queries** sequentially (total_agents, total_feedbacks, total_chains, agents_by_chain, top_categories, recent_registrations_24h, recent_feedbacks_24h, plus 3 marketplace queries). These should be consolidated into 1–2 queries or run concurrently with `tokio::join!`.

#### 2.5 — `get_listing` detail handler performs 3 sequential DB queries

```rust
// 1. Get listing
let listing = db::marketplace::get_listing_by_id(...)
// 2. Get agent detail
let agent = db::agents::get_agent_by_id(...)
// 3. Get agent scores
let scores = db::agents::get_scores_by_tag(...)
```

For a high-traffic listing page, this is suboptimal. Consider a single joined query or `tokio::join!` for the agent + scores lookups.

#### 2.6 — Listing detail response uses `serde_json::to_value` roundtrip instead of a proper response type

```rust
let mut response = serde_json::to_value(&l).unwrap();
response["agent"] = serde_json::to_value(&agent_detail).unwrap();
Ok(Json(response))
```

This bypasses type safety. A `ListingDetailResponse` struct should be defined.

### 🟢 Nice to Have

#### 2.7 — CORS is set to `allow_origin(Any)` with no environment-based restriction

While acceptable for development, the architecture doc mentions `CORS_ORIGINS` env var for production. The implementation currently ignores it and allows all origins.

#### 2.8 — Health check always returns 200 OK, even when "starting"

```rust
(StatusCode::OK, "starting")
```

This means load balancers will route traffic to the server before migrations are complete. Consider returning 503 until `ready` is true, or adding a separate `/ready` endpoint.

---

## 3. Type Consistency

### 🟡 Important

#### 3.1 — Frontend `DashboardStats` is missing marketplace fields from backend `StatsResponse`

**Backend (Rust):**
```rust
pub struct StatsResponse {
    // ... original fields ...
    pub total_listings: i64,
    pub active_listings: i64,
    pub total_sales: i64,
    pub total_volume: BigDecimal,
}
```

**Frontend (TypeScript):**
```typescript
interface DashboardStats {
    // ... original fields only — missing marketplace stats ...
}
```

The frontend silently drops `total_listings`, `active_listings`, `total_sales`, `total_volume` from the `/api/stats` response.

#### 3.2 — Backend `Feedback.value` is `BigDecimal`; frontend type says `number`

```rust
pub value: BigDecimal,  // Backend
```
```typescript
value: number           // Frontend
```

`BigDecimal` serializes as a string in JSON (e.g., `"4.500000"`). The frontend expects a JS number. This **may** work if serde serializes small decimals as numbers, but is a latent type mismatch that can cause runtime errors with large values.

#### 3.3 — Backend `AgentListItem.block_timestamp` vs docs `Agent.created_at`

The spec and docs use `created_at`. Backend uses `block_timestamp`. Frontend uses `block_timestamp`. The docs need updating, but at least frontend ↔ backend are in sync.

#### 3.4 — `MarketplaceOffer` frontend type is missing `accepted_by` field

Backend `MarketplaceOffer` has `accepted_by: Option<String>`, but the frontend TypeScript type omits it. This means if a frontend component needs to show who accepted an offer, the data is available from the API but not typed.

#### 3.5 — `docs/shared-types.md` has no marketplace types at all

The shared-types doc only covers agents, feedbacks, activities, leaderboard, and stats. All marketplace types (listings, offers, collection offers, auctions, bundles) are undocumented in the spec.

### ✅ Well Done

#### 3.6 — Core identity/reputation types are well-synchronized

The following types match across all three layers (docs, backend Rust, frontend TypeScript):
- `Agent` / `AgentListItem` — field names and types align
- `Activity` — including `event_type`, `event_data`, `block_number`, `tx_hash`, `log_index`
- `LeaderboardEntry` — all fields match
- `ErrorResponse` — consistent `{error, message, status}` pattern

#### 3.7 — `ScoreByTag` is a backend+frontend addition not in the original spec, but consistently implemented

Both Rust and TypeScript define identical shapes with `score_type`, `label`, `value`, `count`, `min_value`, `max_value`, `scale`.

#### 3.8 — Chain ID constants are consistent everywhere

`143` (mainnet) and `10143` (testnet) are consistently used across:
- `docs/shared-types.md` — `CHAIN_IDS` constant
- `frontend/src/lib/chains.ts` — `monadMainnet.id` and `monadTestnet.id`
- `backend/src/indexer/provider.rs` — `chain_id: 143` and `chain_id: 10143`
- Contract addresses match in all locations

---

## 4. API Completeness for Marketplace

### ✅ Well Done

#### 4.1 — Every marketplace entity has list + detail endpoints

| Entity | List | Detail | ✓ |
|--------|------|--------|---|
| Listings | `GET /marketplace/listings` | `GET /marketplace/listings/:id` | ✅ |
| Offers | `GET /marketplace/offers` | — (filtered by token_id) | ✅ |
| Collection Offers | `GET /marketplace/collection-offers` | — | ✅ |
| Auctions | `GET /marketplace/auctions` | `GET /marketplace/auctions/:id` (with bids) | ✅ |
| Dutch Auctions | `GET /marketplace/dutch-auctions` | — | ✅ |
| Bundles | `GET /marketplace/bundles` | — | ✅ |

#### 4.2 — User portfolio endpoint exists

`GET /marketplace/user/:address` returns all of a user's listings, offers, and auction bids in one call.

#### 4.3 — Marketplace stats endpoint exists

`GET /marketplace/stats` returns total_listings, active_listings, total_sales, total_volume, active_auctions.

### 🟡 Important

#### 4.4 — No detail endpoint for dutch auctions, bundles, offers, or collection offers

Users can list these entities but cannot retrieve a single item by ID. The frontend will need these for detail pages (e.g., `/trade/bundles/[chainId]/[bundleId]`). Currently the frontend has pages for auction details (`/trade/auctions/[chainId]/[auctionId]`) and listing details (`/trade/marketplace/[chainId]/[listingId]`) but no bundle detail page.

**Recommendation:** Add:
- `GET /marketplace/dutch-auctions/:id`
- `GET /marketplace/bundles/:id`
- `GET /marketplace/offers/:id`

#### 4.5 — No "offers received" endpoint for sellers

A seller needs to see offers received on their NFTs. Currently the offers endpoint only filters by `offerer` (buyer). There's no way to query "all offers on NFTs I own" without knowing every token_id.

**Recommendation:** Add `seller` or `nft_owner` filter to `/marketplace/offers` that JOINs with the agents table to find NFTs owned by the address.

#### 4.6 — Dutch auction listing doesn't support seller filter

`MarketplaceListParams` is reused for dutch auctions in the route handler, but the actual `get_dutch_auctions()` DB function doesn't accept a `seller` parameter — it only takes `chain_id`, `nft_contract`, and `status`. The `seller` field in the query params is silently ignored.

#### 4.7 — User portfolio is hardcoded to 50 items per entity with no pagination

```sql
LIMIT 50
```

Users with more than 50 listings or offers will see truncated results with no way to page through them.

#### 4.8 — No "collection floor price" or "collection stats" endpoint

For a marketplace, users typically want to see the floor price and total volume for a collection. This data could be derived from existing listings but requires a dedicated endpoint.

### 🟢 Nice to Have

#### 4.9 — No search/filtering for marketplace entities by agent name

Users might want to search listings by agent name (e.g., "find all listings for agents named 'LegalBot'"). Currently only filtering by `nft_contract` and `seller` is supported.

#### 4.10 — No "recently sold" endpoint

A feed of recent sales across the marketplace would be useful for the homepage/activity page.

#### 4.11 — No "price history" for a specific agent/NFT

For a given agent/NFT, showing historical sale prices would help users gauge fair value.

---

## 5. Cross-Cutting Concerns

### ✅ Well Done

#### 5.1 — Error handling is consistent across all API handlers

Every handler follows the same pattern:
```rust
.map_err(|e| {
    tracing::error!("...: {:?}", e);
    (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { ... }))
})
```

The `ErrorResponse` struct matches the documented format `{error, message, status}` everywhere.

#### 5.2 — Pagination pattern is consistent

All paginated endpoints use the same structure:
- Query params: `page` (1-indexed), `limit` (clamped to 1–100, default 20)
- Response: `{ data: [...], total, page, limit }` with entity-specific key names (`agents`, `listings`, `auctions`, etc.)
- Offset computation: `(page - 1) * limit`

#### 5.3 — Chain ID handling is clean and consistent

- Backend: `chain_id` is an `i32` field on all DB models and query params
- Frontend: chain definitions match backend expectations
- Contract addresses are consistent across all files
- Indexer configures both chains with env var overrides

#### 5.4 — Structured logging is well-implemented

The backend uses `tracing` with structured fields (`chain_id`, event names, entity IDs). Log levels are appropriate: `info` for normal operations, `warn` for recoverable issues, `error` for failures.

### 🟡 Important

#### 5.5 — No input validation for sort parameter values

The backend silently falls back to defaults for invalid sort values:
```rust
let order_clause = match sort {
    "score" => "...",
    "name" => "...",
    _ => "... recent ...", // catch-all default
};
```

The API spec says invalid values should return 400 Bad Request. Sending `?sort=invalid` silently succeeds with "recent" behavior.

#### 5.6 — SQL injection risk in `get_feedbacks_for_agent` and `get_reputation_history`

```rust
let query = format!(
    "... AND created_at >= NOW() - INTERVAL '{}' ...",
    interval_str  // "7 days", "30 days", "90 days"
);
```

While the actual values come from a match statement (not user input), using `format!` to build SQL strings is an anti-pattern. If the match were ever changed to accept user input, this would be a SQL injection vector. Use parameterized queries with `INTERVAL '1' DAY * $N` pattern.

#### 5.7 — Address case sensitivity inconsistency

- The `get_user_portfolio` handler lowercases the address: `address.to_lowercase()`
- But listing/offer/auction queries don't lowercase the `seller`/`offerer` params
- Ethereum addresses are case-insensitive but the DB stores them in lowercase (from `format!("{:#x}", ...)`)
- If a user passes a checksummed address to `/marketplace/listings?seller=0xAbCd...`, they'll get no results

**Fix:** Lowercase all address filters in query handlers, or use `LOWER()` in SQL.

#### 5.8 — No expiry checking for marketplace listings/offers

Listings and offers have an `expiry` timestamp, but the API doesn't filter out expired items when querying with `status=Active`. Users may see listings/offers that have already expired on-chain but haven't been cancelled via a transaction.

**Recommendation:** Add `AND (expiry = 0 OR expiry > EXTRACT(EPOCH FROM NOW()))` to active listing/offer queries, or add a periodic job to mark expired items.

### 🟢 Nice to Have

#### 5.9 — No request logging middleware for API calls

While `TraceLayer` from tower-http is added, there's no request-level logging of query parameters or response times for API endpoints. This would help with debugging and performance monitoring.

#### 5.10 — No ETag or cache-control headers

For high-traffic endpoints like `/api/agents` or `/api/leaderboard`, adding cache-control headers would reduce server load. The data is event-sourced so staleness of a few seconds is acceptable.

---

## Summary

| Category | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟡 Important | 13 |
| 🟢 Nice to have | 5 |
| ✅ Well done | 11 |

### Top 3 Priorities Before Launch

1. **🔴 Update `docs/api-contract.md` and `docs/shared-types.md`** — The marketplace is the core product but has zero API documentation. Integration partners, frontend devs, and future maintainers are flying blind.

2. **🔴 Add `owner` filter to `/api/agents`** — The Profile page's primary query is broken. Users can't reliably see their own agents through the API.

3. **🔴 Sync frontend `DashboardStats` type with backend `StatsResponse`** — Four fields of marketplace stats data are being silently dropped.

### Overall Assessment

The codebase is well-engineered with clean separation of concerns, consistent patterns, and a solid indexer architecture. The marketplace module (listings, auctions, dutch auctions, bundles, offers, collection offers) is comprehensively implemented at the contract-indexing and DB layers. The main gaps are documentation debt (the docs haven't kept pace with feature development) and a few missing convenience endpoints. The foundation is strong — the work needed is incremental, not structural.
