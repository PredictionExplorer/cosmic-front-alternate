# Frontend Design Audit — Cosmic Signature

This document describes **design-level** issues in the frontend that lead to operational errors, fragile behavior, and hard-to-maintain code. The focus is on architecture and patterns, not individual bug fixes.

---

## 1. No API response contract enforcement

**Problem:** The backend returns every JSON response with `status` and `error` (e.g. `status: 1`, `error: ""` on success). The frontend **never** checks these fields. It treats any HTTP 200 as success and uses `data` as-is.

**Consequences:**
- If the backend returns `200` with `status: 0` and `error: "Provided address wasn't found"`, the frontend still uses `data.UserInfo` (possibly undefined) and components render with null/undefined or wrong shapes.
- No way to show the API’s own error message to the user; only network/axios errors surface.
- Success and “soft” failure look the same to the client.

**Design fix:** Introduce a single API response layer that:
- Expects `{ status, error, ...payload }` from every endpoint.
- Throws or returns a typed error when `status !== 1` or when `error` is non-empty, including the backend message.
- Exposes only the payload to the rest of the app. All API methods should go through this layer.

---

## 2. Inconsistent and duplicated response key handling

**Problem:** The API service guesses multiple possible keys for the same logical data, indicating an undefined or changing backend contract:

- `getETHDonationsSimple`: `data.DirectCGDonations || data.EthDonations || []`
- `getUnclaimedDonatedNFTsByRound`: `data.NFTDonations || data.nfDonations || []`
- `getERC20DonationsList`: `data.ERC20Donations || data.DonationsERC20 || data.DonatedPrizesERC20 || data.GlobalERC20Donations || []`
- Price fallbacks: `priceData?.ETHPrice ?? priceData?.eth_price ?? priceData?.price`

**Consequences:**
- Different backend versions or endpoints can expose different keys; the frontend hides the problem with fallbacks instead of failing fast.
- No single source of truth: neither the backend nor the frontend types define the real contract.
- Typos or renames on the backend (e.g. `nfDonations`) get silently papered over.

**Design fix:**
- Define a single, documented API contract (per endpoint) shared or derived from backend (e.g. OpenAPI or a shared TypeScript type repo).
- Use one key per concept in the client; if the backend sends alternate keys, normalize in one adapter layer and keep the rest of the app on a single shape.
- Prefer failing or logging when the expected key is missing over silent fallbacks to other keys.

---

## 3. No runtime validation of API payloads

**Problem:** Types (e.g. in `src/types/index.ts` and `apiTransforms.ts`) describe what the frontend *expects*, but there is no validation that the backend actually returns that shape. Data is trusted after `await apiClient.get(...)`.

**Consequences:**
- Backend can change field types (e.g. string vs number for wei), add/remove fields, or return null; the app can crash or show wrong values (e.g. “NaN ETH”, blank lists).
- Transformations (e.g. `transformBidList`) assume a fixed structure; if the API changes, transforms and UI break in opaque ways.

**Design fix:**
- Validate at the boundary: one place per endpoint (or per “resource”) that checks the response shape (e.g. with Zod, io-ts, or a small validator).
- Invalid payloads should not be passed into state; throw or return a typed error and show a clear message to the user.
- Keep transforms pure and operating on already-validated, typed data.

---

## 4. Split and duplicated type definitions

**Problem:** There are several overlapping type systems:
- `src/types/index.ts`: domain-ish types (e.g. `Bid`, `Round`, `NFT`) that don’t match the API (e.g. `Bid` has `id`, `type: 'ETH'|'CST'`, while the API uses `EvtLogId`, `BidType` number).
- `apiTransforms.ts`: `ApiBidResponse` and `ComponentBidData` used for bids only; other endpoints have no similar contract.
- Page-level interfaces: e.g. `user/[address]/page.tsx` defines its own `Bid`, `ClaimHistory`, `DonatedNFT`, `UserInfo`, etc., and does ad-hoc mapping from API responses.

**Consequences:**
- Same concept (e.g. “bid”) has different shapes in different parts of the app; refactors are error-prone.
- New pages or features tend to add new local types and manual mapping instead of reusing a single pipeline (API → validated → transformed → UI).
- TypeScript can’t guarantee that a “Bid” in one file is the same as in another.

**Design fix:**
- Define a single pipeline per domain: **API DTO** (matches backend) → **validated** → **domain/model** (used in UI). Put shared types in a dedicated module (e.g. `api/types`, `domain/types`).
- Use the same DTO/domain types and transforms everywhere (bids, user info, rounds, etc.); pages should not redefine core entities.
- Prefer one transform per resource (like `transformBidList`) and reuse it in all consumers (home, play, user stats, etc.).

---

## 5. Global API singleton and chain/URL lifecycle

**Problem:** The API base URL is resolved at module load time via `getApiBaseUrl()`, and the axios instance is created with that. When the user switches network, `setChainId()` updates `apiClient.defaults.baseURL`. So:
- First request can run before any `setChainId()` (e.g. from a provider), so it may hit the wrong backend.
- Nothing forces the app to call `setChainId` when the wallet chain changes; it’s easy to have a mismatch (e.g. Arbitrum One UI vs Sepolia API).

**Consequences:**
- Wrong chain data (e.g. wrong round, wrong bids) or 404s if the backend is chain-specific.
- Hard-to-reproduce bugs that depend on load order and when the user switches network.

**Design fix:**
- Resolve base URL per request from current chain (e.g. from wagmi/context), or ensure a single place (e.g. root layout or provider) calls `setChainId` on mount and on every chain change and that no API call runs before that.
- Consider making the API client chain-aware by default (e.g. accept chainId in methods or get it from a hook) instead of a mutable singleton.

---

## 6. Context and pages assume dashboard shape

**Problem:** `ApiDataContext` fetches `getDashboardInfo()` and sets `dashboardData` to the raw `data`. The context type lists a subset of fields (e.g. `CurRoundNum`, `BidPriceEth`) but the backend can return more or different fields (e.g. `ActivationTime` as number or string). Components then read `dashboardData?.CurRoundStats?.ActivationTime` and implement defensive parsing (number vs string vs “0”) in multiple places.

**Consequences:**
- Any backend change to dashboard shape can break multiple screens; the “contract” is implicit and scattered.
- Duplicated parsing logic (e.g. round activation time) in home and play pages.
- No single place that turns “dashboard API response” into a stable, typed structure for the rest of the app.

**Design fix:**
- Treat the dashboard as a single resource: validate and normalize in one place (e.g. in the API layer or a dashboard adapter), then expose a single dashboard type to context and components.
- Put all “activation time” / “prize time” parsing in that adapter so pages don’t reimplement it.

---

## 7. Scattered loading and error handling

**Problem:** Each page implements its own loading and error state (useState, try/catch, “no activity” vs “error” messages). There is no shared pattern for “loading”, “error with message”, “empty result”, and “success”.

**Consequences:**
- Inconsistent UX (some pages show a toast, others a full-page message, others only console).
- Repeated boilerplate and easy to forget to handle loading or error in new features.
- Hard to add global behavior (e.g. retry, reporting) because handling is local.

**Design fix:**
- Introduce a small data-fetching pattern (e.g. custom hooks or a thin wrapper around fetch/axios) that returns `{ data, error, status, isLoading }` and optionally supports retry and logging.
- Use it for all API-backed data so loading and error handling are consistent and centralized.

---

## 8. Heavy per-page data fetching and duplication

**Problem:** Pages like the user stats page (`user/[address]/page.tsx`) call many endpoints in parallel (`getUserInfo`, `getUserBalance`, `getClaimHistoryByUser`, staking, donations, etc.) and each page redefines how it maps and stores that data. The same or similar data is sometimes fetched again on other pages (e.g. dashboard + play both need round/prize time and bids).

**Consequences:**
- Over-fetching and duplicate requests when navigating; no shared cache.
- Large, complex components with many useState/useEffect and local types; hard to test and refactor.
- Backend changes require updates in multiple pages.

**Design fix:**
- Introduce a small cache layer or use a data library (e.g. React Query/TanStack Query) for server state: same key (e.g. `user/:address`) deduplicates and caches, so multiple components can use the same hook without re-fetching.
- Split “user profile” (or similar) into smaller hooks (e.g. `useUserInfo`, `useUserBids`) that use that cache, and keep pages as composition of hooks and UI.

---

## 9. Mixed responsibilities in long pages

**Problem:** The play page and the stake page are very long (hundreds of lines) and mix: contract reads, API fallbacks, form state, approval flows, transaction submission, success/error toasts, and refetch logic. Similar complexity exists in the user stats page.

**Consequences:**
- Hard to reason about and test; a small change can have unintended side effects.
- Transaction and API logic are tied to one component; reusing “place bid” or “claim prize” elsewhere would require copy-paste or big refactors.
- More risk of dependency array mistakes and stale closures in useEffect.

**Design fix:**
- Extract “place ETH bid”, “place CST bid”, “claim main prize”, “approve NFT/ERC20” into small hooks or service functions with clear inputs/outputs and error handling.
- Keep pages focused on layout and wiring; move chain/contract/API logic into hooks or modules that can be unit-tested and reused (e.g. in a future “quick bid” widget).

---

## 10. No shared API/backend contract artifact

**Problem:** The backend (Go) and frontend (TypeScript) do not share a single machine-readable contract (e.g. OpenAPI, or generated types from the same spec). Types and keys are hand-kept and drift (e.g. backend renames a field or adds a new optional).

**Consequences:**
- Every backend change risks breaking the frontend in subtle ways; the only “contract” is the code on both sides.
- The many fallback keys and defensive checks are a symptom of this drift.

**Design fix:**
- Add an API spec (OpenAPI or similar) maintained by the backend or generated from it, and generate TypeScript types (and optionally client) for the frontend. Failing that, maintain a single “API types” file or package that both sides treat as the contract and update it when the API changes.
- In the short term, at least document the exact response shape (and status/error semantics) for the main endpoints used by the frontend.

---

## 11. JavaScript exception and error handling

**Problem:** Exceptions and promise rejections are handled inconsistently. Many errors are effectively **silently dropped** from a developer and testing perspective: they are caught, logged to `console.error`, and then the code continues with fallback state (empty array, default value) without setting an error state, rethrowing, or reporting. There is no global error reporting, and the existing `ErrorBoundary` is not used in the root layout.

**Why this is critical for testing:** If an error is only logged to the console and the UI shows empty or default data, automated tests (unit, integration, E2E) have no way to assert that a failure occurred. Tests will see “empty list” or “loading finished” and pass, while in reality the API or logic failed. Bugs then surface only in production or manual testing.

### 11.1 React Error Boundary not mounted at app root

- **Current state:** An `ErrorBoundary` component exists (`src/components/ErrorBoundary.tsx`) and logs errors in `componentDidCatch` (with a TODO for Sentry). It is **not** used in `src/app/layout.tsx`; the root layout has no error boundary.
- **Consequence:** Any uncaught error during React render (e.g. “cannot read property X of undefined” after a bad API shape) will bubble to the root and crash the whole app (Next.js/React will show its own error overlay in dev, or a blank/broken page in prod). There is no app-level fallback UI or consistent reporting.

**Design fix:** Wrap the app (or at least `<main>{children}</main>`) in `ErrorBoundary` in the root layout so render errors are caught and a fallback is shown. In `componentDidCatch`, call an error-reporting API (e.g. Sentry) so production errors are not only logged to the console.

---

### 11.2 No global handlers for unhandled errors

- **Current state:** There are no `window.onerror` or `window.onunhandledrejection` (or equivalent) handlers in the codebase.
- **Consequence:**
  - **Unhandled promise rejections:** If an `async` function throws or a promise rejects and no `.catch()` or try/catch handles it (e.g. in a fire-and-forget `useEffect` or a callback), the rejection is unhandled. In the browser it may only appear in the console; in Node (e.g. during tests or SSR) it can terminate the process or cause flaky tests. There is no central place to log or report these.
  - **Synchronous errors outside React:** Errors in event handlers or other sync code that are not inside a try/catch or an Error Boundary are never reported to a single place.

**Design fix:** Add a small client-side error-reporting module that:
- Subscribes to `window.onerror` and `window.onunhandledrejection`.
- Logs to console in development and sends to an error-reporting service in production.
- Optionally in tests, exposes or forwards errors so test runners can fail when an unhandled rejection occurs (e.g. via a global promise that tests can await or a flag they can assert on).

---

### 11.3 Errors caught but only logged — no error state for UI or tests

- **Current state:** Across the app, many `catch` blocks follow the same pattern: `console.error("...", error)` and then set fallback state (e.g. `setFeaturedNFTs([])`, `setCurrentBids([])`, `setMainPrizeTime(null)`). They do **not**:
  - set an `error` state that the component could render (e.g. “Failed to load. Retry?”),
  - rethrow,
  - or call a shared reporting function.
- **Examples:** Home page (prize time, NFTs, banned bids, bids, ETH price), play page (used NFTs, last bid message, prize time, refresh after tx), user stats page, gallery, leaderboard, rounds, system events, contracts page, account/statistics, etc.
- **Consequence for users:** The UI shows empty or stale data with no indication that something failed; users may think there are “no bids” or “no NFTs” when the real issue is a network or API error.
- **Consequence for developers and tests:** There is no observable “error” outcome. Integration or E2E tests that stub the API to return 500 or throw will see the same UI as “success with empty data” (e.g. empty table). Tests cannot distinguish “API failed” from “API returned empty list,” so regressions in error paths are hard to detect.

**Design fix:**
- For data-fetching flows, use a pattern that always has an explicit **error** channel (e.g. `{ data, error, isLoading }`). In catch blocks, set `error` (and optionally call a reporter) instead of only logging and setting empty data.
- In tests, assert on that error state when the API or dependency fails (e.g. expect “Failed to load” or `error !== null`). Avoid catch blocks that only log and set fallback state without exposing the error to the component (and thus to tests).

---

### 11.4 Promises that swallow rejections with `.catch(() => [])`

- **Current state:** Some calls explicitly turn any failure into empty data:
  - `api.getEverStakedRWLKTokenIdsByUser(address).catch(() => [])` (stake page, twice),
  - `api.getUnclaimedDonatedNFTsByRound(roundNum).catch(() => [])` (donations page).
- **Consequence:** The caller cannot tell the difference between “API returned an empty list” and “API failed.” Tests and production monitoring cannot detect these failures; the error is intentionally dropped.

**Design fix:** Prefer returning a discriminated result (e.g. `{ ok: true, data }` vs `{ ok: false, error }`) or throwing and handling in a single place that sets error state. If “empty on error” is required for UX, at least log or report the error and, in tests, allow asserting that the failure path was taken (e.g. via a spy on the reporter or on the API stub).

---

### 11.5 API and service layer: mixed handling

- **Current state:**
  - `api.createNFTAssets`: catch returns `-1` and logs; callers get no exception and may not check the return value.
  - `api.getBannedBids`: catch returns `[]` on 400, otherwise rethrows; other API methods do not consistently check `status`/`error` (see §1) and often let axios throw on non-2xx.
  - Axios response interceptor rejects with a custom object; many call sites only catch and log or set local fallback state.
- **Consequence:** Some errors surface as thrown values, others as “special” return values (-1, []); there is no single contract for “this call failed,” so components and tests cannot handle failures in a uniform way.

**Design fix:** Standardize on one strategy: either “throw on failure” with a consistent error type (and document that all API helpers throw), or “return result type” (`{ data?, error? }`) and require callers to check. Then use the same strategy in tests (expect thrown error or expect `result.error`).

---

### 11.6 ErrorBoundary only logs — no production reporting

- **Current state:** In `ErrorBoundary.componentDidCatch`, the code logs to `console.error` and has a TODO for Sentry (or similar). No error-reporting integration is implemented.
- **Consequence:** In production, render errors caught by the boundary are only visible in the user’s console (if they open dev tools). There is no backend or dashboard to see how often and where the app fails.

**Design fix:** Implement the TODO: in `componentDidCatch`, call an error-reporting service (e.g. Sentry) with the error and `errorInfo`. Ensure the same service receives unhandled rejections and global errors (see 11.2) so all failure modes are visible in one place.

---

### Summary: impact on testing and bug detection

| Pattern | Effect | Testing impact |
|--------|--------|-----------------|
| Error Boundary not in layout | Render errors crash app; no app-level fallback | E2E tests may see blank page or React error overlay instead of controlled fallback |
| No global `onerror` / `unhandledrejection` | Unhandled promise rejections only in console | Tests may pass while rejections occur; flaky or silent failures |
| Catch → only `console.error` + fallback state | No error state in UI; same UI as “empty success” | Tests cannot assert “error occurred”; failures indistinguishable from empty data |
| `.catch(() => [])` | Failure replaced by empty array | Tests and monitoring cannot detect API/dependency failure |
| No central reporting | Errors only in console or local state | No way to evaluate “are all errors caught?” or to count failure rates in production |

**Design fix (concise):**
- Mount `ErrorBoundary` at the app root and report from `componentDidCatch`.
- Add global `window.onerror` and `window.onunhandledrejection` and report (and optionally expose in tests).
- For data-fetching: always expose an **error** channel (state or return value) and set it in catch blocks; avoid “log + fallback only.”
- Replace “swallow with `.catch(() => [])`” with explicit error handling or at least logging/reporting plus a way for tests to assert on the failure path.
- Standardize API/service layer on “throw” or “result type” and use one error-reporting path so developers can evaluate whether all JavaScript errors are caught and none are silently dropped.

---

## Summary table

| # | Design issue | Main consequence |
|---|----------------|-------------------|
| 1 | No `status`/`error` handling | Soft API errors ignored; wrong or null data in UI |
| 2 | Multiple fallback keys per concept | Silent contract drift; no single source of truth |
| 3 | No runtime validation | Backend changes cause runtime errors or wrong display |
| 4 | Split/duplicated types | Inconsistent shapes; refactors and reuse are hard |
| 5 | API base URL / chain lifecycle | Wrong backend or chain; race on first load |
| 6 | Dashboard shape assumed in context | Fragile dashboard-dependent screens; duplicated parsing |
| 7 | Scattered loading/error handling | Inconsistent UX and repeated boilerplate |
| 8 | Per-page fetching, no cache | Duplicate requests; heavy, hard-to-maintain pages |
| 9 | Long, mixed-responsibility pages | Hard to test and reuse; easy to introduce bugs |
| 10 | No shared API contract | Drift between backend and frontend; defensive code everywhere |
| **11** | **JS errors caught but not exposed; no global reporting** | **Errors silently dropped; tests cannot detect failures; production failures invisible** |

Addressing these at the design level (single response contract, validation at the boundary, shared types and transforms, chain-aware API, clearer separation of data vs UI, and **consistent error handling with an explicit error channel and global reporting**) will reduce operational errors, make the codebase easier to change and debug, and allow tests to reliably detect and assert on error conditions.
