# Skeleton Pattern Refactoring Plan

## Current State (molt-marketplace)
- 9 `loading.tsx` files (one per route)
- Each is a large hand-crafted Skeleton layout mimicking the page structure
- Problem: breaks every time page layout changes, high maintenance burden

## Reference: nad-fun-front Pattern
- **0 `loading.tsx` files** — no route-level skeletons
- DataTable handles its own loading state (skeleton rows as data)
- Individual values use inline: `isLoading ? <Skeleton className="h-4 w-20" /> : value`
- Search uses animated spinner (ping effect), not skeleton
- Skeleton component is minimal: `animate-pulse rounded-md bg-gray-700/50`

## Plan

### 1. Delete all `loading.tsx` files
```
src/app/loading.tsx
src/app/explore/agents/loading.tsx
src/app/trade/marketplace/loading.tsx
src/app/trade/auctions/loading.tsx
src/app/trade/bundles/loading.tsx
src/app/analytics/overview/loading.tsx
src/app/analytics/leaderboard/loading.tsx
src/app/analytics/rankings/loading.tsx
src/app/explore/activity/loading.tsx
```

### 2. DataTable — add `isLoading` prop
- When `isLoading=true`, render N skeleton rows (default 5)
- Each cell shows `<Skeleton />` matching column width
- Pagination shows skeleton page indicator
- No external skeleton component needed

### 3. List/Card pages — inline loading
- Agents browse: `isLoading ? <CardSkeleton /> : <AgentCard />`
- Use a tiny inline skeleton, not a separate component
- Keep it in the same file, ~5 lines max

### 4. Detail pages — simple spinner
- `if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin" /></div>`
- One line, no complex skeleton layout
- Or keep existing LoadingSkeleton but simplify to just spinner + back button

### 5. Stats/numbers — inline
```tsx
<span>{isLoading ? <Skeleton className="inline-block h-4 w-12" /> : formatNumber(value)}</span>
```

## Key Principles
- **No separate skeleton files** — loading state lives with the component
- **DataTable owns its loading** — skeleton rows are table data
- **Inline over component** — `isLoading ? <Skeleton /> : value` is fine
- **Simple > accurate** — a spinner is better than a stale skeleton that doesn't match layout

## Contract Addresses
- Testnet: `0x0fd6B881b208d2b0b7Be11F1eB005A2873dD5D2e`
- Mainnet: `0x48C803679fe35B2b85922B094E963A74680AAd9E`

## Price Format
- Backend returns `"500e+16"` = 5 MON (5e18 wei)
- Frontend `formatPrice()` handles this
- For contract calls: `BigInt(parseFloat(price))` or parse manually
