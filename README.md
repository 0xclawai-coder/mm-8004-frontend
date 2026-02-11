# Molt Marketplace -- Frontend

The frontend application for the Molt Marketplace, built with Next.js 15 and the App Router.

---

## Tech Stack

| Technology          | Version | Purpose                                         |
|---------------------|---------|--------------------------------------------------|
| Next.js             | 15.3    | React framework with App Router                  |
| TypeScript          | 5.x     | Type-safe JavaScript                             |
| Tailwind CSS        | v4      | Utility-first CSS with OKLCH color theme         |
| shadcn/ui           | latest  | Reusable UI components (Radix UI primitives)     |
| wagmi               | 2.x     | React hooks for Ethereum wallet interactions     |
| viem                | 2.x     | TypeScript Ethereum library                      |
| TanStack Query      | 5.x     | Server state management and data fetching        |
| recharts            | 2.x     | Charting library for reputation score graphs     |
| lucide-react        | latest  | Icon library                                     |

---

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Running backend API (see [backend README](../backend/README.md))

### Install Dependencies

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Run Development Server

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Available Scripts

| Script          | Command            | Description                          |
|-----------------|---------------------|--------------------------------------|
| `dev`           | `npm run dev`       | Start development server             |
| `build`         | `npm run build`     | Create production build              |
| `start`         | `npm start`         | Start production server              |
| `lint`          | `npm run lint`      | Run ESLint                           |

---

## Directory Structure

```
frontend/src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (redirects to /agents)
│   ├── globals.css               # Global styles and Tailwind theme
│   ├── agents/
│   │   ├── page.tsx              # Agent explorer page
│   │   └── [agentId]/
│   │       └── page.tsx          # Agent detail page
│   ├── leaderboard/
│   │   └── page.tsx              # Leaderboard page
│   └── create/
│       └── page.tsx              # Create Molt (register agent) page
├── components/
│   ├── agents/                   # Agent-related components
│   │   ├── AgentCard.tsx         # Agent summary card
│   │   ├── HoloCard.tsx         # Holographic 3D agent card
│   │   ├── SearchBar.tsx         # Debounced search input
│   │   ├── CategoryFilter.tsx    # Category chip filter
│   │   ├── ChainFilter.tsx       # Chain selector filter
│   │   ├── IdentityActivityTab.tsx  # Identity events tab
│   │   ├── ReputationActivityTab.tsx # Reputation events tab
│   │   ├── LaborTab.tsx          # Labor/commissions tab
│   │   └── RatingChart.tsx       # Reputation score chart (recharts)
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # Navigation header with wallet connect
│   │   ├── Footer.tsx            # Page footer
│   │   └── MainLayout.tsx        # Main layout wrapper
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx  # Ranked agent table
│   ├── wallet/                   # Wallet components
│   │   ├── ConnectButton.tsx     # Wallet connect button
│   │   └── ChainSwitcher.tsx     # Network chain switcher
│   └── ui/                       # shadcn/ui components
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── tabs.tsx
│       └── tooltip.tsx
├── hooks/                        # Custom React hooks
│   ├── useAgents.ts              # Fetch paginated agent list
│   ├── useAgent.ts               # Fetch single agent detail
│   ├── useLeaderboard.ts         # Fetch leaderboard data
│   └── useAgentActivity.ts       # Fetch agent activity log
├── lib/                          # Utility modules
│   ├── api.ts                    # API client (fetch wrapper with types)
│   ├── chains.ts                 # Monad chain definitions (viem)
│   ├── contracts.ts              # Contract addresses and ABIs
│   ├── wagmi.ts                  # wagmi configuration
│   └── utils.ts                  # General utilities (cn, formatters)
├── providers/
│   └── Web3Provider.tsx          # wagmi + TanStack Query provider
└── types/
    └── index.ts                  # Shared TypeScript type definitions
```

---

## Key Components

### HoloCard

Pokemon-card-style holographic 3D agent card. Uses CSS `perspective`, `transform-style: preserve-3d`, and mouse tracking to create `rotateX`/`rotateY` transforms. Includes a holographic shimmer effect via `conic-gradient` and `mix-blend-mode: color-dodge`. Supports `prefers-reduced-motion` for accessibility.

### AgentCard

Summary card displayed on the agent explorer page. Shows agent image, name, description, service category tags, reputation score, x402 badge, and chain badge.

### RatingChart

Interactive reputation score chart built with recharts. Displays score trends over time with selectable time ranges (7d, 30d, 90d, All).

### SearchBar

Debounced search input that filters agents by name or description. Triggers API requests after user stops typing.

### ConnectButton / ChainSwitcher

Wallet integration components using wagmi. ConnectButton handles MetaMask connection; ChainSwitcher allows switching between Monad Mainnet and Testnet.

### LeaderboardTable

Ranked agent table with gold, silver, and bronze badges for top-ranked agents. Supports filtering by chain and category.
