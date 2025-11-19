# RandomWalk NFT List Refresh Update

## Overview

Updated the game play page to automatically refresh the RandomWalk NFT list after successful bids that involve:
1. **RandomWalk NFT usage** - When a user places a bid with a RandomWalk NFT for the 50% discount
2. **NFT donations** - When a user donates an NFT along with their bid

## Problem

Previously, the used NFT list was only refreshed when a RandomWalk NFT was used for bidding. It didn't refresh when NFTs were donated, and the donation fields weren't cleared after successful bids.

## Solution

### Changes Made

#### 1. Added State Tracking (`src/app/game/play/page.tsx`)

Added a new state variable to track when NFTs should be refreshed:

```typescript
const [shouldRefreshNfts, setShouldRefreshNfts] = useState(false);
```

#### 2. Updated ETH Bid Handler

Modified `handleEthBid()` to set the refresh flag when:
- A RandomWalk NFT is used, OR
- An NFT is donated

```typescript
// Track if we need to refresh NFTs (RandomWalk used or NFT donated)
const needsNftRefresh = useRandomWalkNft || (donationType === "nft" && !!donationNftAddress && !!donationNftTokenId);
setShouldRefreshNfts(needsNftRefresh);
```

#### 3. Updated CST Bid Handler

Modified `handleCstBid()` to set the refresh flag when:
- An NFT is donated (CST bids don't use RandomWalk NFTs)

```typescript
// Track if we need to refresh NFTs (NFT donated)
// Note: CST bids don't use RandomWalk NFTs, but can donate NFTs
const needsNftRefresh = donationType === "nft" && !!donationNftAddress && !!donationNftTokenId;
setShouldRefreshNfts(needsNftRefresh);
```

#### 4. Enhanced Transaction Success Handler

Updated the transaction success `useEffect` to:
- Clear donation fields after successful bids
- **Refetch the user's wallet to get updated NFT ownership** (critical for donations)
- Refresh the used NFTs list based on the `shouldRefreshNfts` flag
- Reset the NFT selection if a RandomWalk NFT was used
- Reset the refresh flag after completion

```typescript
// Clear donation fields after successful bid
setDonationNftAddress("");
setDonationNftTokenId("");
setDonationTokenAddress("");
setDonationTokenAmount("");

// Refresh used NFTs list if RandomWalk NFT was used or NFT was donated
if (shouldRefreshNfts) {
  // Refetch the user's wallet to get updated NFT list
  // This is important when NFTs are donated (they leave the wallet)
  await refetchWalletNfts();
  
  // Also fetch the used NFTs list from the API
  // This tracks which RandomWalk NFTs were used for bidding discount
  // Fetch and update used NFTs list
  // Clear RandomWalk NFT selection if it was used
  // Reset the refresh flag
}
```

#### 5. Added Wallet Refetch

Added `refetch: refetchWalletNfts` to the `useWalletOfOwner` hook:

```typescript
const { data: userNfts, refetch: refetchWalletNfts } = readRandomWalk.useWalletOfOwner(address);
```

This allows us to refresh the user's NFT list after donations, ensuring donated NFTs are immediately removed from the available list.

#### 6. Updated Dependency Array

Added both `shouldRefreshNfts` and `refetchWalletNfts` to the useEffect dependency array to ensure the handler responds to all necessary changes.

## Benefits

### 1. **Accurate NFT List**
The RandomWalk NFT list now accurately reflects which NFTs have been used after ANY transaction that involves NFTs.

### 2. **Better UX**
- Donation fields are automatically cleared after successful bids
- RandomWalk NFT selection is cleared after use
- Users don't see "used" NFTs still available in the dropdown
- **NFTs are sorted by token ID in ascending order for easy navigation**

### 3. **Consistent Behavior**
Both ETH and CST bids now consistently refresh the NFT list when applicable.

### 4. **Donation Support**
The list refreshes regardless of whether the NFT was used for:
- Bidding discount (RandomWalk NFT)
- Donation to the raffle pool

### 5. **Organized Display**
NFTs are sorted numerically by token ID (e.g., #1, #2, #3...) making it easier to:
- Find specific NFTs quickly
- See the natural progression of owned NFTs
- Maintain consistent ordering across refreshes

## Testing

### Test Scenarios

1. **Bid with RandomWalk NFT (ETH)**
   - Select a RandomWalk NFT
   - Place an ETH bid
   - Verify: NFT list refreshes, used NFT is no longer selectable

2. **Bid with NFT Donation (ETH)**
   - Enter donation NFT details
   - Place an ETH bid
   - Verify: NFT list refreshes, donation fields are cleared

3. **Bid with RandomWalk NFT + NFT Donation (ETH)**
   - Select RandomWalk NFT AND enter donation details
   - Place an ETH bid
   - Verify: Both NFT list refreshes and donation fields clear

4. **Bid with NFT Donation (CST)**
   - Enter donation NFT details
   - Place a CST bid
   - Verify: NFT list refreshes, donation fields are cleared

5. **Regular Bid (No NFTs)**
   - Place a regular bid without NFTs
   - Verify: NFT list does NOT refresh (no unnecessary API calls)

## Technical Details

### API Call
Uses `api.getUsedRWLKNfts()` to fetch the updated list of used RandomWalk NFTs from the backend.

### Timing
The refresh happens 2 seconds after transaction success, giving the backend time to process the transaction.

### Sorting Implementation
```typescript
const availableNfts = ownedNfts
  .filter((nftId) => {
    const nftIdNumber = Number(nftId);
    const isUsed = usedNfts.includes(nftIdNumber);
    return !isUsed;
  })
  .sort((a, b) => Number(a) - Number(b)); // Sort in ascending order by token ID
```

- Filters out used NFTs first
- Then sorts remaining NFTs by token ID in ascending order
- Converts BigInt to Number for proper numerical comparison
- Returns a consistently ordered list

### Error Handling
Includes try-catch blocks to handle API errors gracefully without breaking the user experience.

## Files Modified

- `src/app/game/play/page.tsx`
  - Added `shouldRefreshNfts` state variable
  - Updated `handleEthBid()` function
  - Updated `handleCstBid()` function
  - Enhanced transaction success handler
  - Updated useEffect dependency array
  - **Sorted RandomWalk NFT list by token ID (ascending order)**

## Related Features

- RandomWalk NFT bidding discount (50% off ETH bids)
- NFT donation system for raffle pool
- Used NFT tracking and validation

## Issue Fixed

### Problem: NFT List Not Updating After Donation

**Symptom**: After bidding with NFT donation, the RandomWalk NFT list didn't update to remove donated NFTs.

**Root Cause**: The code was only updating the "used NFTs" list (which tracks NFTs used for bidding discount), but wasn't refetching the user's wallet to see which NFTs they still own.

**Solution**: Added `refetchWalletNfts()` call in the transaction success handler. This:
1. Refetches the user's wallet NFT list from the blockchain
2. Removes donated NFTs from the available list immediately
3. Updates both the owned NFTs and used NFTs tracking

**Result**: Donated NFTs now disappear from the list immediately after successful transaction confirmation.

---

**Status**: ✅ Complete
**Linter Errors**: 0
**Ready for Testing**: Yes

