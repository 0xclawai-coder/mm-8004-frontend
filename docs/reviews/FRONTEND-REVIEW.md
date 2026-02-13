# Molt Marketplace — Frontend Code Review

**Reviewer:** Frontend Developer (AI)  
**Date:** 2026-02-13  
**Project:** `~/molt-marketplace-8004/frontend/` (Next.js 16 + Wagmi + RainbowKit)  
**Stack:** Next.js 16.1.6, React 19, Tailwind CSS 4, Wagmi 2, RainbowKit 2, TanStack Query 5, Recharts

---

## 1. Build & Type Check

### ✅ Build — Clean Compilation
- `npm run build` passes with **zero errors** and **zero warnings**
- All 15 routes compile successfully (10 static, 3 dynamic)
- Turbopack build completes in ~7.7s — fast

### 🟡 TypeScript Errors in Tests
- **File:** `src/types/__tests__/types.test.ts` — lines 69, 100
- **Issue:** `Property 'scores' is missing in type ... but required in type 'AgentDetail'`
- The `scores: ScoreByTag[]` field was added to `AgentDetail` but the test fixtures weren't updated
- Fix: Add `scores: []` to the test objects

### ✅ No `any` Types
- Grep for `\bany\b` found only one false positive (string content "any agents")
- The codebase is fully typed — excellent discipline

---

## 2. Bundle Size & Dependencies

### 🟡 Unused `radix-ui` Umbrella Package
- **File:** `package.json` line 29 — `"radix-ui": "^1.4.3"`
- This is the **full Radix UI meta-package** (360KB in node_modules), but only 2 files use it:
  - `src/components/ui/navigation-menu.tsx` → `import { NavigationMenu } from "radix-ui"`
  - `src/components/ui/select.tsx` → `import { Select } from "radix-ui"`
- All other UI components already import from scoped `@radix-ui/react-*` packages
- **Fix:** Replace those 2 imports with `@radix-ui/react-navigation-menu` and `@radix-ui/react-select`, then remove the `radix-ui` dependency

### 🟢 Recharts — Consider Dynamic Import
- Recharts (5.2MB in node_modules) is only used in `src/components/agents/RatingChart.tsx`
- It's only rendered on the agent detail page, not globally
- Consider `next/dynamic` with `{ ssr: false }` to lazy-load it

### 🟢 date-fns Size
- date-fns is 38MB on disk (node_modules), but tree-shakes well — only `formatDistanceToNowStrict` is imported
- No action needed, but worth noting

### ✅ No Unnecessary Dependencies
- All other deps are actively used and appropriate for the project

---

## 3. Performance

### 🔴 Massive File Size — Critical Splitting Needed

| File | Lines | Status |
|------|-------|--------|
| `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx` | **1,722** | 🔴 Severely oversized |
| `src/app/trade/auctions/[chainId]/[auctionId]/page.tsx` | **1,182** | 🔴 Severely oversized |
| `src/app/create/page.tsx` | **913** | 🔴 Oversized |
| `src/app/profile/page.tsx` | **792** | 🟡 Should split |
| `src/app/trade/marketplace/page.tsx` | **564** | 🟡 Borderline |

The listing detail page (1,722 lines) contains **~15 inline components** that should be extracted:
- `CopyButton`, `ErrorState`, `PriceInfoCard`, `PropertyCard`, `AgentPropertiesGrid`
- `EndpointsSection`, `ProvenanceSection`, `TopOffersTable`, `ListingDetailsSection`
- `ReputationBadge`, `ItemActivitySection`, `MakeOfferDialog`

Same pattern in auction detail (1,182 lines) with duplicated inline components.

### 🔴 Excessive useEffect/useWriteContract in Listing Detail
- **File:** `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx`
- **8 separate `useWriteContract`** hooks and **10 `useEffect`** hooks in a single component
- Each contract interaction (buy, makeOffer, cancelListing, updatePrice, acceptOffer, cancelOffer) + approve has its own state
- This makes the component extremely hard to maintain and creates potential re-render cascading
- **Fix:** Extract each transaction flow into a custom hook (e.g., `useBuyListing`, `useMakeOffer`, `useAcceptOffer`)

### 🟡 No `staleTime` / `gcTime` on React Query Hooks
- **Files:** All hooks in `src/hooks/` (13 files)
- None set `staleTime` — every focus/mount triggers a refetch
- For relatively static data (agent list, stats), set `staleTime: 30_000` or similar
- Listings/auctions could have `staleTime: 10_000`

### 🟡 No `Suspense` or `React.lazy` Used Anywhere
- Zero dynamic imports in the entire codebase
- Heavy pages (listing detail, auction detail, create) could benefit from code splitting
- Recharts should especially be dynamically imported

### ✅ Good: Skeleton Loading States
- Skeleton UI is implemented on every data-dependent page
- Loading skeletons match actual component layouts (especially good in `AgentCardSkeleton`)

### ✅ Good: Next.js `Image` Used Correctly
- `next/image` is used for marketplace listing images, auction images, and the HoloCard
- `remotePatterns` allows all HTTPS sources (appropriate for user-provided agent images)
- Avatar components use Radix's `AvatarImage` (renders `<img>`) — acceptable for small avatars

### 🟢 Data Fetching Could Be Parallelized
- `src/app/page.tsx` (homepage) fetches `useStats`, `useMarketplaceStats`, `useAgents`, `useListings` independently (good — parallel)
- `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx` fetches listing, then offers depend on listing data (waterfall, but unavoidable)

---

## 4. Code Quality

### 🔴 Massive Helper Function Duplication

The function `getChainLabel()` is **copy-pasted 10 times** across:
```
src/app/trade/marketplace/[chainId]/[listingId]/page.tsx:71
src/app/trade/marketplace/page.tsx:62
src/app/trade/auctions/[chainId]/[auctionId]/page.tsx:58
src/app/explore/agents/[chainId]/[agentId]/page.tsx:19
src/app/profile/page.tsx:81
src/app/create/page.tsx:127
src/components/agents/AgentCard.tsx:22
src/components/agents/HoloCard.tsx:40
src/components/agents/BasicInfoPanel.tsx:20
src/components/agents/AgentBrowseTable.tsx:31
```

Similarly duplicated:
- `getExplorerUrl()` — **6 copies** (with slightly different signatures)
- `getStatusColor()` — **3 copies**
- `isNativeToken()` — **2 copies** (already exists as a constant check in `contracts.ts`)
- `truncateAddress()` — **4 copies** (while `formatAddress` exists in `utils.ts`)
- `getScoreColor()` — **3 copies**

**Fix:** Move all these to `src/lib/utils.ts` or create `src/lib/chain-utils.ts`. Several already have equivalents in `utils.ts` that aren't being used.

### 🟡 `truncateAddress` vs `formatAddress` Inconsistency
- `src/lib/utils.ts` exports `formatAddress()` which formats as `0x1234…abcd`
- 4 components define their own `truncateAddress()` doing `0x1234...abcd` (3 dots instead of ellipsis character)
- Some pages import `formatAddress` from utils, others use local `truncateAddress`
- **Fix:** Use `formatAddress` everywhere

### 🟡 No Error Boundaries
- Zero `error.tsx` files in the entire `/app` directory
- No React Error Boundary components
- If any page component throws, the entire app crashes with no recovery
- **Fix:** Add `src/app/error.tsx` (global) and `src/app/trade/error.tsx` (for marketplace pages) at minimum

### ✅ Good: Consistent Naming Conventions
- Components: PascalCase ✓
- Hooks: camelCase with `use` prefix ✓
- Files: kebab-case for UI, PascalCase for components ✓ (consistent with Next.js conventions)
- API functions: camelCase with verb prefix (get/fetch) ✓

### ✅ Good: Types Fully Defined
- `src/types/index.ts` (426 lines) is comprehensive — all API response types, filter types, and domain models
- No `any` types anywhere in production code
- Type tests exist (though 2 are outdated)

---

## 5. Accessibility (a11y)

### 🟡 Missing Labels on Interactive Filter Buttons
- **Files:** Activity page, marketplace page, agents page
- Filter pills (chain filter, status filter, category filter) use `<button>` without `aria-label`
- Example: `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx:497` — filter pills have text content but the filter section has no `role="group"` or `aria-label` grouping
- Pagination buttons say "← Prev" and "Next →" (acceptable)

### 🟡 Missing `alt` Text on Some Avatar Images  
- **File:** `src/components/agents/AgentCard.tsx:38`
  ```tsx
  <AvatarImage src={agent.image ?? undefined} alt={agent.name ?? undefined} />
  ```
  When `agent.name` is null, `alt` becomes `undefined` → renders as no alt attribute
- **Fix:** Use `alt={agent.name ?? \`Agent #${agent.agent_id}\`}`
- Same pattern in `src/components/leaderboard/LeaderboardTable.tsx:101` and `src/components/agents/AgentBrowseTable.tsx:216`

### 🟡 Copy-to-Clipboard Buttons Need Better Labels
- **File:** `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx:128`
- `CopyButton` has `title="Copy to clipboard"` (good) but no `aria-label`
- Screen readers would announce nothing meaningful for the icon-only button
- **Fix:** Add `aria-label="Copy to clipboard"`

### ✅ Good: Create Page Has Proper aria-invalid
- `src/app/create/page.tsx` uses `aria-invalid` on form inputs (lines 530, 551, 570, 598)
- x402 toggle uses `role="switch"` + `aria-checked` (line 638-639)

### ✅ Good: Mobile Menu Has `sr-only` Text
- `src/components/layout/Header.tsx` — hamburger button has `<span className="sr-only">Toggle menu</span>`

### 🟢 Color Contrast — Muted Text
- Extensive use of `text-muted-foreground` on dark backgrounds
- The `text-[10px]` uppercase labels may be too small for readability (throughout listing detail, provenance section, etc.)
- Consider minimum 11px for metadata labels

---

## 6. Wagmi / Web3 Patterns

### ✅ Excellent: Transaction Status Feedback
- All transaction flows show proper states:
  - Pending: "Confirm in Wallet…" with spinner
  - Confirming: "Confirming…" with spinner  
  - Success: Toast notification via `sonner`
  - Error: Toast with truncated error message
- Example: `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx` — Buy, Offer, Cancel, Update Price all have proper feedback

### ✅ Good: Wallet Connection Handling
- `ConnectButton` uses RainbowKit custom button with proper `mounted` / `ready` checks
- Listing detail page checks `isConnected` before Buy/Offer and prompts to connect
- Profile page shows "Connect Wallet" CTA when disconnected

### 🟡 Chain Mismatch Not Handled on Transaction Pages
- **Files:** Listing detail, auction detail, create page, profile page
- User can view a listing on chain 10143 while connected to chain 143 — no warning
- Attempting to buy would fail silently or with an unhelpful error
- The `ChainSwitcher` component exists in the header, but there's no per-page chain validation
- **Fix:** Add a chain mismatch banner when `listing.chain_id !== connectedChainId`, with a "Switch to [chain]" button

### 🟡 Missing ERC-20 Allowance Check Before Approve
- **File:** `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx` — `MakeOfferDialog`
- The flow always calls `approve` then `makeOffer`, even if the user already has sufficient allowance
- `erc20Abi` includes `allowance` function but it's never used
- **Fix:** Check allowance first; skip approve step if sufficient

### ✅ Good: Seller Self-Buy Protection
- `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx:1100` — checks `isSeller` and shows "Update Price" / "Cancel Listing" instead of Buy
- Toast error "You cannot buy your own listing" as safety net

### ✅ Good: RainbowKit Configuration
- Properly configured with both Monad Mainnet and Testnet
- Dark theme matches the app design

### 🟡 WalletConnect Project ID Fallback
- **File:** `src/lib/wagmi.ts:5`
  ```ts
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'nad8004_dev'
  ```
- The fallback `'nad8004_dev'` is not a real WalletConnect project ID (build log shows 403 Forbidden from Reown API)
- This means WalletConnect relay won't work — only injected wallets (MetaMask, etc.) will connect
- **Fix:** Register a real project ID at cloud.walletconnect.com

---

## 7. SEO & Meta

### ✅ Excellent: Root Layout Metadata
- **File:** `src/app/layout.tsx`
- Title template: `"%s | Molt Marketplace"` with default fallback
- Open Graph tags: title, description, siteName, type
- Twitter card: `summary_large_image`

### ✅ Good: Per-Route Titles
All static routes have layout-level metadata:
- `/trade/marketplace` → "Marketplace"
- `/trade/auctions` → "Auctions"  
- `/trade/bundles` → "Bundles"
- `/explore/agents` → "Explore Agents"
- `/explore/activity` → "Activity"
- `/profile` → "Profile"
- `/create` → "Create Molt"
- `/analytics/*` → "Analytics Overview", "Agent Rankings", "Top Wallets"

### 🟡 Dynamic Pages Missing `generateMetadata`
- **Files:** `src/app/trade/marketplace/[chainId]/[listingId]/page.tsx`, `src/app/trade/auctions/[chainId]/[auctionId]/page.tsx`, `src/app/explore/agents/[chainId]/[agentId]/page.tsx`
- These are `'use client'` pages, so they can't export `generateMetadata`
- The listing detail page shows agent name, image, price — perfect for OG tags
- **Fix:** Create a server wrapper or use `generateMetadata` in the layout for these dynamic routes

### 🟢 Missing OG Image
- No `opengraph-image` or custom OG image defined
- For a marketplace, having a branded OG image would improve social sharing

---

## 8. Summary

### Severity Breakdown

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟡 Important | 10 |
| 🟢 Nice to Have | 4 |
| ✅ Well Done | 11 |

### 🔴 Critical Issues

1. **Giant file sizes** — Listing detail (1,722 lines), Auction detail (1,182 lines), Create page (913 lines) need component extraction
2. **Massive helper duplication** — `getChainLabel` copied 10×, `getExplorerUrl` 6×, `truncateAddress` 4× — extract to shared utils
3. **8 `useWriteContract` + 10 `useEffect` in one component** — Extract into custom hooks per transaction flow

### 🟡 Important Issues

4. **No Error Boundaries** — Zero `error.tsx` files; app crashes with no recovery
5. **No `staleTime` on React Query hooks** — Every mount/focus triggers unnecessary refetches
6. **Chain mismatch not handled** — Can attempt TX on wrong chain with no warning
7. **TypeScript test errors** — 2 failing type checks in test fixtures
8. **Missing ERC-20 allowance check** — Always approves, even if already approved
9. **Invalid WalletConnect project ID** — Fallback `'nad8004_dev'` gets 403 from Reown API
10. **No dynamic imports** — Heavy components not code-split
11. **`truncateAddress` vs `formatAddress` inconsistency** — 4 local copies vs 1 shared export
12. **Accessibility gaps** — Missing alt text fallbacks, copy button aria-labels, filter group labels
13. **Dynamic routes missing `generateMetadata`** — No OG tags for listing/auction/agent detail pages

### 🟢 Nice to Have

14. **Recharts lazy loading** — Only used on 1 page, should be dynamically imported
15. **Remove `radix-ui` umbrella package** — Replace 2 imports with scoped packages
16. **OG image for social sharing**
17. **Minimum font size for metadata labels** — `text-[10px]` may be too small

### ✅ What's Done Well

- **Zero `any` types** — Fully typed codebase
- **Clean build** — No build errors or warnings
- **Comprehensive type definitions** — 426 lines of well-structured domain types
- **Excellent skeleton UIs** — Loading states match final layouts
- **Proper transaction feedback** — Pending → Confirming → Success/Error flow with toasts
- **Good wallet UX** — Connect prompts, seller self-buy protection
- **Proper image optimization** — Next.js Image component used
- **Strong SEO base** — Title template, OG tags, per-route metadata
- **Custom 404 page** — Clean, branded not-found page
- **Consistent naming** — Components, hooks, files follow conventions
- **Good data fetching architecture** — Custom hooks wrap React Query cleanly
