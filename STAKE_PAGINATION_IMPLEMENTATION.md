# Stake Page Complete Implementation

## Overview
Successfully implemented full staking functionality including:
- Real-time data fetching from API
- Pagination for available NFTs list (8 per page)
- Single NFT staking
- **Multi-NFT staking** (stake multiple NFTs at once)
- NFT selection with checkboxes
- Select all / deselect all functionality
- NFT approval and staking actions
- Transaction status tracking
- Success/error notifications
- Automatic list refresh after staking

## Implementation Details

### 1. **Staking Functionality**

#### Contract Hooks
```typescript
const nftContract = useCosmicSignatureNFT();
const stakingContract = useStakingWalletCST();
```

#### Approval Check
```typescript
const { data: isApprovedForAll } = address
  ? nftContract.read.useIsApprovedForAll(
      address as `0x${string}`,
      CONTRACTS.STAKING_WALLET_CST
    )
  : { data: false };
```

#### Staking Flow
1. **Check Approval**: Verify if staking contract is approved
2. **Request Approval**: If not approved, request approval first
3. **Stake NFT**: Once approved, stake the NFT
4. **Monitor Transaction**: useEffect watches `stakingContract.status.isSuccess`
5. **Auto-Refresh**: When transaction confirms, automatically refresh data
6. **Show Success**: Display success notification with staking details
7. **Clean Up**: Clear selections and reset staking states

#### Key Functions
- `handleApprove()`: Requests approval for staking contract
- `handleStake(tokenId)`: Stakes a single NFT (no manual refresh needed)
- `handleStakeMany(tokenIds[])`: Stakes multiple NFTs at once (no manual refresh needed)
- `refreshTokenData()`: Fetches updated token data from API and clears selections
- `toggleTokenSelection(tokenId)`: Adds/removes NFT from selection
- `selectAllTokens()`: Selects all available NFTs
- `deselectAllTokens()`: Clears all selections

#### Automatic List Refresh
The list automatically updates after transaction completion using a `useEffect` hook:

```typescript
useEffect(() => {
  if (stakingContract.status.isSuccess && address) {
    // Transaction completed successfully
    const timer = setTimeout(async () => {
      await refreshTokenData();
      
      // Show success message
      if (isStakingMultiple && selectedTokenIds.size > 0) {
        showSuccess(`Successfully staked ${selectedTokenIds.size} NFT(s)!`);
      } else if (stakingTokenId) {
        showSuccess(`Successfully staked token #${stakingTokenId}!`);
      }
      
      // Clear staking states
      setStakingTokenId(null);
      setIsStakingMultiple(false);
    }, 2000); // Small delay to allow blockchain state to update

    return () => clearTimeout(timer);
  }
}, [stakingContract.status.isSuccess, address, ...]);
```

**Benefits:**
- ✅ No manual setTimeout management in staking functions
- ✅ Centralized refresh logic
- ✅ Works for both single and multi-stake
- ✅ Proper cleanup on unmount
- ✅ Watches actual transaction status from wagmi

### 2. **Multi-Stake Functionality**

#### Selection State
```typescript
const [selectedTokenIds, setSelectedTokenIds] = useState<Set<number>>(new Set());
const [isStakingMultiple, setIsStakingMultiple] = useState(false);
```

#### Selection UI
- **Checkbox on each NFT card**: Click to select/deselect
- **Visual feedback**: Selected NFTs show a primary ring border
- **Select All button**: Selects all available NFTs (not just current page)
- **Deselect All button**: Clears all selections
- **Selection counter**: Shows how many NFTs are selected

#### Batch Staking Process
1. User selects multiple NFTs via checkboxes
2. Click "Stake Selected (X)" button
3. System checks approval (requests if needed)
4. Calls `stakingContract.write.stakeMany(tokenIdsBigInt)`
5. Shows transaction confirmation
6. Refreshes data and clears selections
7. Updates available NFT list automatically

#### Features
- Select NFTs across multiple pages
- Visual selection count in header
- Disabled state during transactions
- Automatic deselection after successful staking
- Error handling for batch operations

### 3. **Pagination**

#### State Management
```typescript
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 8; // Show 8 NFTs per page (2 rows of 4)
```

#### Pagination Logic
```typescript
// Calculate pagination
const totalPages = Math.ceil(availableTokens.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedTokens = availableTokens.slice(startIndex, endIndex);
```

### 3. **Page Navigation**
```typescript
const handlePageChange = (page: number) => {
  setCurrentPage(page);
  // Scroll to the NFT section
  const nftSection = document.getElementById("available-nfts-section");
  if (nftSection) {
    nftSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
```

### 4. **Auto-Reset**
- Page resets to 1 when wallet disconnects
- Page resets to 1 when new data is fetched
- Ensures users always start on a valid page

## UI Components

### 1. **Item Counter**
Shows the current range of items being displayed:
```
Showing 1-8 of 24
```

### 2. **Pagination Controls**
- **Previous Button**: Navigate to previous page (disabled on page 1)
- **Page Numbers**: Direct navigation to specific pages
- **Next Button**: Navigate to next page (disabled on last page)

### 3. **Smart Page Number Display**
The pagination displays:
- First page (1)
- Last page
- Current page
- One page before and after current page
- Ellipsis (...) for gaps

**Examples:**
- Page 1 of 10: `1 2 3 ... 10`
- Page 5 of 10: `1 ... 4 5 6 ... 10`
- Page 10 of 10: `1 ... 8 9 10`

### 4. **Smooth Scrolling**
When changing pages, the view automatically scrolls back to the top of the NFT section with smooth animation.

## Features

✅ **8 NFTs per page** - Displays 2 rows of 4 NFTs each
✅ **Smart pagination** - Shows relevant page numbers with ellipsis
✅ **Disabled states** - Previous/Next buttons disabled at boundaries
✅ **Active page highlight** - Current page button uses primary variant
✅ **Item counter** - Shows current range (e.g., "Showing 1-8 of 24")
✅ **Smooth scrolling** - Auto-scrolls to top of section on page change
✅ **Auto-reset** - Resets to page 1 when data changes
✅ **Conditional rendering** - Only shows pagination when more than 1 page
✅ **Responsive** - Works on all screen sizes

## Usage Example

### When User Has 24 Available NFTs:
- **Total Pages**: 3 (24 ÷ 8)
- **Page 1**: Shows NFTs 1-8
- **Page 2**: Shows NFTs 9-16
- **Page 3**: Shows NFTs 17-24

### Pagination Controls:
```
[← Previous]  [1] [2] [3]  [Next →]
```

### When User Has 50+ NFTs:
```
[← Previous]  [1] ... [4] [5] [6] ... [10]  [Next →]
                      (current: 5)
```

## Code Location

**File**: `src/app/stake/page.tsx`

### Key Sections:
1. **Lines 42-43**: Pagination state
2. **Lines 82-95**: Pagination calculation logic
3. **Lines 294-295**: Item counter display
4. **Lines 310-342**: Paginated NFT grid
5. **Lines 345-405**: Pagination controls

## Benefits

1. **Better Performance**: Only renders 8 NFTs at a time instead of all
2. **Improved UX**: Easier to browse large NFT collections
3. **Cleaner UI**: Prevents overwhelming users with too many items
4. **Faster Load**: Reduces initial render time for large collections
5. **Accessible**: Clear navigation with disabled states

## Edge Cases Handled

✅ Empty collection (no pagination shown)
✅ Less than 8 NFTs (no pagination shown)
✅ Exactly 8 NFTs (no pagination shown)
✅ More than 8 NFTs (pagination shown)
✅ Loading state (pagination hidden during load)
✅ Wallet disconnect (resets to page 1)
✅ Data refresh (resets to page 1)

## Future Enhancements

Potential improvements:
- [ ] Add items-per-page selector (8, 16, 24, All)
- [ ] Add keyboard navigation (arrow keys, page up/down)
- [ ] Add URL query parameters for deep linking
- [ ] Add animation when changing pages
- [ ] Add "Jump to page" input field
- [ ] Persist current page in localStorage
- [ ] Add "Back to top" button on mobile

## Testing Checklist

- [x] Pagination appears when more than 8 NFTs
- [x] Previous button disabled on page 1
- [x] Next button disabled on last page
- [x] Page numbers are clickable
- [x] Current page is highlighted
- [x] Scrolls to top on page change
- [x] Item counter shows correct range
- [x] Resets to page 1 on data change
- [x] Works with varying NFT counts
- [x] No linting errors

