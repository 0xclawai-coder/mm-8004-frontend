# Molt Marketplace — Documentation Review

**Reviewer**: Docs Writer (AI Agent)
**Date**: 2026-02-13
**Scope**: All documentation in `docs/`, root `README.md`, `CLAUDE.md`, `llms.txt`, `skill.md`, `contract/README.md`

---

## Executive Summary

The documentation is **well-structured and thorough for the original EIP-8004 Dashboard scope**, but has fallen significantly behind the codebase after the MoltMarketplace smart contract and its associated marketplace features (listings, auctions, bundles, offers) were integrated. The API docs, architecture diagram, shared types, and several other files reflect the *original* 6-endpoint agent-only API, while the codebase now has **10+ additional marketplace endpoints**, new frontend pages (`/trade/*`, `/analytics/*`, `/profile`), and a completely different backend port default.

**Critical gaps**: Marketplace API endpoints are undocumented. Frontend route structure in docs doesn't match actual routes. Backend default port is wrong in docs. Contract proxy addresses are missing from most docs.

---

## File-by-File Review

### 1. Root `README.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Project description | ⚠️ Outdated | Title says "NAD-8004 Dashboard" — should be "Molt Marketplace". Description focuses only on agent identity dashboard, doesn't mention marketplace trading (listings, auctions, bundles, offers). |
| Quick Start | ✅ Good | Clone → backend setup → frontend setup flow is correct. |
| Project Structure | ⚠️ Outdated | Shows `/agents`, `/agents/[agentId]`, `/leaderboard`, `/create` — actual routes are `/explore/agents`, `/explore/agents/[chainId]/[agentId]`, `/analytics/leaderboard`, `/trade/marketplace`, `/trade/auctions`, `/trade/bundles`, `/profile`. |
| Tech Stack | ✅ Good | Accurate (Next.js 15, Rust/Axum, PostgreSQL, Monad). |
| Contract Addresses | ⚠️ Outdated | Lists only IdentityRegistry and ReputationRegistry. **Missing MoltMarketplace proxy addresses** (mainnet: `0x48C803679fe35B2b85922B094E963A74680AAd9E`, testnet: `0x0fd6B881b208d2b0b7Be11F1eB005A2873dD5D2e`). |
| Live Demo Link | 📝 Missing | Frontend is deployed at `https://mm-8004-frontend.vercel.app` per CLAUDE.md, but README has no link. Backend is on Railway. |
| Screenshots | 📝 Missing | Says "Screenshots will be added once the UI is finalized" — UI appears finalized. |
| Backend Port | ⚠️ Outdated | README implies port 8080, actual default is `3001` (per `main.rs`). |

### 2. `docs/README.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Content | ⚠️ Outdated | Bare-bones placeholder. Lists "Table of Contents" with no actual links. Doesn't mention contract-features.md, shared-types.md, or other existing docs. |

### 3. `docs/api-contract.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Agent endpoints (6) | ✅ Good | All 6 original endpoints well-documented with request/response schemas. |
| Marketplace endpoints | 📝 Missing | **10 marketplace endpoints are completely undocumented**: `/marketplace/listings`, `/marketplace/listings/{id}`, `/marketplace/offers`, `/marketplace/collection-offers`, `/marketplace/auctions`, `/marketplace/auctions/{id}`, `/marketplace/dutch-auctions`, `/marketplace/bundles`, `/marketplace/user/{address}`, `/marketplace/stats`. |
| Global activity endpoint | 📝 Missing | `GET /api/activity` exists in code but is not documented. |
| Base port | ⚠️ Outdated | References port 8080, actual default is 3001. |
| Error format | ✅ Good | Consistent, well-documented. |
| CORS config | ✅ Good | Accurate. |

### 4. `docs/api-reference.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Agent endpoints | ✅ Good | Thorough with curl examples, request/response shapes, and notes. |
| Marketplace endpoints | 📝 Missing | Same gap as api-contract.md — none of the 10 marketplace endpoints are documented. |
| Port in examples | ⚠️ Outdated | All curl examples use `http://localhost:8080` — should be `http://localhost:3001`. |
| Consistency with api-contract.md | ✅ Good | Both files are consistent with each other (but both miss marketplace). |

### 5. `docs/architecture.md`

| Aspect | Status | Details |
|--------|--------|---------|
| System diagram | ✅ Good | Clear ASCII diagram showing chain → indexer → DB → API → frontend flow. |
| Component descriptions | ✅ Good | Detailed breakdown of frontend/backend/DB components. |
| API modules | ⚠️ Outdated | Lists only `agents.rs`, `leaderboard.rs`, `stats.rs`. Missing `marketplace.rs` and `activity.rs`. |
| Frontend pages | ⚠️ Outdated | Lists `/agents`, `/agents/[agentId]`, `/leaderboard`, `/create`. Actual routes: `/explore/agents`, `/explore/agents/[chainId]/[agentId]`, `/trade/marketplace`, `/trade/auctions`, `/trade/bundles`, `/analytics/*`, `/profile`. |
| Contract addresses | ⚠️ Outdated | Only IdentityRegistry/ReputationRegistry. Missing MoltMarketplace proxy. |
| Environment variables | ⚠️ Outdated | Shows `PORT` default as `8080`, actual is `3001`. Missing `CORS_ORIGINS`, `RUST_LOG` in backend .env.example. |
| DB tables | 📝 Missing | Doesn't mention marketplace-related tables (listings, auctions, offers, bundles, dutch_auctions, collection_offers, etc.). |
| MoltMarketplace indexer | 📝 Missing | Architecture only describes Identity/Reputation indexing. The marketplace event indexer is not documented. |

### 6. `docs/contract-features.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Feature coverage | ✅ Good | Comprehensive reference for all 7 feature areas + admin + payment distribution. |
| Function signatures | ✅ Good | Accurate, matches actual Solidity code. |
| Test count | ⚠️ Outdated | Says "102/102 passing (70 base + 32 ERC-8004 integration)". `contract/README.md` says 133 tests (101 + 32). One of these is stale. |
| Access control | ⚠️ Outdated | Shows `transferOwnership` + basic Owner model. Actual contract uses **AccessControl with 4 roles** (DEFAULT_ADMIN, PAUSER, FEE_MANAGER, TOKEN_MANAGER). `contract/README.md` is correct; this file is not. |
| Payment token whitelist | 📝 Missing | Not mentioned. `addPaymentToken`/`removePaymentToken`/`isPaymentTokenAllowed` are documented in `contract/README.md` but not here. |
| `withdrawPending()` | 📝 Missing | Not documented in this file (exists in contract). |
| UUPS proxy | 📝 Missing | Not mentioned. The contract is upgradeable via UUPS (documented in deployment.md). |

### 7. `docs/deployment.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Deployed contract addresses | ✅ Good | **Best doc for contract addresses** — includes proxy, implementation, and ERC-8004 registry addresses for both networks. |
| UUPS upgrade process | ✅ Good | Clear instructions with cast commands. |
| Local dev setup | ✅ Good | Step-by-step with prerequisites, DB, backend, frontend setup. |
| Backend port | ⚠️ Outdated | Environment table shows `PORT` default as `8080`, actual is `3001`. |
| Frontend env | ⚠️ Outdated | Shows `NEXT_PUBLIC_API_URL=http://localhost:8080`, should be `http://localhost:3001/api` (note the `/api` suffix). |
| Backend .env.example | ⚠️ Outdated | Actual `.env.example` references Supabase connection, not plain PostgreSQL. Missing `CORS_ORIGINS`, `RUST_LOG`, `PORT` from the example file. |
| Docker Compose | ✅ Good | Optional PostgreSQL via Docker, well-explained. |
| Troubleshooting | ✅ Good | Covers common issues (PG connection, Rust compilation, CORS, indexer). |

### 8. `docs/implementation-plan.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Original plan accuracy | ✅ Good | Clearly shows the phased approach and critical path. Good historical reference. |
| Current relevance | ⚠️ Outdated | Plan doesn't mention MoltMarketplace contract integration, marketplace pages, or trading features. These were added after the initial plan. |
| File structure | ⚠️ Outdated | Shows `/agents`, `/leaderboard`, `/create` — actual routes differ. |
| Status tracking | 📝 Missing | No indication of which phases are complete or in progress (CLAUDE.md fills this gap partially). |

### 9. `docs/monad-chains.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Chain configuration | ✅ Good | Comprehensive: chain IDs, RPC URLs, explorers, currency info. |
| Contract addresses | ⚠️ Outdated | Only Identity/Reputation registries. Missing MoltMarketplace proxy addresses. |
| Event signatures | ✅ Good | All Identity/Reputation events with full Solidity declarations and field descriptions. |
| Marketplace events | 📝 Missing | None of the MoltMarketplace events documented (Listed, Bought, AuctionCreated, BidPlaced, etc.). |
| Indexer configuration | ✅ Good | Polling strategy and cursor tracking well-documented. |
| Frontend chain config | ✅ Good | Code example with `defineChain()` is accurate and useful. |

### 10. `docs/shared-types.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Agent types | ⚠️ Outdated | Shows `created_at` field; actual frontend type uses `block_timestamp`. Missing `ScoreByTag` and `scores` fields on AgentDetail. Fields marked as required in docs are nullable in actual code (`name`, `description`, `image`, `categories`, `reputation_score`). |
| Marketplace types | 📝 Missing | No TypeScript interfaces for `MarketplaceListing`, `MarketplaceAuction`, `MarketplaceOffer`, `MarketplaceBundle`, `MarketplaceDutchAuction`, `CollectionOffer`, `AuctionBid`, `MarketplaceStats`, etc. The frontend has all of these in `types/index.ts`. |
| Filter types | 📝 Missing | `ListingFilters`, `AuctionFilters`, `BundleFilters`, `OfferFilters`, `MarketplaceUserParams` all exist in code but are undocumented. |
| Existing types | ✅ Good | Feedback, Activity, LeaderboardEntry, DashboardStats, ReputationHistory, ErrorResponse — all well-documented. |

### 11. `docs/llms.txt`

| Aspect | Status | Details |
|--------|--------|---------|
| Content | ⚠️ Outdated | Very sparse (488 bytes). Says "Tech Stack: TBD". Missing project description, contract info, API endpoints, file locations. |
| Usefulness for AI | ⚠️ Needs major update | Should contain: project summary, tech stack, repo structure, key files, contract addresses, API endpoints, deployment info. Currently almost useless. |

### 12. `docs/skill.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Content | ✅ Good | Documentation standards and guidelines. Reasonable meta-doc. |

### 13. Root `llms.txt`

| Aspect | Status | Details |
|--------|--------|---------|
| Content | ⚠️ Outdated | Same 488 bytes as `docs/llms.txt`. Duplicated and equally sparse. |

### 14. Root `skill.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Content | ⚠️ Outdated | Says "Tech Stack: TBD" and "Owner: jong6598". Doesn't reflect current state. |

### 15. `CLAUDE.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Team roles | ✅ Good | Well-defined agent team roles with clear scopes and commit conventions. |
| Git workflow | ✅ Good | Clear commit convention and repo structure. |
| Current status | ✅ Good | Accurate: contract done, frontend deployed (Vercel), backend built. |
| Frontend principles | ✅ Good | shadcn/ui mandate, table alignment, shared utilities. |
| Contract status | ⚠️ Outdated | Says "102/102 Foundry tests" but `contract/README.md` says 133 (101 + 32). |

### 16. `contract/README.md`

| Aspect | Status | Details |
|--------|--------|---------|
| Feature coverage | ✅ Good | Complete listing of all features, access control roles, payment token whitelist. |
| Architecture | ✅ Good | Inheritance diagram and role-based access control well-explained. |
| Function reference | ✅ Good | All user and admin functions listed with descriptions. |
| Deployment instructions | ✅ Good | Environment variables, forge script command, post-deployment checklist. |
| NatSpec comments | ✅ Good | Source has 44 `///` NatSpec comments. `@title`, `@notice`, `@dev`, `@inheritdoc` used. |
| Test count | ✅ Good | 133 tests (101 + 32) — matches actual test files. |

---

## Summary by Category

### ✅ Good (Accurate and Helpful)

1. **`contract/README.md`** — Best doc in the project. Comprehensive, accurate, well-organized.
2. **`docs/contract-features.md`** — Great feature reference (some minor staleness on admin model).
3. **`docs/api-contract.md` (agent endpoints)** — Original 6 endpoints well-specified.
4. **`docs/api-reference.md` (agent endpoints)** — Thorough with curl examples.
5. **`docs/deployment.md` (contract section)** — UUPS proxy addresses, upgrade process.
6. **`docs/monad-chains.md` (Identity/Reputation)** — Chain config, event signatures, indexer config.
7. **`docs/shared-types.md` (agent types)** — Well-structured type definitions.
8. **`CLAUDE.md`** — Excellent team coordination doc.
9. **`docs/deployment.md` (local dev setup)** — Good step-by-step guide.
10. **`docs/architecture.md` (system diagram)** — Clear high-level architecture.

### ⚠️ Outdated (Needs Update)

1. **Root `README.md`** — Title, description, routes, contract addresses, port, missing live demo link.
2. **`docs/api-contract.md`** — Missing 10+ marketplace endpoints, wrong port.
3. **`docs/api-reference.md`** — Missing marketplace endpoints, wrong port in curl examples.
4. **`docs/architecture.md`** — Missing marketplace API modules, wrong routes, missing marketplace DB tables.
5. **`docs/contract-features.md`** — Wrong access control model (Owner vs AccessControl), stale test count.
6. **`docs/deployment.md`** — Wrong backend port (8080 → 3001), wrong frontend env URL.
7. **`docs/shared-types.md`** — Agent field mismatches (`created_at` vs `block_timestamp`, nullable fields).
8. **`docs/implementation-plan.md`** — Doesn't reflect marketplace features.
9. **`docs/monad-chains.md`** — Missing MoltMarketplace contract addresses and events.
10. **`docs/llms.txt`** — Almost empty, says "TBD".
11. **Root `llms.txt`** — Duplicate of docs version, equally empty.
12. **Root `skill.md`** — Says "TBD", stale owner info.
13. **`docs/README.md`** — Placeholder with no links.

### 📝 Missing (Should Create)

1. **Marketplace API Documentation** — 10 endpoints (`/marketplace/listings`, `/marketplace/auctions`, `/marketplace/bundles`, `/marketplace/offers`, `/marketplace/collection-offers`, `/marketplace/dutch-auctions`, `/marketplace/user/{address}`, `/marketplace/stats`, listing detail, auction detail) need full documentation with request/response schemas.
2. **Marketplace Shared Types** — `MarketplaceListing`, `MarketplaceAuction`, `MarketplaceOffer`, `MarketplaceBundle`, `MarketplaceDutchAuction`, `CollectionOffer`, `AuctionBid`, `MarketplaceStats`, and all filter types.
3. **Contributing Guide** — No `CONTRIBUTING.md` exists.
4. **Frontend Component Documentation** — 40+ components with no documentation beyond code.
5. **Hackathon Pitch / Presentation** — No pitch deck, feature list, or demo instructions for judges.
6. **Live Demo Instructions** — Frontend URL, backend URL, how to test with testnet MON.
7. **Screenshots / Visuals** — HoloCard, marketplace pages, agent explorer.
8. **Architecture Diagram Update** — Marketplace data flow (listing events → indexer → DB → API → frontend).
9. **Environment Setup** — Backend `.env.example` references Supabase but deployment.md references plain PostgreSQL. Inconsistent.

---

## Priority Recommendations

### P0 — Critical (Do Now)

1. **Update `docs/llms.txt`** — This is the entry point for AI agents. Currently useless.
2. **Document marketplace API endpoints** — 10 endpoints are live but undocumented.
3. **Fix port numbers** across all docs (8080 → 3001).
4. **Add MoltMarketplace proxy addresses** to README, architecture, and monad-chains docs.

### P1 — High (Before Hackathon)

5. **Create hackathon pitch document** with project description, feature list, tech stack, demo URL.
6. **Update root README** with correct project name, description, routes, live demo link.
7. **Update architecture.md** with marketplace modules and data flow.
8. **Add screenshots** of the deployed UI.

### P2 — Medium

9. **Update shared-types.md** with marketplace types and fix agent field mismatches.
10. **Update contract-features.md** to reflect AccessControl roles (not Owner model).
11. **Sync deployment.md** backend/frontend env vars with actual defaults.
12. **Create CONTRIBUTING.md**.

### P3 — Low

13. **Archive or update implementation-plan.md** with completion status.
14. **Clean up duplicate llms.txt** (root vs docs/).
15. **Frontend component documentation**.

---

## Test Count Discrepancy

| Source | Count |
|--------|-------|
| `contract/README.md` | 133 (101 + 32) |
| `docs/contract-features.md` | 102 (70 + 32) |
| `CLAUDE.md` | 102 (70 + 32) |

`contract/README.md` is likely correct (most recently updated). The others should be updated to 133.
