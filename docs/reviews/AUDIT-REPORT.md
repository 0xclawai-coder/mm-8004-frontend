# Smart Contract Audit Report — MoltMarketplace

**Date:** 2026-02-13  
**Auditor:** Claw AI (Automated Security Audit)  
**Contract:** `MoltMarketplace.sol`  
**Solidity:** ^0.8.28  
**Framework:** Foundry + OpenZeppelin (Upgradeable)  
**Target Chain:** Monad (EVM-compatible)  

---

## Severity Levels

| Level | Description |
|-------|-------------|
| **Critical** | Direct loss of funds or permanent locking of assets |
| **High** | Significant risk of fund loss under realistic conditions |
| **Medium** | Unexpected behavior, limited fund risk, or broken invariants |
| **Low** | Minor issues, best-practice violations |
| **Informational** | Suggestions, code quality, gas optimizations |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 5 |
| Low | 4 |
| Informational | 4 |
| Gas Optimizations | 5 |

---

## Findings

---

### [CRITICAL] C-1: `_safeRefund` for ERC-20 tokens can permanently block auction settlement

- **Location:** `MoltMarketplace.sol`, `_safeRefund()` (line ~466)
- **Description:**  
  `_safeRefund` is designed to gracefully handle failed native (MON) refunds by escrowing them in `pendingWithdrawals`. However, for ERC-20 tokens, it calls `IERC20.safeTransfer()` which **reverts on failure**. If the previous highest bidder is a contract that blocks ERC-20 transfers (e.g., a blacklisted USDC address, a contract with a reverting `onTokenTransfer`, or a paused token), then:
  - `bid()` → `_safeRefund()` reverts → **no new bids can ever be placed**
  - `settleAuction()` → `_safeRefund()` (reserve-not-met path) reverts → **auction can never settle**
  
  This effectively **locks the NFT in the contract forever** and freezes all escrowed funds for that auction.

- **Impact:** Permanent loss of NFT + locked funds. A malicious bidder can intentionally grief any ERC-20 auction by bidding from a contract that later blocks `transfer()`.

- **Recommendation:**  
  Wrap the ERC-20 transfer in `_safeRefund` with a try/catch or low-level call, similar to the native refund pattern. Escrow failed ERC-20 refunds in a separate `pendingERC20Withdrawals` mapping:
  ```solidity
  function _safeRefund(address to, address paymentToken, uint256 amount) internal {
      if (paymentToken == address(0)) {
          (bool success,) = to.call{value: amount}("");
          if (!success) {
              pendingWithdrawals[to] += amount;
              emit RefundEscrowed(to, amount);
          }
      } else {
          // Use try/catch to prevent griefing
          try IERC20(paymentToken).transfer(to, amount) returns (bool success) {
              if (!success) {
                  pendingERC20Withdrawals[to][paymentToken] += amount;
                  emit ERC20RefundEscrowed(to, paymentToken, amount);
              }
          } catch {
              pendingERC20Withdrawals[to][paymentToken] += amount;
              emit ERC20RefundEscrowed(to, paymentToken, amount);
          }
      }
  }
  ```

---

### [HIGH] H-1: `_sendNative` reverts on failure — fund distribution can be permanently blocked

- **Location:** `MoltMarketplace.sol`, `_sendNative()` (line ~440), used in `_distributeFunds()` → `_sendPayment()`
- **Description:**  
  `_sendNative` does `require(success, "Native transfer failed")`. It is called during `_distributeFunds()` which pays the fee recipient, royalty receiver, and seller in sequence. If **any** of these addresses is a contract that rejects native payments (no `receive()`/`fallback()`), then:
  - `buy()` reverts → buyer can never purchase that listing
  - `settleAuction()` reverts → auction can never settle
  - `buyDutchAuction()` reverts → dutch auction can never complete

  Since `feeRecipient` is admin-controlled and royalty receivers come from external ERC-2981 contracts, a **malicious or buggy royalty receiver** can permanently block all native-currency sales for that NFT contract.

- **Impact:** NFTs locked in contract, seller can never receive payment.

- **Recommendation:**  
  Use the pull-payment pattern (like `_safeRefund`) for fund distribution as well, or at minimum wrap the royalty payment in a try/catch since it depends on external, untrusted data:
  ```solidity
  // For royalty: use safe pattern — don't let untrusted royalty receiver block sales
  if (royaltyAmount > 0 && receiver != address(0) && royaltyAmount <= remaining) {
      if (paymentToken == address(0)) {
          (bool success,) = receiver.call{value: royaltyAmount}("");
          if (success) remaining -= royaltyAmount;
          // else: royalty goes to seller (fail-open)
      } else {
          // similar pattern
      }
  }
  ```

---

### [HIGH] H-2: Offer system does not escrow funds — offerer can front-run `acceptOffer` by withdrawing approval

- **Location:** `MoltMarketplace.sol`, `makeOffer()` (line ~138), `acceptOffer()` (line ~158)
- **Description:**  
  When an offer is made, the contract only **checks** the offerer's balance and allowance but does **not escrow** the ERC-20 tokens. By the time the NFT owner calls `acceptOffer()`, the offerer may have:
  1. Spent the tokens elsewhere
  2. Revoked allowance
  3. Moved tokens to dodge the transfer
  
  While `safeTransferFrom` would revert in `acceptOffer`, the NFT seller wastes gas and gets a bad UX. More critically, a malicious offerer can create "phantom offers" that look valid on-chain/UI but are impossible to accept — this is a form of **order book pollution/griefing**.
  
  The same applies to `makeCollectionOffer()` / `acceptCollectionOffer()`.

- **Impact:** Griefing sellers, wasted gas, broken UX. No direct fund loss but severe usability issue.

- **Recommendation:**  
  This is a known design tradeoff (OpenSea Seaport uses a similar non-escrow model for gas efficiency). For a hackathon this is acceptable, but document it clearly. Optionally add a `validateOffer()` view function that re-checks balance/allowance for frontends.

---

### [HIGH] H-3: Mixing non-upgradeable `ReentrancyGuard` with upgradeable contract — storage collision risk

- **Location:** `MoltMarketplace.sol`, line 20 (contract declaration)
- **Description:**  
  The contract inherits from `ReentrancyGuard` (non-upgradeable, from `@openzeppelin/contracts/`) alongside upgradeable contracts (`AccessControlUpgradeable`, `PausableUpgradeable`, `UUPSUpgradeable` from `@openzeppelin/contracts-upgradeable/`).

  The non-upgradeable `ReentrancyGuard` uses a constructor to initialize its `_status` variable to `1`. In a proxy pattern (UUPS), **constructors are not called on the proxy**, so the storage slot for `_status` stays at `0`. When `nonReentrant` checks `_status != _ENTERED` (where `_ENTERED = 2`), it works by accident since `0 != 2`. However:
  
  1. The first call costs extra gas because it writes from `0 → 2 → 0` instead of `1 → 2 → 1` (cold-to-warm storage behavior differs).
  2. More importantly, the **storage layout** of non-upgradeable `ReentrancyGuard` is not coordinated with the upgradeable base contracts. This can cause **storage slot collisions** when the contract is upgraded, potentially corrupting state.
  3. OpenZeppelin explicitly provides `ReentrancyGuardUpgradeable` for this purpose.

- **Impact:** Potential storage corruption on upgrade. Currently functional but architecturally unsafe.

- **Recommendation:**  
  Replace with `ReentrancyGuardUpgradeable`:
  ```solidity
  import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
  
  // In initialize():
  __ReentrancyGuard_init();
  ```

---

### [MEDIUM] M-1: Dutch auction can be bought after `endTime` at `endPrice` — no expiry check

- **Location:** `MoltMarketplace.sol`, `buyDutchAuction()` (line ~291), `_getDutchPrice()` (line ~455)
- **Description:**  
  `buyDutchAuction()` checks `block.timestamp >= auction.startTime` but does **not** check `block.timestamp < auction.endTime` or `block.timestamp <= auction.endTime`. Meanwhile, `_getDutchPrice()` returns `endPrice` when `block.timestamp >= endTime`. This means the Dutch auction remains purchasable **indefinitely** at the floor price after duration expires, which is not the expected behavior for a Dutch auction (typically it should expire).

- **Impact:** Sellers may expect the Dutch auction to auto-expire, but it stays active forever at the lowest price. Seller must manually cancel.

- **Recommendation:**  
  Add an expiry check in `buyDutchAuction()`:
  ```solidity
  require(block.timestamp <= auction.endTime, "Dutch auction expired");
  ```
  Or document clearly that Dutch auctions remain buyable at `endPrice` until cancelled.

---

### [MEDIUM] M-2: Royalty payments can be exploited by malicious ERC-2981 implementations

- **Location:** `MoltMarketplace.sol`, `_distributeFunds()` (line ~420)
- **Description:**  
  The royalty query `IERC2981(nftContract).royaltyInfo()` trusts the external contract to return a reasonable royalty amount. The only guard is `royaltyAmount <= remaining` (remaining after platform fee). A malicious NFT contract could return `royaltyAmount = remaining`, taking 100% of the sale price minus platform fee, leaving the seller with 0.
  
  While there's a `try/catch` around the call (good!), there's no **cap** on the royalty percentage.

- **Impact:** Sellers could list NFTs from malicious contracts and receive zero payment (or buyers might unknowingly participate in sales where the seller gets nothing).

- **Recommendation:**  
  Add a maximum royalty cap (e.g., 25%):
  ```solidity
  uint256 maxRoyalty = (totalAmount * 2500) / BPS_DENOMINATOR; // 25% cap
  if (royaltyAmount > maxRoyalty) royaltyAmount = maxRoyalty;
  ```

---

### [MEDIUM] M-3: Bundle royalty distribution only considers the first NFT

- **Location:** `MoltMarketplace.sol`, `buyBundle()` (line ~344)
- **Description:**  
  ```solidity
  _distributeFunds(bundle.nftContracts[0], bundle.tokenIds[0], bundle.seller, ...);
  ```
  Only the first NFT's royalty info is used for the entire bundle price. If the bundle contains NFTs from multiple collections with different royalty receivers, all royalties except the first are silently skipped.

- **Impact:** Royalty receivers of non-first NFTs in bundles receive nothing. May violate royalty agreements.

- **Recommendation:**  
  Either:
  1. Distribute royalties proportionally (price / count per NFT, query each), or
  2. Restrict bundles to single-collection (all same `nftContract`), or
  3. Document this limitation clearly.

---

### [MEDIUM] M-4: Expired listings/auctions can have their NFTs stuck if seller loses access

- **Location:** `MoltMarketplace.sol`, `cancelListing()`, `cancelDutchAuction()`
- **Description:**  
  When a listing expires, the NFT remains in the contract. The seller must call `cancelListing()` to reclaim it. If the seller loses access to their wallet, the NFT is **permanently locked**. There is no admin-level emergency recovery function.

  The same applies to Dutch auctions after their duration ends (since they remain buyable per M-1, this is slightly mitigated but still relevant if the payment token is removed from the allowlist).

- **Impact:** Potential permanent loss of NFTs in edge cases.

- **Recommendation:**  
  Add an admin emergency function to return NFTs from expired/cancelled listings:
  ```solidity
  function emergencyRecoverNFT(uint256 listingId) external onlyRole(DEFAULT_ADMIN_ROLE) {
      Listing storage listing = _listings[listingId];
      require(listing.status == ListingStatus.Active, "Not active");
      require(block.timestamp > listing.expiry, "Not expired");
      listing.status = ListingStatus.Cancelled;
      IERC721(listing.nftContract).transferFrom(address(this), listing.seller, listing.tokenId);
  }
  ```

---

### [MEDIUM] M-5: `_collectPayment` overpayment refund in `buy()` is vulnerable to reentrancy via native refund

- **Location:** `MoltMarketplace.sol`, `_collectPayment()` (line ~406)
- **Description:**  
  In `_collectPayment`, if the buyer overpays in native currency, the excess is refunded via `_sendNative(from, msg.value - amount)` which uses a low-level `.call{value:}()`. Although the `buy()` function has `nonReentrant`, the `bid()` function also goes through a similar path in `_settleBuyNow()`. The `nonReentrant` modifier protects against reentrancy within the same contract, so this is technically safe. However, the refund happens **before** `_distributeFunds()` and NFT transfer in the call flow — the state (`listing.status = Sold`) is already set, so reentrancy is mitigated by the status check.

  Actually, reviewing more carefully: in `_collectPayment`, the refund `_sendNative(from, ...)` happens, then execution returns to `buy()` which calls `_distributeFunds` and transfers the NFT. Since `nonReentrant` is active, reentry is blocked. **This is safe** but the ordering is fragile — consider CEI pattern.

- **Impact:** Low in practice due to `nonReentrant`, but architectural concern.

- **Recommendation:**  
  Consider using the Checks-Effects-Interactions pattern more strictly — refund excess at the end of the function, not during payment collection.

---

### [LOW] L-1: `updateListingPrice` missing `nonReentrant` and `whenNotPaused` modifiers

- **Location:** `MoltMarketplace.sol`, `updateListingPrice()` (line ~127)
- **Description:**  
  Unlike all other state-changing functions, `updateListingPrice()` has no `nonReentrant` or `whenNotPaused` modifier. While reentrancy risk here is minimal (no external calls), the missing `whenNotPaused` means sellers can update listing prices even when the contract is paused by admin (e.g., during an emergency).

- **Impact:** Minor — sellers can still modify listings during a pause, which may conflict with admin intent.

- **Recommendation:**  
  Add `whenNotPaused` modifier:
  ```solidity
  function updateListingPrice(uint256 listingId, uint256 newPrice) external whenNotPaused { ... }
  ```

---

### [LOW] L-2: `cancelOffer`, `cancelCollectionOffer` missing `whenNotPaused` modifiers

- **Location:** `MoltMarketplace.sol`, `cancelOffer()` (line ~171), `cancelCollectionOffer()` (line ~210)
- **Description:**  
  These functions lack `whenNotPaused`. While it's debatable whether cancellation should be blocked during pause (users should arguably always be able to cancel), the inconsistency with other cancel functions (`cancelListing` also lacks `whenNotPaused`) suggests this is unintentional.

- **Impact:** Minimal. Consistency issue.

- **Recommendation:**  
  Decide on a consistent policy: either all cancel functions work during pause (reasonable — users should be able to exit positions) or none do. Document the decision.

---

### [LOW] L-3: No validation that `nftContract` is actually an ERC-721 contract

- **Location:** `MoltMarketplace.sol`, `list()`, `createAuction()`, `createDutchAuction()`, `createBundleListing()`
- **Description:**  
  The contract blindly calls `IERC721(nftContract).transferFrom(...)` without checking that `nftContract` supports ERC-721 (via ERC-165 `supportsInterface`). If a non-ERC-721 address is provided, the `transferFrom` call may succeed unexpectedly (e.g., an ERC-20 token with a matching function signature) or fail with a confusing error.

- **Impact:** Edge case — confusing error messages, potential for unexpected behavior with non-standard contracts.

- **Recommendation:**  
  Add an ERC-165 check:
  ```solidity
  require(IERC165(nftContract).supportsInterface(type(IERC721).interfaceId), "Not ERC-721");
  ```

---

### [LOW] L-4: `bid()` for ERC-20 auctions ignores the `amount` parameter for native auctions

- **Location:** `MoltMarketplace.sol`, `bid()` (line ~241)
- **Description:**  
  For native (MON) auctions, `bidAmount = msg.value` and the `amount` parameter is completely ignored. A user could pass `amount = 999999` with `msg.value = 1` and the bid would use `1`. While technically correct, this could confuse integrators.

- **Impact:** Informational. UX confusion for frontend integrators.

- **Recommendation:**  
  Add a comment or require `amount == 0` for native auctions:
  ```solidity
  if (auction.paymentToken == address(0)) {
      require(amount == 0, "Use msg.value for native bids");
      bidAmount = msg.value;
  }
  ```

---

### [INFORMATIONAL] I-1: `receive() external payable {}` allows arbitrary native token deposits

- **Location:** `MoltMarketplace.sol`, last line
- **Description:**  
  The contract has an unrestricted `receive()` function, meaning anyone can send native tokens to it without going through marketplace functions. These tokens would be effectively **stuck** (no admin withdrawal function exists for arbitrary native balances).

- **Recommendation:**  
  Either remove `receive()` or add an admin function to sweep accidentally sent native tokens. Note: `receive()` may be needed for refund flows where the contract receives native tokens back, but typically those go through `msg.value` in function calls.

---

### [INFORMATIONAL] I-2: No event emitted in `withdrawPending()`

- **Location:** `MoltMarketplace.sol`, `withdrawPending()` (line ~476)
- **Description:**  
  Successful withdrawals of escrowed refunds emit no event, making it harder to track on-chain.

- **Recommendation:**  
  Add an event:
  ```solidity
  event PendingWithdrawn(address indexed user, uint256 amount);
  ```

---

### [INFORMATIONAL] I-3: Counter IDs start at 1 — consider using 0 as a sentinel

- **Location:** `MoltMarketplace.sol`, `initialize()` (line ~71)
- **Description:**  
  All `_next*Id` counters start at 1, meaning ID 0 is never used. This is actually a **good pattern** (0 serves as "does not exist" sentinel), but it's not documented and view functions like `getListing(0)` will return a zero-initialized struct that looks like a valid (but empty) listing.

- **Recommendation:**  
  Document this convention. Consider adding existence checks in view functions.

---

### [INFORMATIONAL] I-4: No `__UUPSUpgradeable_init()` call in `initialize()`

- **Location:** `MoltMarketplace.sol`, `initialize()` (line ~63)
- **Description:**  
  While `UUPSUpgradeable` doesn't strictly require initialization in current OZ versions (v5), calling `__UUPSUpgradeable_init()` is best practice for forward compatibility and consistency with the other `__*_init()` calls.

- **Recommendation:**  
  Add `__UUPSUpgradeable_init();` in the initializer.

---

## Gas Optimizations

### G-1: Use `unchecked` for counter increments
- **Location:** `_nextListingId++`, `_nextOfferId++`, etc.
- These counters cannot realistically overflow a `uint256`. Wrapping in `unchecked {}` saves ~80 gas per increment.

### G-2: Cache storage variables in local variables
- **Location:** `bid()`, `settleAuction()`, `buyBundle()`
- Multiple reads of `auction.paymentToken`, `auction.highestBidder`, `bundle.nftContracts.length` etc. from storage. Caching in `memory` reduces SLOAD costs.
- Example: `address paymentToken = auction.paymentToken;` instead of reading from storage 3+ times.

### G-3: `bundle.nftContracts.length` read from storage in loop condition
- **Location:** `buyBundle()` (line ~351), `cancelBundleListing()` (line ~362)
- ```solidity
  for (uint256 i = 0; i < bundle.nftContracts.length; i++)
  ```
  Cache the length: `uint256 len = bundle.nftContracts.length;`

### G-4: Use `++i` instead of `i++` in for loops
- Saves ~5 gas per iteration (pre-increment avoids a temporary copy in the optimizer).

### G-5: Pack struct fields for reduced storage slots
- `Listing` struct: `seller` (20 bytes) + `status` (1 byte) could share a slot if reordered. Currently `status` is the last field after `expiry` (32 bytes), wasting a full slot.
- Same applies to `Offer`, `Auction`, etc.

---

## Positive Observations

### ✅ Well-designed refund escrow pattern
The `_safeRefund` + `pendingWithdrawals` + `withdrawPending()` pattern for native refunds is excellent. It prevents the classic "failed refund blocks auction" issue for native tokens. (Just needs the same treatment for ERC-20 — see C-1.)

### ✅ Anti-snipe mechanism in auctions
The 10-minute extension on last-minute bids is a strong anti-sniping feature that improves auction fairness.

### ✅ 5% minimum bid increment
Prevents dust-bid griefing where bidders increment by 1 wei to extend auctions indefinitely.

### ✅ Good access control architecture
Role-based access with separate roles for pausing, fee management, and token management follows the principle of least privilege.

### ✅ Platform fee hard cap
`MAX_PLATFORM_FEE_BPS = 1_000` (10%) is a reasonable hard cap that protects users even if the admin role is compromised.

### ✅ Buy-now feature in English auctions
Clean implementation that refunds the previous bidder and settles immediately.

### ✅ `_disableInitializers()` in constructor
Correctly prevents initialization of the implementation contract directly (UUPS best practice).

### ✅ Dutch auction price decay is mathematically correct
Linear interpolation with no rounding issues for reasonable values.

### ✅ SafeERC20 usage
Proper use of `SafeERC20` for all ERC-20 interactions prevents silent-failure attacks from non-compliant tokens.

### ✅ `validPaymentToken` modifier
Payment token allowlisting prevents users from creating listings/auctions with worthless or malicious tokens.

---

## Architecture Notes

- The contract is well-structured with clear separation of concerns (listings, offers, auctions, admin).
- Event coverage is comprehensive — all state changes emit events.
- The UUPS proxy pattern is correctly implemented with `_authorizeUpgrade` restricted to admin.
- The ERC-8004 interfaces (Identity/Reputation/Validation registries) exist in the interfaces folder but are not used by the marketplace contract — presumably for future integration.

---

## Conclusion

The MoltMarketplace is a **well-written hackathon contract** with thoughtful design choices. The most critical issue (C-1: ERC-20 refund griefing) should be fixed before any mainnet deployment. The high-severity issues (H-1, H-3) are important for production but unlikely to cause issues during a hackathon demo. The medium findings are standard marketplace edge cases that should be addressed for a production release.

**Priority fixes for hackathon:**
1. **C-1** — Make `_safeRefund` non-reverting for ERC-20 tokens
2. **H-3** — Switch to `ReentrancyGuardUpgradeable`
3. **M-1** — Add expiry check to Dutch auction

**Priority fixes for production:**
- All of the above, plus H-1, M-2, M-3, M-4
