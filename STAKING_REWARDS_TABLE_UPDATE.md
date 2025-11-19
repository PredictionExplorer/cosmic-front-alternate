# CST Staking Rewards Table Update

## Overview

Updated the Claimable CST Staking Rewards table on the Winnings page to match the old project's design and implemented full claim functionality directly from the page.

## Changes Made

### 1. Updated Interface to Match API Response

**Old Interface** (incorrect):
```typescript
interface StakingReward {
  ActionId: number;
  TokenId: number;
  RoundNum: number;
  RewardAmountEth: number;
  TimeStamp: number;
}
```

**New Interface** (matches API):
```typescript
interface StakingReward {
  RecordId: number;
  Tx?: {
    TimeStamp?: number;
    DateTime?: string;
    TxHash?: string;
  };
  DepositId: number;
  DepositTimeStamp: number;
  DepositDate: string;
  NumStakedNFTs: number;           // Total NFTs in pool
  DepositAmountEth: number;        // Total ETH deposited
  YourTokensStaked: number;        // Your NFTs in this deposit
  YourRewardAmountEth: number;     // Your total reward
  PendingToClaimEth: number;       // Amount pending to claim
  NumUnclaimedTokens: number;      // Tokens not yet claimed
  AmountPerTokenEth: number;       // Reward per NFT
  // ... other fields
}
```

### 2. Enhanced Table Structure

**New Columns**:
1. **Deposit ID** - Unique identifier for each deposit
2. **Date** - When the deposit was made
3. **Your NFTs** - Number of your NFTs in this deposit (badge)
4. **Total NFTs** - Total NFTs staked in this deposit pool
5. **Total Deposit** - Total ETH deposited in this pool
6. **Per NFT** - Reward amount per NFT
7. **Your Reward** - Your pending reward (highlighted in green)
8. **Action** - Unstake & Claim button

This provides complete transparency about:
- Your stake distribution across deposits
- How rewards are calculated (per NFT basis)
- Total pool size and your share

### 3. Implemented Claim Functionality

#### Added Hooks and State
```typescript
import { useStakingWalletCST } from "@/hooks/useStakingWallet";
import { useNotification } from "@/contexts/NotificationContext";

const stakingWallet = useStakingWalletCST();
const { showSuccess, showError, showInfo } = useNotification();

const [claiming, setClaiming] = useState({
  // ... other states
  staking: null as number | null,  // Track which deposit is being claimed
});
```

#### Single Deposit Claim
```typescript
const handleUnstakeSingle = async (depositId: number) => {
  setClaiming((prev) => ({ ...prev, staking: depositId }));
  showInfo("Unstaking NFTs and claiming rewards...");
  
  await stakingWallet.write.unstake(BigInt(depositId));
  
  showSuccess("NFTs unstaked and rewards claimed successfully!");
  refreshData();
}
```

Features:
- Unstakes all NFTs in the deposit
- Automatically claims all pending rewards
- Shows loading state on the specific row
- Displays success/error notifications
- Refreshes data after transaction

#### Claim All Deposits
```typescript
const handleClaimAllStaking = async () => {
  const depositIds = stakingRewards.map((reward) => BigInt(reward.DepositId));
  await stakingWallet.write.unstakeMany(depositIds);
  
  showSuccess(`Successfully unstaked ${stakingRewards.length} deposit(s)!`);
  refreshData();
}
```

Features:
- Unstakes ALL deposits in one transaction
- Claims all rewards at once
- Gas-efficient batch operation
- Shows total count in success message

### 4. Enhanced Summary Section

**New Layout** - 4-column grid showing:

1. **Total Deposits** - Number of staking deposits
2. **Your NFTs Staked** - Total count of your staked NFTs
3. **Unclaimed Tokens** - NFTs that still have rewards to claim
4. **Total Rewards** - Sum of all pending rewards

Plus a prominent "Claim All Rewards" button at the bottom.

### 5. Updated UI/UX

#### Header
- Added "Claim All" button in the section header
- Shows loading state and count
- Disabled during transactions

#### Table Rows
- **Unstake & Claim** button (was a link to /stake)
- Primary variant for better visibility
- Shows loading spinner when processing
- Individual row disabled during claim
- All buttons disabled when any transaction is pending

#### Info Alert
- Updated message to explain the new claim functionality
- No longer directs users to separate staking page
- Explains both single and batch claim options

#### Summary Stats
- 4-column responsive grid
- Shows comprehensive deposit information
- Large, prominent total rewards display
- Claim All button with icon

## User Experience

### Before
- Users had to navigate to `/stake` page to claim rewards
- No direct claim functionality on winnings page
- Limited information about deposits
- Simple 3-column table

### After
- ✅ Claim rewards directly from winnings page
- ✅ Claim individual deposits or all at once
- ✅ Comprehensive deposit information
- ✅ 8-column detailed table
- ✅ Real-time loading states
- ✅ Success/error notifications
- ✅ Automatic data refresh after claims
- ✅ Summary statistics

## Technical Details

### Smart Contract Integration

Uses `useStakingWalletCST` hook which provides:
- `unstake(depositId)` - Unstake single deposit and claim rewards
- `unstakeMany(depositIds[])` - Batch unstake multiple deposits

### Transaction Flow

1. User clicks "Unstake & Claim" or "Claim All"
2. Transaction submitted to blockchain
3. Loading state displayed
4. On success:
   - NFTs returned to user's wallet
   - Rewards transferred to user's wallet
   - Success notification shown
   - Data refreshed after 3 seconds
5. On error:
   - Error notification shown
   - State reset

### Data Refresh

After successful claim:
- Waits 3 seconds for blockchain confirmation
- Refetches all winnings data
- Updates all tables and totals
- Removes claimed deposits from list

## Testing Checklist

- [ ] Table displays all deposit information correctly
- [ ] "Unstake & Claim" button works for individual deposits
- [ ] "Claim All" button in header works
- [ ] "Claim All Rewards" button in summary works
- [ ] Loading states show during transactions
- [ ] Success notifications appear after claims
- [ ] Data refreshes after successful claims
- [ ] Pagination works correctly
- [ ] Summary stats calculate correctly
- [ ] All buttons disabled during pending transactions

## Files Modified

- `src/app/account/winnings/page.tsx`
  - Updated `StakingReward` interface (20+ fields)
  - Added staking wallet hook integration
  - Added notification hook
  - Implemented `handleUnstakeSingle()` function
  - Implemented `handleClaimAllStaking()` function
  - Enhanced table with 8 columns
  - Added "Claim All" button in header
  - Updated summary section with 4-column stats
  - Updated info alert message
  - Updated reward calculation to use `PendingToClaimEth`

## Benefits

1. **Convenience** - Claim rewards without leaving the winnings page
2. **Efficiency** - Batch claim all rewards in one transaction
3. **Transparency** - See complete deposit breakdown and calculations
4. **Better UX** - Clear loading states and success notifications
5. **Comprehensive** - Full statistics and summary information

---

**Status**: ✅ Complete
**Linter Errors**: 0
**Ready for Testing**: Yes

