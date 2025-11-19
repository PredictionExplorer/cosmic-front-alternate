# Timestamp Handling Fix

## Problem

The application was throwing `RangeError: Invalid time value` errors when trying to convert timestamps from the API response to dates. This was caused by:

1. **Incorrect data structure assumptions**: The code assumed `TimeStamp` was at the root level of NFT objects, but it's actually nested inside a `Tx` object
2. **Lack of validation**: No checks for null, undefined, or invalid timestamp values
3. **Inconsistent API responses**: Different API endpoints return timestamps in different structures:
   - NFT data: `Tx.TimeStamp` (nested)
   - Donated NFT data: `TimeStamp` (root level)
   - Round data: `TimeStamp` (root level)

## Solution

### 1. Created Safe Timestamp Utilities (`src/lib/utils.ts`)

Added two helper functions that handle all timestamp conversion cases:

```typescript
// Extracts timestamp from any API response structure
export function safeTimestamp(data: unknown): string

// Formats timestamp for display
export function formatTimestamp(data: unknown): string
```

These functions:
- Handle both nested (`Tx.TimeStamp`) and root-level (`TimeStamp`) structures
- Validate timestamp values (not null, not NaN, > 0)
- Fall back to `DateTime` field if available
- Return current date as last resort (prevents crashes)
- Log warnings for debugging

### 2. Updated All Files with Timestamp Usage

Fixed 9 files that were accessing timestamps unsafely:

#### Core Pages
- ✅ `src/app/gallery/page.tsx` - Gallery NFT list
- ✅ `src/app/account/nfts/page.tsx` - User's NFT collection
- ✅ `src/app/page.tsx` - Homepage featured NFTs

#### User/Account Pages
- ✅ `src/app/user/[address]/page.tsx` - User profile donated NFTs
- ✅ `src/app/account/statistics/page.tsx` - Account statistics NFTs
- ✅ `src/app/account/winnings/page.tsx` - User winnings NFTs

#### Game History
- ✅ `src/app/game/history/rounds/[id]/page.tsx` - Round detail page
- ✅ `src/app/game/history/rounds/page.tsx` - Rounds list page

### 3. Updated Interface Definitions

Fixed the `NFTData` interface in `src/app/account/nfts/page.tsx` to match the actual API response structure:

```typescript
interface NFTData {
  TokenId: number;
  Seed: string;
  Tx?: {                    // Nested transaction data
    TimeStamp?: number;
    DateTime?: string;
    TxHash?: string;
    BlockNum?: number;
  };
  TokenName?: string;
  RoundNum: number;
  Staked: boolean;
  WasUnstaked: boolean;
}
```

## API Response Structure

### NFT Data (from `api.getCSTList()`, `api.getCSTTokensByUser()`)

```json
{
  "TokenId": 111,
  "Seed": "feb78ef6...",
  "Tx": {
    "TimeStamp": 1735909331,    // Unix timestamp in seconds
    "DateTime": "2025-01-03T13:02:11Z",
    "TxHash": "0xbb8c8e...",
    "BlockNum": 512
  },
  "TokenName": "",
  "RoundNum": 8,
  "CurOwnerAddr": "0x90F79bf6..."
}
```

### Donated NFT Data (from `api.getUnclaimedDonatedNFTsByUser()`)

```json
{
  "Index": 0,
  "TokenId": 123,
  "TimeStamp": 1735909331,     // At root level
  "RoundNum": 5,
  "NftAddr": "0x...",
  "Claimed": false
}
```

## Usage Examples

### Before (Unsafe)
```typescript
// ❌ Crashes if TimeStamp is undefined or invalid
mintedAt: new Date(nft.TimeStamp * 1000).toISOString()

// ❌ Wrong structure - TimeStamp is nested
{new Date(nft.TimeStamp * 1000).toLocaleDateString()}
```

### After (Safe)
```typescript
// ✅ Handles all cases safely
mintedAt: safeTimestamp(nft)

// ✅ Formatted for display
{formatTimestamp(nft)}
```

## Testing

To verify the fix:

1. **Gallery Page**: Navigate to `/gallery` - should load NFTs without errors
2. **Account NFTs**: Connect wallet and go to `/account/nfts` - should display your NFTs
3. **Round History**: Visit `/game/history/rounds` - should show round dates correctly
4. **User Profile**: Visit `/user/[address]` - should display donated NFT dates

## Benefits

1. **Crash Prevention**: No more `Invalid time value` errors
2. **Flexibility**: Handles multiple API response formats
3. **Debugging**: Logs warnings when timestamps are invalid
4. **Maintainability**: Single source of truth for timestamp conversion
5. **Graceful Degradation**: Falls back to current date instead of crashing

## Related Changes

This fix complements the recent network switching updates:
- Works correctly with both Sepolia (port 8383) and local testnet (port 7070)
- API responses may vary slightly between networks
- The safe timestamp functions handle any format consistently

