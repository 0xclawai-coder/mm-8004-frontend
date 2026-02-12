# Frontend Changelog

## Code Rules

### ⚠️ Drawer > Sheet — 필수!
- 모바일 바텀시트/모달은 **Drawer** 사용 (Sheet 대신)
- `@/components/ui/drawer` (vaul 기반)
- Sheet는 desktop side panel 용도로만 제한적 사용

### ⚠️ Gap over Margin — 필수!
- `margin` (m-, mt-, mb-, ml-, mr-, mx-, my-) 사용 금지
- 대신 **flex/grid + gap** 시스템 사용
- `space-y-*`, `space-x-*`도 OK (내부적으로 margin이지만 부모-자식 관계 명확)
- margin 허용 케이스: 음수 마진(`-m-*`), 예외적 상황만
- 이유: gap은 부모가 제어 → 레이아웃 일관성, margin은 자식이 제어 → 충돌 위험

## 2026-02-13

### Hydration & HTML Fixes
- `<p>` containing `<Skeleton>` (`<div>`) → changed to `<div>` wrapper (marketplace, auctions, bundles pagination)
- Table rows: `<Link className="contents">` in `<tbody>` → `router.push()` + `onMouseEnter` prefetch
  - Valid HTML while keeping prefetch benefit

### HoloCard Unification
- Refactored `HoloCard.tsx` to accept generic props (not just `AgentDetail`)
- Applied to all 3 detail pages: agent, listing, auction
- Consistent 300px × 420px pokemon-card style with holographic effects

### URL Structure Refactoring
- `/explore/agents/[agentId]` → `/explore/agents/[chainId]/[agentId]`
- `/trade/marketplace/[id]` → `/trade/marketplace/[chainId]/[listingId]`
- `/trade/auctions/[id]` → `/trade/auctions/[chainId]/[auctionId]`
- Removed all `id.split('-')` parsing logic
- Updated 11 files with new href patterns

### Auction Detail API Fix
- Backend returns flat `{auction_id, ..., bids:[]}` but frontend expected `{auction, bids}`
- Added normalization in `getAuctionDetail()` — maps flat → nested structure

### Responsive QA (Playwright Audit — 20 screenshots)
1. ✅ Leaderboard table mobile clipping — reduced padding, `whitespace-nowrap`
2. ✅ Category filter scroll indicator — gradient fade overlay on mobile
3. ✅ Auction cards mobile 2-col → 1-col
4. ✅ Marketplace IDENTITY column too wide — `maxSize: 280`
5. ✅ Home Recent Listings mobile 1-col
6. ✅ Total Sales: 0 → "Coming Soon" with opacity
7. ✅ Create page dead space reduced
8. ✅ Auction Buy Now badge overlap fixed
9. ✅ Agent search bar width expanded
10. ✅ muted-foreground contrast improved (oklch 0.65 → 0.71)

### Contract TX Testing (Testnet)
- `buy(41)` — 5 MON ✅ (0x30fe93...)
- `bid(19, 5 MON)` ✅ (0xfcb7e2...)
- `bid(19, 6 MON)` outbid from sim wallet ✅ (0xd64a98...)
- `bid(20, 80 MON)` buyNow via bid ✅ (0x94e0ba...)
- Note: `buyNow` is not a separate function — `bid(amount >= buyNowPrice)` auto-settles

## In Progress
- Detail page layout fix (HoloCard only on left, properties move to right column)
- Contract integration (wagmi useWriteContract for buy/bid/offer)
- Skeleton pattern refactoring (see SKELETON-PLAN.md)
