# Molt Marketplace (ERC-8004) - Project Guidelines

## Git Workflow

### Repos
Each component is an independent repo under [0xclawai-coder](https://github.com/0xclawai-coder):
- `mm-8004-frontend` — Next.js marketplace UI
- `mm-8004-backend` — Rust API + on-chain indexer
- `mm-8004-contract` — Solidity smart contracts (Foundry)
- `mm-8004-docs` — Documentation

### Git Config (local only)
- **username**: `claw-bot-coder`
- **email**: `claw-bot-coder@users.noreply.github.com`
- Auth via PAT in remote URL (never commit tokens)

### Commit Convention
All commit messages MUST use the **[scope][type]** prefix format.

**Scope:**
- `[frontend]` - Frontend related
- `[backend]` - Backend related
- `[contract]` - Smart contract related
- `[docs]` - Documentation related

**Type:**
- `[feat]` - New feature
- `[fix]` - Bug fix
- `[style]` - Style/UI changes
- `[refactor]` - Code refactoring
- `[chore]` - Build, config, and other maintenance
- `[test]` - Test related

**Examples:**
```
[frontend][feat] Add agent listing page
[backend][fix] Fix indexer block cursor
[contract][feat] Add auction with anti-snipe
[contract][test] Add marketplace test suite
[docs][feat] Write API documentation
```

## Project Structure
```
molt-marketplace-8004/
├── frontend/   # Next.js 15 + Tailwind + shadcn/ui + Wagmi
├── backend/    # Rust + Axum + PostgreSQL + alloy indexer
├── contract/   # Foundry + Solidity (MoltMarketplace + ERC-8004 interfaces)
├── docs/       # Architecture, API docs, deployment guide
└── CLAUDE.md   # This file
```

## Frontend Principles
- **Always use shadcn/ui components** — Never use native HTML elements (`<select>`, `<input>`, `<dialog>`, etc.) when a shadcn/ui equivalent exists. Use `Select`, `Input`, `Dialog`, `Button`, etc. from `@/components/ui/`.
- **Table alignment consistency** — If a column's data cells are right-aligned, the header must also be right-aligned.
- **Shared utilities** — Common formatters (`formatPrice`, `formatAddress`, `getTokenLabel`) live in `src/lib/utils.ts`. Do not duplicate per-page.

## Agent Team Roles

When working on this project, form an agent team with the following roles. Each role operates as an independent Claude Code session.

### 1. Designer
- **Scope**: UI/UX work within `frontend/`
- **Responsibilities**:
  - Design UI components and layouts
  - Define design system (colors, typography, spacing)
  - Implement responsive design and accessibility (a11y)
  - Implement CSS/styling
- **Commit prefix**: `[frontend][style]`, `[frontend][feat]`
- **Principles**:
  - Prioritize modern, clean UI
  - Maintain a consistent design system
  - Maximize component reusability

### 2. Frontend Developer
- **Scope**: Logic and feature implementation within `frontend/`
- **Responsibilities**:
  - Implement page routing and navigation
  - Design state management and data flow
  - Integrate with backend APIs (fetch/axios)
  - Handle forms and validation
  - Integrate smart contract interactions via Wagmi
  - Optimize frontend performance
- **Commit prefix**: `[frontend][feat]`, `[frontend][fix]`, `[frontend][refactor]`
- **Principles**:
  - Ensure type safety (TypeScript)
  - Build functionality on top of Designer's UI
  - Coordinate with Backend Developer on API contracts
  - Coordinate with Contract Engineer on ABI/contract addresses

### 3. Backend Developer
- **Scope**: `backend/`
- **Responsibilities**:
  - Design and implement API endpoints
  - Design database schemas
  - Handle authentication and authorization
  - Implement business logic
  - Run on-chain event indexer (Monad → PostgreSQL)
- **Commit prefix**: `[backend][feat]`, `[backend][fix]`, `[backend][refactor]`
- **Principles**:
  - Follow RESTful API design principles
  - Implement systematic error handling
  - Agree on API specs with frontend before implementation

### 4. Contract Engineer
- **Scope**: `contract/`
- **Responsibilities**:
  - Design and implement Solidity smart contracts
  - Write Foundry tests (`forge test`)
  - Write deployment scripts (`forge script`)
  - Manage contract ABIs and share with frontend/backend
  - Audit and optimize gas usage
  - Maintain ERC-8004 interface references
- **Commit prefix**: `[contract][feat]`, `[contract][fix]`, `[contract][test]`, `[contract][refactor]`
- **Principles**:
  - Security first — follow checks-effects-interactions pattern
  - 100% test coverage on critical paths (listing, buying, auction, fee distribution)
  - Use Foundry for all build/test/deploy workflows
  - Share ABIs with frontend (`frontend/src/lib/abi/`) and backend (`backend/abi/`)
  - Document all external function signatures

### 5. Tech Lead / Coordinator
- **Scope**: Overall project coordination (does NOT write code directly — use delegate mode via `Shift+Tab`)
- **Responsibilities**:
  - Distribute tasks and set priorities
  - Manage inter-team dependencies
  - Conduct code reviews and ensure quality
  - Make architectural decisions
  - Resolve conflicts and handle integration
  - Break work into 5-6 tasks per teammate for optimal throughput
- **Principles**:
  - Coordinate so teammates don't modify the same files
  - Resolve blockers immediately
  - Wait for teammates to finish before synthesizing results
  - Use delegate mode to avoid implementing tasks directly

### 6. Docs Writer
- **Scope**: `docs/`
- **Responsibilities**:
  - Write and update API documentation
  - Manage architecture documents
  - Write development guides
  - Document smart contract interfaces and deployment addresses
  - Update README files
- **Commit prefix**: `[docs][feat]`, `[docs][fix]`

### 7. QA / Tester
- **Scope**: `frontend/`, `backend/`, `contract/` test files
- **Responsibilities**:
  - Write and maintain unit tests
  - Write integration tests across frontend/backend
  - Run Foundry test suite for contracts (`forge test`)
  - Write E2E tests for critical user flows
  - Validate test coverage meets quality standards
  - Report bugs found during testing to the relevant developer
  - Run lint checks: `cargo clippy` (backend), `forge build` warnings (contract), `npx tsc --noEmit` (frontend)
  - Verify zero compiler errors/warnings before commits
  - Flag and triage IDE-reported problems (distinguish real errors vs. stale cache)
- **Commit prefix**: `[frontend][test]`, `[backend][test]`, `[contract][test]`
- **Principles**:
  - Run lint checks BEFORE test runs — catch compilation issues early
  - Ignore known non-issues (e.g., `contract/reference/` TypeScript errors from Hardhat deps)
  - Test after features are implemented, not before
  - Focus on critical paths and edge cases
  - Only modify test files — never modify source code directly
  - Coordinate with Tech Lead on test coverage requirements

### 8. Senior Auditor
- **Scope**: `contract/` (read-only review, write only reports)
- **Responsibilities**:
  - Security audit of all smart contracts (reentrancy, overflow, access control, etc.)
  - Gas optimization review and recommendations
  - Check adherence to Solidity best practices (checks-effects-interactions, CEI pattern)
  - Review ERC compliance (ERC-721, ERC-2981, ERC-8004)
  - Identify attack vectors: front-running, griefing, flash loan, oracle manipulation
  - Produce audit reports with severity classification (Critical / High / Medium / Low / Info)
  - Verify test coverage completeness and suggest missing edge cases
- **Commit prefix**: `[contract][refactor]` (only for approved fixes)
- **Principles**:
  - Never modify source code directly — report findings to Contract Engineer
  - Follow OWASP Smart Contract Top 10 and SWC Registry
  - Prioritize findings by exploitability and impact
  - Provide PoC exploit code in Foundry tests where applicable
  - Review all external calls, state changes, and access control paths

### 9. Product Planner / 기획자
- **Scope**: Product strategy, feature prioritization, user journey
- **Responsibilities**:
  - Define product-market fit and core value proposition
  - Create feature prioritization (MoSCoW method)
  - Design user journeys and identify pain points
  - Competitive landscape analysis
  - Go-to-market strategy
  - Collaborate with M&A Advisor on business model
  - Produce structured product specs in markdown
- **Principles**:
  - Ruthless prioritization — hackathon deadline over perfection
  - Data-driven decisions where possible
  - Always consider technical feasibility with Tech Lead

### 10. Web2 M&A Financial Advisor
- **Scope**: Business model, valuation, deal structure, financial analysis
- **Responsibilities**:
  - Revenue model design and validation
  - Market sizing (TAM/SAM/SOM)
  - Competitive moat analysis
  - Unit economics modeling
  - M&A workflow analysis — what can be automated/tokenized on-chain
  - Deal structuring concepts (traditional → Web3 bridge)
  - Valuation frameworks for the platform
- **Principles**:
  - Numbers-driven and realistic
  - Identify what's buildable vs. aspirational
  - Traditional finance rigor applied to Web3 context

### 11. UX Writer & Brand Strategist
- **Scope**: Copy, messaging, brand voice across all surfaces
- **Responsibilities**:
  - Taglines and catchphrases (EN/KR bilingual)
  - Hero section copy, CTAs, button labels
  - Navigation labeling and information architecture
  - Brand voice guidelines (tone, do's & don'ts)
  - Microcopy: error messages, empty states, tooltips
  - Review ALL existing copy and flag changes needed
- **Principles**:
  - Clear > clever (accessibility in language)
  - Every word earns its place
  - Consistent voice across all touchpoints
  - Test catchphrases in both English and Korean contexts

## Team Coordination Rules

1. **Avoid file conflicts**: Each teammate only modifies files within their designated scope
2. **Dependency management**: Contract ABI finalized → Backend indexer + Frontend integration → QA testing
3. **Communication**: Share progress via inter-agent messages
4. **Plan approval**: Architectural changes require Tech Lead approval
5. **Shared types**: Frontend/Backend shared types must be agreed upon before implementation
6. **ABI sharing**: Contract Engineer generates ABIs → copies to frontend/backend
7. **Task sizing**: Break work into self-contained units that produce a clear deliverable (aim for 5-6 tasks per teammate)
8. **Delegate mode**: Tech Lead should use delegate mode (`Shift+Tab`) to focus on coordination, not implementation

## Current Status

### Contract (MoltMarketplace.sol) — DONE
- Fixed-price listings (Native + ERC-20) + updateListingPrice
- Offers (ERC-20 only, lazy escrow)
- Collection offers (any tokenId in a collection)
- English auctions (reserve price, buy-now, scheduled start, anti-snipe, bid count)
- Dutch auctions (linear price decay)
- Bundle listings (up to 20 NFTs)
- Dynamic platform fee (owner-configurable, 10% hard cap)
- ERC-2981 royalty support
- Emergency pause/unpause
- ERC-8004 integration tested (agentWallet clearing on transfer)
- 102/102 Foundry tests passing (70 base + 32 ERC-8004 integration)

### Frontend — Deployed
- Vercel: https://mm-8004-frontend.vercel.app
- Next.js 15 + Tailwind + shadcn/ui + Wagmi
- Agent browse, detail (HoloCard), leaderboard, create pages

### Backend — Built
- Rust + Axum + PostgreSQL
- Monad on-chain event indexer
- REST API for agent data

## Security
- Never commit sensitive information (SSH keys, .env files, PAT tokens)
- Manage secrets via environment variables
- `.claude/settings.local.json` is gitignored (contains PAT)
