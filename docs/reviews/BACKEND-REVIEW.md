# Molt Marketplace — Backend Code Review

**Reviewer:** Backend Developer (Rust)  
**Date:** 2026-02-13  
**Scope:** `~/molt-marketplace-8004/backend/` — Rust backend (Axum + sqlx + alloy)

---

## Summary

The codebase is well-structured for a blockchain indexer + REST API. Solid use of sqlx parameterized queries, proper error propagation, and a clean module layout. The major concerns are around **missing database indexes on key query columns**, a **potential SQL injection vector in interval formatting**, the **stats endpoint making 11 sequential DB queries**, and **no rate limiting**.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟡 Important | 9 |
| 🟢 Nice to have | 7 |
| ✅ Well done | 8 |

---

## 1. Code Quality

### 🟡 1.1 Clippy Warnings (14 total)

`cargo clippy` reports 14 warnings:

- **5 dead code warnings:** `Agent`, `AgentMetadata`, `AgentEndpoint`, `FeedbackResponse`, `IndexerState` structs in `src/types/mod.rs` are never constructed (only used for `FromRow` deserialization). Also `update_last_block` in `src/db/indexer_state.rs:25` is unused (superseded by `update_last_block_with_name`).
- **5 too-many-arguments warnings:** Functions with 8 params (`get_listings`, `get_offers`, `get_auctions`, `insert_auction_bid`, `insert_feedback_response`). Consider using query/filter structs.
- **1 redundant local:** `src/indexer/mod.rs:287` — `let contract_type = contract_type;` is a no-op.
- **1 `.is_multiple_of()` suggestion:** `src/indexer/backfill.rs:105` — `filled % 50 == 0` should use `.is_multiple_of(50)`.

### 🟡 1.2 `unwrap()` Calls in Production Paths

**`src/api/marketplace.rs:136-139`** — `get_listing` handler:
```rust
let mut response = serde_json::to_value(&l).unwrap();  // line 136
response["agent"] = serde_json::to_value(&agent_detail).unwrap();  // line 139
```
These serialize well-known types and are extremely unlikely to panic, but a `map_err` → 500 response would be more defensive.

**`src/indexer/mod.rs:272-273`** — `batches.first().unwrap()` / `batches.last().unwrap()`:
```rust
let total_from = batches.first().unwrap().0;
let total_to = batches.last().unwrap().1;
```
Guarded by `if batches.is_empty() { return Ok(None); }` above, so safe in practice. But worth a comment or using `expect("batches checked non-empty above")`.

**`src/indexer/backfill.rs:72`** — `providers.get(chain_id).unwrap()`:
Safe (just inserted on line 70), but fragile to refactors.

### ✅ 1.3 Error Propagation

Error handling is solid across the codebase:
- All DB functions return `Result<_, sqlx::Error>` and use `?` correctly.
- API handlers consistently use `.map_err()` to convert to `(StatusCode, Json<ErrorResponse>)`.
- Indexer logs errors but continues processing — resilient approach for event indexing.

### ✅ 1.4 `expect()` Usage — Appropriate

All `expect()` calls are in startup paths (`main.rs:38,43,74,120`, `provider.rs:97-123`) where panicking is the correct behavior if DATABASE_URL is missing or addresses are malformed.

---

## 2. Database Optimization

### 🔴 2.1 Missing Index on `agents.owner`

**Multiple queries filter by `owner`** (user portfolio, transfer updates), but there's no index on `agents.owner`.

**File:** `migrations/001_agents.sql`  
**Queries affected:**
- `src/db/agents.rs:215` — `UPDATE agents SET owner = $3 WHERE agent_id = $1 AND chain_id = $2` (OK, uses UNIQUE index)
- But any future "list agents by owner" query will seq-scan.

**Fix:**
```sql
CREATE INDEX idx_agents_owner ON agents(owner);
```

### 🔴 2.2 Missing Index on `feedbacks(agent_id, chain_id, revoked)` for Score Computation

The most expensive queries are the reputation score aggregations that filter by `revoked = false`:

**`src/db/agents.rs:30-45`** (used on every agent list page):
```sql
LEFT JOIN feedbacks f ON a.agent_id = f.agent_id AND a.chain_id = f.chain_id
...
AVG(CASE WHEN f.revoked = false THEN f.value / POWER(10, ...) ELSE NULL END)
```

**`src/db/agents.rs:131-143`** — `get_scores_by_tag`:
```sql
WHERE agent_id = $1 AND chain_id = $2 AND revoked = false AND tag1 IS NOT NULL
GROUP BY tag1
```

The existing index `idx_feedbacks_agent(agent_id, chain_id)` helps with the join, but a **covering index** including `revoked` would eliminate filter scans:

```sql
CREATE INDEX idx_feedbacks_agent_revoked ON feedbacks(agent_id, chain_id, revoked);
```

### 🔴 2.3 `get_stats` Endpoint — 11 Sequential DB Round-Trips

**`src/api/stats.rs:29-110`** fires **11 separate queries** sequentially:

1. `COUNT(*) FROM agents WHERE active = true`
2. `COUNT(*) FROM feedbacks WHERE revoked = false`
3. `COUNT(DISTINCT chain_id) FROM agents`
4. `SELECT chain_id, COUNT(*) FROM agents ... GROUP BY chain_id`
5. Top categories (UNNEST + GROUP BY)
6. Recent registrations 24h
7. Recent feedbacks 24h
8. `COUNT(*) FROM marketplace_listings` (total)
9. `COUNT(*) FROM marketplace_listings WHERE status = 'Active'`
10. `COUNT(*) FROM marketplace_listings WHERE status = 'Sold'`
11. `SUM(sold_price) FROM marketplace_listings WHERE status = 'Sold'`

**Under load:** This could take 50-200ms per request, multiplied by concurrent users.

**Fix:** Combine into 1-2 queries using CTEs or a single query with conditional aggregation:
```sql
SELECT
    COUNT(*) FILTER (WHERE status = 'Active') AS active_listings,
    COUNT(*) FILTER (WHERE status = 'Sold') AS total_sales,
    COALESCE(SUM(sold_price) FILTER (WHERE status = 'Sold'), 0) AS total_volume,
    COUNT(*) AS total_listings
FROM marketplace_listings
```

### 🟡 2.4 `get_marketplace_stats` — Duplicate Logic

**`src/db/marketplace.rs:666-695`** is essentially a copy of the marketplace portion of `get_stats`. DRY violation — if one changes, the other won't.

### 🟡 2.5 `feedbacks` Range Queries Missing Timestamp Index

**`src/db/feedbacks.rs:21,73`** filter `created_at >= NOW() - INTERVAL '30 days'` but `feedbacks` has **no index on `created_at`**. For large feedback tables, this is a full table scan.

**Fix:**
```sql
CREATE INDEX idx_feedbacks_created ON feedbacks(created_at);
```

### 🟡 2.6 Unbounded Feedback Queries

**`src/db/feedbacks.rs:40-50`** — When `range = "all"`:
```sql
SELECT ... FROM feedbacks WHERE agent_id = $1 AND chain_id = $2 ORDER BY created_at DESC
```
No `LIMIT`. An agent with thousands of feedbacks returns **all rows** in one response. This could return multi-MB responses.

**Fix:** Add a reasonable limit (e.g., 500) or paginate.

### 🟡 2.7 `token_id::BIGINT` Cast in JOIN

**`src/db/marketplace.rs:115,555`:**
```sql
LEFT JOIN agents a ON a.agent_id = l.token_id::BIGINT AND a.chain_id = l.chain_id
```
`token_id` is `NUMERIC` — casting to `BIGINT` on every row in the join prevents index usage on `agents(agent_id, chain_id)`. PostgreSQL may not be able to use the unique index because the cast creates a type mismatch. Consider storing `token_id` as `BIGINT` in marketplace tables, or creating a functional index.

### ✅ 2.8 Good Index Coverage on Marketplace Tables

`migrations/009_marketplace.sql` has comprehensive indexes: status, seller, nft_contract+token_id, chain_id, block_number — covering the common query patterns well.

### ✅ 2.9 Pagination Properly Clamped

All pagination params clamp `limit` to `1..=100` and `page` to `>= 1`. No risk of unbounded queries from the API layer (except feedbacks as noted in 2.6).

---

## 3. Indexer Reliability

### 🟡 3.1 No Retry Logic for RPC Failures

**`src/indexer/mod.rs:89-100`** — `index_chain` makes RPC calls but any failure is just logged:
```rust
Err(e) => {
    tracing::error!(chain_id = chain.chain_id, "Indexer error for chain {}: {:?}", ...);
}
```
The outer `loop` retries on the next cycle (2s later), which is functional. But individual `get_logs` failures within `index_identity_events` / `index_reputation_events` bubble up via `?` and abandon the entire batch.

**No exponential backoff for RPC rate limits.** If the RPC is temporarily throttled, the indexer hammers it every 2 seconds.

**Suggestion:** Add retry with backoff for `provider.get_logs()` calls, especially since `PARALLEL_BATCHES = 10` means 10 concurrent RPC requests.

### ✅ 3.2 Crash Recovery — Block Cursor Persistence

The indexer persists `last_block` in `indexer_state` table per (chain_id, contract_address). On restart, it resumes from the last completed block. This is correct and well-implemented.

**`src/indexer/mod.rs:138-167`** — State is only updated after successful batch processing, and on batch failure it stops at the last successful sequential block. This prevents gaps.

### 🟡 3.3 Parallel Batch Ordering Issue

**`src/indexer/mod.rs:289-318`** — Batches run concurrently via `tokio::spawn`, but results are awaited **in order**:
```rust
for (i, handle) in handles.into_iter().enumerate() {
    match handle.await {
        Ok(Ok(())) => { highest_completed = Some(to as i64); }
        Ok(Err(e)) => { break; } // Stop at first failure
```

If batch 3 succeeds but batch 2 fails, the cursor is set to batch 1's end. Batch 3's work is **lost and will be re-indexed**. This is safe (idempotent upserts) but wasteful. The current approach is a reasonable tradeoff.

### ✅ 3.4 Block Timestamp Caching

**`src/indexer/identity.rs:68-77`** caches block timestamps per-block within each batch call, avoiding duplicate RPC calls for events in the same block. Good optimization.

### 🟡 3.5 Metadata Fetch — Fire and Forget

**`src/indexer/identity.rs:134-143`:**
```rust
tokio::spawn(async move {
    metadata::fetch_and_update_metadata(&pool_clone, agent_id, chain_id, &uri_clone).await;
});
```
If this task panics or the HTTP fetch hangs beyond 15s timeout, the agent stays with NULL metadata until the URI is updated again. Consider:
- A retry queue or background job for failed fetches
- Logging a metric for failed metadata fetches

### ✅ 3.6 Event Processing Is Idempotent

All DB writes use `ON CONFLICT ... DO UPDATE` (upserts), so re-indexing the same block range is safe. Activity logs do get duplicated (plain INSERTs without dedup), but this is minor since re-indexing only happens on failures.

---

## 4. API Layer

### 🔴 4.1 No Rate Limiting

There is **no rate limiting** anywhere in the API. Any endpoint can be hammered:
- `GET /api/stats` — 11 DB queries per request
- `GET /api/leaderboard` — expensive aggregation query
- `GET /api/agents` — full-text search (ILIKE)

**Mitigation:** Add `tower::limit::RateLimitLayer` or `tower_governor` crate:
```rust
use tower::limit::RateLimitLayer;
let rate_limit = RateLimitLayer::new(100, std::time::Duration::from_secs(60));
```

### 🟡 4.2 CORS — Wide Open

**`src/main.rs:55-58`:**
```rust
let cors = CorsLayer::new()
    .allow_origin(Any)
    .allow_methods(Any)
    .allow_headers(Any);
```
Comment says "for development" but this runs in production. Should restrict `allow_origin` to the actual frontend domain(s).

### ✅ 4.3 Input Validation — Good

- `parse_agent_id()` in `src/api/agents.rs:26-53` validates format with clear error messages.
- Pagination params are clamped (`clamp(1, 100)`).
- Sort parameters whitelist valid values via `match` (safe from injection since they're not interpolated into SQL... wait, they are — see 5.2).

### ✅ 4.4 Consistent Error Responses

All handlers return `(StatusCode, Json<ErrorResponse>)` with structured error, message, and status code. Good DX for frontend consumers.

---

## 5. Security

### 🔴 5.1 Interval String Interpolation — Potential SQL Injection Surface

**`src/db/feedbacks.rs:21-31`:**
```rust
let interval = match range {
    "7d" => Some("7 days"),
    "30d" => Some("30 days"),
    "90d" => Some("90 days"),
    _ => None,
};
// ...
let query = format!(
    "... AND created_at >= NOW() - INTERVAL '{}' ...",
    interval_str
);
```

**Currently safe** because `interval_str` comes from a hardcoded `match` (only "7 days", "30 days", "90 days"). However, this pattern is **fragile** — if someone later adds user input to the match arm, it becomes a SQL injection vector. Same pattern on line 73.

**Fix:** Use parameterized interval:
```sql
AND created_at >= NOW() - ($3 || ' days')::INTERVAL
```
Or keep the match but add a comment: `// SAFETY: interval_str is from a hardcoded whitelist, not user input`.

### ✅ 5.2 Dynamic ORDER BY — Safe

**`src/db/agents.rs:22-25`** and **`src/db/marketplace.rs:105-109`** use `format!` for ORDER BY:
```rust
let order_clause = match sort {
    "score" => "reputation_score DESC NULLS LAST",
    "name" => "a.name ASC NULLS LAST",
    _ => "a.created_at DESC NULLS LAST",
};
let base_query = format!("... ORDER BY {} ...", order_clause);
```
**Safe** — `order_clause` is always from a hardcoded match, never from user input.

### ✅ 5.3 Parameterized Queries Throughout

All user-supplied values (chain_id, search, address, etc.) are bound via `$1, $2, ...` parameters. sqlx enforces type safety. No raw string interpolation of user input into SQL.

### ✅ 5.4 No Hardcoded Secrets

- `DATABASE_URL` from env var (`main.rs:38`)
- RPC URLs from env vars with public defaults (`provider.rs:88,113`)
- Marketplace addresses from env vars (`provider.rs:92,116`)
- No API keys, private keys, or tokens in source.

### 🟢 5.5 No Request Body Size Limits

The API is read-only (all GET endpoints), so request body attacks are not a concern. But if POST endpoints are added later, Axum's default body limit should be configured.

---

## 6. Performance

### ✅ 6.1 Connection Pooling — Properly Configured

**`src/main.rs:39-42`:**
```rust
PgPoolOptions::new()
    .max_connections(10)
    .acquire_timeout(Duration::from_secs(30))
    .connect_lazy(&database_url)
```
Lazy connection (server starts immediately), 10 max connections, 30s timeout. Good for Railway deployment.

### 🟡 6.2 Leaderboard Query — Expensive at Scale

**`src/api/leaderboard.rs:24-50`:**
```sql
SELECT ROW_NUMBER() OVER (...), a.agent_id, ...
    AVG(CASE WHEN f.revoked = false THEN f.value / POWER(10, ...) END) AS reputation_score,
    COUNT(CASE WHEN f.revoked = false THEN 1 END) AS feedback_count
FROM agents a LEFT JOIN feedbacks f ON ...
WHERE a.active = true AND ...
GROUP BY a.id
HAVING COUNT(...) > 0
ORDER BY reputation_score DESC
LIMIT $3
```
This joins **all agents** with **all feedbacks**, computes per-agent aggregates, then sorts. With 10K agents and 100K feedbacks, this could take seconds.

**Fix:** Materialize reputation scores in a separate column or materialized view, updated on each new feedback.

### 🟡 6.3 Stats Endpoint — Bottleneck Under Load

As noted in 2.3, the `/api/stats` endpoint runs 11 queries sequentially. Each one is simple, but the total round-trip time adds up. Consider:
1. Running independent queries concurrently with `tokio::join!`
2. Caching the result for 30-60 seconds (most stats don't need to be real-time)

### 🟢 6.4 `reqwest::Client` Created Per Metadata Fetch

**`src/indexer/metadata.rs:93-95`:**
```rust
let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(15))
    .build()?;
```
A new HTTP client (with new connection pool) is created for each metadata fetch. Should be a shared `static` or passed as a parameter.

### 🟢 6.5 No Response Caching

Frequently-accessed endpoints (`/api/stats`, `/api/leaderboard`) return the same data for all users but recompute on every request. Even a 30-second in-memory cache would dramatically reduce DB load.

### ✅ 6.6 Async All the Way

No blocking calls in async context (no `std::fs`, no `std::thread::sleep`). All I/O is properly async via `sqlx`, `reqwest`, and `alloy`.

### ✅ 6.7 Parallel Indexing

The indexer runs up to 10 parallel batch fetches per contract type, and indexes Identity, Reputation, and Marketplace contracts concurrently via `tokio::join!`. Good throughput design.

---

## 7. Additional Findings

### 🟢 7.1 Duplicate `parse_agent_id` / `parse_id` Functions

**`src/api/agents.rs:26-53`** and **`src/api/marketplace.rs:42-69`** have identical ID parsing logic with different function names. Extract to a shared utility.

### 🟢 7.2 Activity Log Deduplication

**`src/db/activity.rs:107-117`** — `insert_activity` is a plain INSERT with no `ON CONFLICT`. If the indexer re-processes a block range (e.g., after crash), activity entries are duplicated. Consider adding a unique constraint on `(chain_id, tx_hash, log_index)`.

### 🟢 7.3 `value_raw as f64` Precision Loss

**`src/indexer/reputation.rs:160`:**
```rust
let normalized_value = value_raw as f64 / 10f64.powi(value_decimals);
```
`value_raw` is an `int128` — casting to `f64` loses precision for values > 2^53. For the activity log's `event_data` JSON this is acceptable, but worth noting.

### 🟢 7.4 IPFS Gateway — Single Point of Failure

**`src/indexer/metadata.rs:89`:**
```rust
format!("https://ipfs.io/ipfs/{}", cid_path)
```
Uses only `ipfs.io`. If it's down, all metadata fetches fail. Consider a fallback gateway list (`cloudflare-ipfs.com`, `gateway.pinata.cloud`).

### 🟢 7.5 Missing `created_at` Index on `activity_log`

The `activity_log` table has `block_timestamp` added in migration 007 and is queried via `block_number DESC, log_index DESC` ordering. The existing `idx_activity_block` index handles this. However, the `COALESCE(block_timestamp, created_at)` fallback in queries means `created_at` ordering could be needed as a fallback — currently covered by the block_number index.

---

## 8. What's Done Well

| # | What | Where |
|---|------|-------|
| ✅ | Clean module separation (api/db/indexer/types) | Project structure |
| ✅ | Proper error propagation with `?` | All `src/db/*.rs` |
| ✅ | Parameterized SQL everywhere (no injection risk) | All queries use `$1, $2` binds |
| ✅ | Idempotent upserts for re-indexing safety | `ON CONFLICT DO UPDATE` in all upserts |
| ✅ | Block cursor persistence for crash recovery | `indexer_state` table |
| ✅ | Pagination clamped to prevent abuse | `types/mod.rs` — `clamp(1, 100)` |
| ✅ | Migration retry with exponential backoff | `main.rs:82-99` |
| ✅ | Lazy DB connection — server starts fast | `connect_lazy()` in `main.rs:40` |

---

## Priority Action Items

1. **🔴 Add rate limiting** — tower-based, at minimum on expensive endpoints
2. **🔴 Add missing indexes** — `agents.owner`, `feedbacks(created_at)`, `feedbacks(agent_id, chain_id, revoked)`
3. **🔴 Consolidate stats queries** — 11→2 queries using FILTER/CTE
4. **🔴 Limit unbounded feedback queries** — add LIMIT to "all" range
5. **🟡 Add CORS origin whitelist** for production
6. **🟡 Add retry/backoff for RPC calls** in indexer
7. **🟡 Cache stats/leaderboard** (30-60s TTL)
8. **🟡 Add unique constraint on activity_log** `(chain_id, tx_hash, log_index)` to prevent duplicates
9. **🟡 Add safety comments** on format!-interpolated SQL intervals
