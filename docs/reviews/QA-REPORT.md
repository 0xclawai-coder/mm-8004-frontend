# QA Report — 2026-02-13

## Summary: 33 passed, 5 failed, 8 warnings

| Category | Passed | Failed | Warnings |
|---|---|---|---|
| Page Load (Desktop) | 11 | 0 | 0 |
| Mobile Responsive | 11 | 0 | 4 |
| Content Checks | 5 | 2 | 3 |
| Contract Button Checks | 0 | 3 | 1 |
| Console Errors | 6 | 0 | 0 |
| **Total** | **33** | **5** | **8** |

---

## Page Load Tests

All 11 pages load with HTTP 200. No page-load failures.

| Page | Path | Status | Result |
|---|---|---|---|
| Landing | `/` | 200 | ✅ Pass |
| Agent List | `/explore/agents` | 200 | ✅ Pass |
| Agent Detail (Mainnet) | `/explore/agents/143/9` | 200 | ✅ Pass |
| Agent Detail (Testnet) | `/explore/agents/10143/1` | 200 | ✅ Pass |
| Marketplace | `/trade/marketplace` | 200 | ✅ Pass |
| Listing Detail | `/trade/marketplace/10143/43` | 200 | ✅ Pass |
| Auctions | `/trade/auctions` | 200 | ✅ Pass |
| Auction Detail | `/trade/auctions/10143/1` | 200 | ✅ Pass |
| Bundles | `/trade/bundles` | 200 | ✅ Pass |
| Create | `/create` | 200 | ✅ Pass |
| Profile | `/profile` | 200 | ✅ Pass |

---

## Mobile Responsive Tests (375px)

No horizontal overflow detected on any page (`scrollWidth === 375px` on all).

| Page | Overflow | Result | Notes |
|---|---|---|---|
| Landing | No | ✅ Pass | Clean mobile layout |
| Agent List | No | ✅ Pass | |
| Agent Detail (Mainnet) | No | ✅ Pass | |
| Agent Detail (Testnet) | No | ✅ Pass | |
| Marketplace | No | ✅ Pass | |
| Listing Detail | No | ✅ Pass | ⚠️ Activity table rows very compressed |
| Auctions | No | ✅ Pass | ⚠️ Broken images (see Content Tests) |
| Auction Detail | No | ✅ Pass | |
| Bundles | No | ✅ Pass | |
| Create | No | ✅ Pass | |
| Profile | No | ✅ Pass | |

### ⚠️ Mobile Warnings

1. **Activity table tap targets too small** — On listing detail and agent detail mobile views, the Item Activity table rows have small tap targets (~20px for TX links). Apple HIG recommends 44px minimum.
2. **Filter pill buttons tightly packed** — The ALL/IDENTITY/REPUTATION/VERIFICATION tab pills on listing detail are small and closely spaced on mobile, risking mis-taps.
3. **Endpoint URLs word-break** — Long URLs in the Endpoints section break mid-word (e.g., "deploy er") which looks awkward on mobile.
4. **Auctions list: broken images on mobile** — 2 Unsplash image URLs return 404, showing empty/broken spaces on auction cards (see Content Tests below).

---

## Content Tests

### "NFT" Text Check

| Page | "NFT" Found? | Result |
|---|---|---|
| Landing | No | ✅ Pass |
| Agent List | No | ✅ Pass |
| Agent Detail (Mainnet) | No | ✅ Pass |
| Agent Detail (Testnet) | No | ✅ Pass |
| Marketplace | No | ✅ Pass |
| Listing Detail | No | ✅ Pass |
| Auctions | No | ✅ Pass |
| **Auction Detail** | **Yes — "nft" badge** | **❌ Fail** |
| Bundles | No | ✅ Pass |
| Create | No | ✅ Pass |
| Profile | No | ✅ Pass |

**Detail:** On `/trade/auctions/10143/1`, a `<span>` badge in the Agent Properties → Categories section renders the text **"nft"**. This comes from the `agent.categories` data. It should be replaced with "identity" or removed. The badge is visible at position (1142, 1026) with dimensions 31×21px.

**Source:** `src/app/trade/auctions/[chainId]/[auctionId]/page.tsx` line 340 — renders `agent.categories.map(cat => ...)` directly from API data. Fix needs to be in the backend data or a frontend mapping.

---

### Agent Detail Tabs

| Page | Identity | Reputation | Verification | Result |
|---|---|---|---|---|
| Agent Detail (Mainnet) | ✅ | ⚠️ | ✅ | ⚠️ Warning |
| Agent Detail (Testnet) | ✅ | ⚠️ | ✅ | ⚠️ Warning |

**⚠️ Warning:** The agent detail page has 5 tabs: **Overview, Feedback, Identity, Verification, Metadata**. There is no explicit **"Reputation"** tab. Reputation data (score, feedback count, reputation over time chart) is embedded within the **Overview** tab. The test requirement expected 3 distinct tabs: Identity, Reputation, Verification.

**However**, the **listing detail** page's Item Activity section does have ALL / IDENTITY / **REPUTATION** / VERIFICATION filter buttons — so the terminology exists in the trade views.

---

### Agent Names/Images (Placeholders)

| Check | Result | Detail |
|---|---|---|
| Placeholder names | **❌ Fail** | Found 3 instances: "Agent #9" (×2), "Agent #0" (×1) on `/explore/agents` |
| Agent images | ⚠️ Warning | Agent #9 and Agent #0 show purple gradient letter-avatar fallbacks, not loaded images |
| Named agents | ✅ Pass | GanjaMon, ClawdCash, etc. show proper names |
| GanjaMon image | ✅ Pass | Loads real image from grokandmon.com |

**Detail:** On the agent list page, agents with IDs #9 and #0 display as "Agent #9" and "Agent #0" with generated letter-avatar placeholders instead of real names/images. These are likely agents whose IPFS metadata failed to resolve or was never set. Other agents (GanjaMon, ClawdCash, GenesisProtocolDeployer, etc.) show proper names.

---

### Listing Detail — Agent Data Inline

| Check | Result |
|---|---|
| Agent name shown | ✅ "GenesisProtocolDeployer #163" |
| Agent image shown | ✅ Unsplash image loaded |
| Agent metadata inline | ✅ Categories, capabilities, status, reputation score all inline |
| Separate loading required | ✅ No — all data is rendered on the same page |
| Activity tabs (Identity/Reputation/Verification) | ✅ All 3 filter tabs present in Item Activity section |

---

### Additional Content Issues

1. **Duplicate agent entries** — On agent list, ClawdCash appears 3× in "Recently Deployed" and 3× in the registry table. EllaSharp appears 4×. DEE CLAWRACLE AGENT appears 2×. Likely a data/dedup issue.
2. **Auctions page: 2 broken images** — Two Unsplash URLs return 404 via Next.js image optimization:
   - `photo-1558618666-fcd25c85f82e` → 404
   - `photo-1558618666-fcd25c85f4aa` → 404
3. **Auction detail: "No activity yet" contradiction** — The Item Activity section shows a "Created" event row but also displays "No activity yet" text below it.

---

## Contract Button Tests

### Listing Detail (`/trade/marketplace/10143/43`)

| Button/Feature | Present? | Result |
|---|---|---|
| "Update Price" button | No | ❌ Fail |
| "Cancel Listing" button | No | ❌ Fail |
| Offer table | Yes ("Top Offers" section) | ✅ Pass (empty state: "No Offers Yet") |
| Offer table Accept column | Not testable | ⚠️ No offers exist to verify columns |
| Offer table Cancel column | Not testable | ⚠️ No offers exist to verify columns |
| "Connect Wallet to Buy" | Yes | ✅ (shows for disconnected users) |

**Note:** "Update Price" and "Cancel Listing" buttons are not visible in the HTML at all (not even hidden). Searching for "update" and "cancel" in the page HTML returned 0 matches. These are likely **not yet implemented** in the frontend, or they're only rendered server-side after wallet connection + owner verification.

### Auction Detail (`/trade/auctions/10143/1`)

| Button/Feature | Present? | Result |
|---|---|---|
| "Settle" button | No | ❌ Fail |
| "Cancel" button | No | ❌ Fail |
| "Connect Wallet to Bid" | Yes | ✅ Pass |
| Bid History section | Yes | ✅ Pass (empty: "No bids yet") |

**Note:** Neither "Settle" nor "Cancel" text appears anywhere in the auction detail page body. The auction is Live with 0 bids — a cancel button should be available for the seller. These seller-side action buttons appear to be **not yet implemented**.

---

## Console Errors

All pages share 2 common console errors from WalletConnect/Web3Modal (expected — dev project ID):

| Error | Type | Severity | Pages |
|---|---|---|---|
| `api.web3modal.org/appkit/v1/config?projectId=nad8004_dev` | 403 | Low (dev config) | All 11 |
| `pulse.walletconnect.org/e?projectId=nad8004_dev` | 400 | Low (analytics) | All 11 |

**Auctions page** has 2 additional errors:

| Error | Type | Severity |
|---|---|---|
| `_next/image?url=...photo-1558618666-fcd25c85f82e...` | 404 | Medium — broken image |
| `_next/image?url=...photo-1558618666-fcd25c85f4aa...` | 404 | Medium — broken image |

**No JavaScript runtime errors were detected on any page.** All console errors are resource-loading (network) errors only.

---

## Screenshots

All screenshots saved to `/tmp/ss/qa/`:

### Desktop (1280px)
| Page | File |
|---|---|
| Landing | `landing-desktop.png` |
| Agent List | `agent-list-desktop.png` |
| Agent Detail (Mainnet) | `agent-detail-mainnet-desktop.png` |
| Agent Detail (Testnet) | `agent-detail-testnet-desktop.png` |
| Marketplace | `marketplace-desktop.png` |
| Listing Detail | `listing-detail-desktop.png` |
| Auctions | `auctions-desktop.png` |
| Auction Detail | `auction-detail-desktop.png` |
| Bundles | `bundles-desktop.png` |
| Create | `create-desktop.png` |
| Profile | `profile-desktop.png` |

### Mobile (375px)
| Page | File |
|---|---|
| Landing | `landing-mobile.png` |
| Agent List | `agent-list-mobile.png` |
| Agent Detail (Mainnet) | `agent-detail-mainnet-mobile.png` |
| Agent Detail (Testnet) | `agent-detail-testnet-mobile.png` |
| Marketplace | `marketplace-mobile.png` |
| Listing Detail | `listing-detail-mobile.png` |
| Auctions | `auctions-mobile.png` |
| Auction Detail | `auction-detail-mobile.png` |
| Bundles | `bundles-mobile.png` |
| Create | `create-mobile.png` |
| Profile | `profile-mobile.png` |

### Button Checks
| Page | File |
|---|---|
| Listing Buttons | `listing-buttons.png` |
| Auction Buttons | `auction-buttons.png` |

---

## Priority Fix List

### 🔴 High Priority
1. **Missing seller buttons on listing detail** — "Update Price" and "Cancel Listing" not implemented
2. **Missing seller buttons on auction detail** — "Settle" and "Cancel" not implemented
3. **"nft" badge on auction detail** — Should be "identity" or removed (categories data issue)

### 🟡 Medium Priority
4. **Broken Unsplash images on auctions page** — 2 URLs return 404
5. **Agent placeholder names** — "Agent #9", "Agent #0" showing instead of real names (IPFS metadata not resolving)
6. **Duplicate agent entries** — ClawdCash ×3, EllaSharp ×4, DEE CLAWRACLE AGENT ×2

### 🟢 Low Priority
7. **WalletConnect 403/400** — Dev project ID `nad8004_dev` — configure proper project ID for production
8. **Agent detail tab naming** — No explicit "Reputation" tab (reputation data is in Overview tab)
9. **Mobile tap targets** — Activity table links and filter pills below 44px minimum
10. **Auction detail activity contradiction** — Shows "Created" event + "No activity yet" simultaneously
