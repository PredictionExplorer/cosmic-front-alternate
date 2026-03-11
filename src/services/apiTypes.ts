/**
 * Canonical API DTO types.
 *
 * Every type here matches what the backend actually returns.
 * Pages and components should import from this file instead of
 * defining local duplicates. For UI-friendly shapes, see the
 * transform layer in {@link ../lib/apiTransforms.ts}.
 */

// ── Shared nested structures ────────────────────────────────────────────

export interface ApiTxEnvelope {
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
}

// ── Bids ────────────────────────────────────────────────────────────────

export interface ApiBidResponse {
  Tx?: Partial<ApiTxEnvelope>;
  BidderAddr?: string;
  BidderAid?: number;
  RoundNum?: number;
  BidType?: number;
  BidPosition?: number;
  EthPrice?: string;
  EthPriceEth?: number;
  CstPrice?: string;
  CstPriceEth?: number;
  RWalkNFTId?: number;
  CSTReward?: string;
  CSTRewardEth?: number;
  Message?: string;
  PrizeTime?: number;
  PrizeTimeDate?: string;
  TimeUntilPrize?: number;
  NFTDonationTokenId?: number;
  NFTDonationTokenAddr?: string;
  NFTTokenURI?: string;
  ImageURL?: string;
  DonatedERC20TokenAddr?: string;
  DonatedERC20TokenAmount?: string;
  DonatedERC20TokenAmountEth?: number;
  NumCSTTokensEth?: number;
  [key: string]: unknown;
}

// ── Dashboard ───────────────────────────────────────────────────────────

export interface ApiCurRoundStats {
  RoundNum: number;
  TotalBids: number;
  TotalDonatedNFTs: number;
  NumERC20Donations: number;
  TotalRaffleEthDeposits: string;
  TotalRaffleEthDepositsEth: number;
  TotalRaffleNFTs: number;
  TotalDonatedCount: number;
  TotalDonatedAmount: string;
  TotalDonatedAmountEth: number;
  ActivationTime: number | string;
  ParamWindowStartTime: string;
  ParamWindowDurationSeconds: number;
  RoundStartTime: string;
  RoundEndTime: string;
  RoundDurationSeconds: number;
}

export interface ApiDashboardData {
  CurRoundNum: number;
  LastBidderAddr: string;
  BidPriceEth: number;
  BidPrice: string;
  PrizeAmountEth: number;
  CosmicGameBalanceEth: number;
  CurNumBids: number;
  MainStats: Record<string, unknown>;
  CurRoundStats: ApiCurRoundStats;
  PrizePercentage: number;
  ChronoWarriorPercentage: number;
  RafflePercentage: number;
  StakingPercentage: number;
  CharityPercentage: number;
  NumRaffleEthWinnersBidding: number;
  NumRaffleNFTWinnersBidding: number;
  NumRaffleNFTWinnersStakingRWalk: number;
  RaffleAmountEth: number;
  InitialSecondsUntilPrize: number;
  TimeoutClaimPrize: number;
  TsRoundStart?: number;
  [key: string]: unknown;
}

// ── NFTs / Tokens ───────────────────────────────────────────────────────

export interface ApiCSTToken {
  RecordId: number;
  Tx: ApiTxEnvelope;
  ContractAddr: string;
  TokenId: number;
  WinnerAid: number;
  WinnerAddr: string;
  CurOwnerAid: number;
  CurOwnerAddr: string;
  Seed: string;
  RoundNum: number;
  RecordType: number;
  TokenName: string;
  Staked: boolean;
  StakedOwnerAid: number;
  StakedOwnerAddr: string;
  StakeActionId: number;
  StakeTimeStamp: number;
  StakeDateTime: string;
  UnstakeActionId: number;
  WasUnstaked: boolean;
  ActualUnstakeTimeStamp: number;
  ActualUnstakeDateTime: string;
}

export interface ApiStakedCSTToken {
  TokenInfo: ApiCSTToken;
  StakeEvtLogId: number;
  StakeBlockNum: number;
  StakeActionId: number;
  StakeTimeStamp: number;
  StakeDateTime: string;
  UserAddr: string;
  UserAid: number;
}

export interface ApiRWLKToken {
  TokenId: number;
  TokenName?: string;
  IsUsed: boolean;
  IsStaked: boolean;
  StakeActionId?: number;
}

export interface ApiStakedRWLKToken {
  TokenId: number;
  TokenName?: string;
  StakeActionId: number;
  StakeTimeStamp: number;
  StakeDateTime: string;
  UserAddr: string;
  UserAid: number;
}

// ── Staking ─────────────────────────────────────────────────────────────

export interface ApiStakingAction {
  ActionType: number;
  RecordId: number;
  Tx: ApiTxEnvelope;
  UnstakeDate: string;
  UnstakeTimeStamp: number;
  ActionId: number;
  TokenId: number;
  NumStakedNFTs: number;
  Modulo: string;
  ModuloF64: number;
  Claimed: boolean;
}

export interface ApiStakingReward {
  TokenId: number;
  RewardCollectedEth?: number;
  RewardToCollectEth?: number;
  TotalReward?: number;
  UserAid?: number;
  UserAddr?: string;
}

export interface ApiCollectedStakingReward {
  RecordId: number;
  Tx: ApiTxEnvelope;
  DepositId: number;
  RoundNum: number;
  NumStakedNFTs: number;
  TotalDepositAmountEth: number;
  YourTokensStaked: number;
  YourAmountToClaimEth: number;
  DepositAmountPerTokenEth: number;
  NumTokensCollected: number;
  YourCollectedAmountEth: number;
  DepositTimeStamp: number;
  DepositDate: string;
  FullyClaimed: boolean;
}

export interface ApiRWLKMint {
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
}

// ── Prizes / Claims ─────────────────────────────────────────────────────

export interface ApiClaimHistory {
  EvtLogId: number;
  TimeStamp: number;
  RoundNum: number;
  Description: string;
  PrizeAmount: number;
}

export interface ApiMarketingReward {
  EvtLogId: number;
  TimeStamp: number;
  RoundNum: number;
  AmountEth: number;
}

// ── Donations ───────────────────────────────────────────────────────────

export interface ApiDonatedNFT {
  RecordId: number;
  Tx: ApiTxEnvelope;
  Index: number;
  TokenAddr: string;
  NFTTokenId: number;
  NFTTokenURI: string;
  RoundNum: number;
  DonorAid: number;
  DonorAddr: string;
  TokenAddressId?: number;
  WinnerIndex?: number;
  WinnerAid?: number;
  WinnerAddr?: string;
  NftAddr?: string;
  TokenId?: number;
  TimeStamp?: number;
  Claimed?: boolean;
}

export interface ApiDonatedERC20 {
  RecordId: number;
  Tx: ApiTxEnvelope;
  RoundNum: number;
  TokenAid: number;
  TokenAddr: string;
  AmountDonated: string;
  AmountDonatedEth: number;
  AmountClaimed: string;
  AmountClaimedEth: number;
  DonateClaimDiff: string;
  DonateClaimDiffEth: number;
  WinnerAid: number;
  WinnerAddr: string;
  Claimed: boolean;
}

// ── User ────────────────────────────────────────────────────────────────

export interface ApiUserInfo {
  AddressId?: number;
  Address: string;
  NumBids: number;
  CosmicSignatureNumTransfers: number;
  CosmicTokenNumTransfers?: number;
  MaxBidAmount: number;
  NumPrizes: number;
  MaxWinAmount: number;
  SumRaffleEthWinnings: number;
  SumRaffleEthWithdrawal: number;
  UnclaimedNFTs: number;
  NumRaffleEthWinnings: number;
  RaffleNFTsCount: number;
  RewardNFTsCount: number;
  TotalCSTokensWon: number;
  TotalDonatedCount?: number;
  TotalDonatedAmountEth?: number;
  StakingStatisticsRWalk?: {
    NumActiveStakers: number;
    TotalNumStakeActions: number;
    TotalNumUnstakeActions: number;
    TotalTokensMinted: number;
    TotalTokensStaked: number;
  };
}

// ── Rounds ──────────────────────────────────────────────────────────────

export interface ApiRoundInfo {
  RoundNum: number;
  TsRoundStart?: number;
  TotalBids?: number;
  PrizeAmountEth?: number;
  WinnerAddr?: string;
  [key: string]: unknown;
}

// ── Raffle ───────────────────────────────────────────────────────────────

export interface ApiRaffleDepositResponse {
  RecordId?: number;
  Tx?: Partial<ApiTxEnvelope>;
  RecordType?: number;
  WinnerAddr?: string;
  WinnerAid?: number;
  WinnerIndex?: number;
  RoundNum?: number;
  Amount?: number;
  Claimed?: boolean;
  ClaimTimeStamp?: number;
  ClaimDateTime?: string;
}

// ── ETH Donations ───────────────────────────────────────────────────────

export interface ApiETHDonation {
  RecordId?: number;
  Tx?: Partial<ApiTxEnvelope>;
  RoundNum: number;
  DonorAid?: number;
  DonorAddr: string;
  Amount?: string;
  AmountEth?: number;
  InfoJSON?: string;
  HasInfo?: boolean;
}

// ── NFT Donation Statistics ─────────────────────────────────────────────

export interface ApiNFTDonationStats {
  TotalDonated?: number;
  TotalClaimed?: number;
  TotalUnclaimed?: number;
  NumDonations?: number;
  NumClaimed?: number;
  NumUnclaimed?: number;
  [key: string]: number | string | undefined;
}

// ── User Winnings ───────────────────────────────────────────────────────

export interface ApiUserWinnings {
  DonatedERC20Tokens: Array<{
    TokenAddress: string;
    TokenSymbol: string;
    Amount: string;
  }>;
  ETHRaffleToClaim: number;
  ETHRaffleToClaimWei: string;
  ETHChronoWarriorToClaim?: number;
  ETHChronoWarriorToClaimWei?: string;
  NumDonatedNFTToClaim: number;
  UnclaimedStakingReward: number;
}

// ── Bid Info (detail view) ──────────────────────────────────────────────

export interface ApiBidInfo {
  Tx: ApiTxEnvelope;
  BidderAid: number;
  BidderAddr: string;
  EthPrice: string;
  EthPriceEth: number;
  CstPrice: string;
  CstPriceEth: number;
  RWalkNFTId: number;
  RoundNum: number;
  BidType: number;
  BidPosition: number;
  PrizeTime: number;
  PrizeTimeDate: string;
  TimeUntilPrize: number;
  CSTReward: string;
  CSTRewardEth: number;
  NFTDonationTokenId: number;
  NFTDonationTokenAddr: string;
  NFTTokenURI: string;
  ImageURL: string;
  Message: string;
  DonatedERC20TokenAddr: string;
  DonatedERC20TokenAmount: string;
  DonatedERC20TokenAmountEth: number;
}

// ── Statistics (unique entities) ────────────────────────────────────────

export interface ApiUniqueBidder {
  BidderAddr: string;
  NumBids: number;
}

export interface ApiUniqueWinner {
  WinnerAid: number;
  WinnerAddr: string;
  PrizesCount: number;
  MaxWinAmount: string;
  MaxWinAmountEth: number;
  PrizesSum: number;
  WinnerStats: {
    MaxWinAmount: string;
    MaxWinAmountEth: number;
    PrizesCount: number;
    PrizesSum: string;
    PrizesSumEth: number;
    TokensCount: number;
    ERC20Count: number;
    ERC721Count: number;
    UnclaimedNfts: number;
    TotalSpent: string;
    TotalSpentEth: number;
  };
  NumWins?: number;
}

export interface ApiUniqueDonor {
  DonorAddr: string;
  NumDonations: number;
}

export interface ApiUniqueStaker {
  StakerAid: number;
  StakerAddr: string;
  TotalTokensStaked: number;
  NumStakeActions: number;
  NumUnstakeActions: number;
  TotalReward: string;
  TotalRewardEth: number;
  UnclaimedReward: string;
  UnclaimedRewardEth: number;
}

// ── Token distributions ─────────────────────────────────────────────────

export interface ApiCSTDistribution {
  OwnerAddr: string;
  NumTokens: number;
}

export interface ApiCTBalanceDistribution {
  OwnerAid: number;
  OwnerAddr: string;
  Balance: string;
  BalanceFloat: number;
  PercentOfSupply: number;
}

export interface ApiDonatedTokenDistribution {
  NftAddr: string;
  NumDonations: number;
}

export interface ApiCSTBidData {
  CSTPrice: string;
  SecondsElapsed: number;
  AuctionDuration: number;
}

// ── Round detail / list ─────────────────────────────────────────────────

export interface ApiMainPrize {
  WinnerAid: number;
  WinnerAddr: string;
  TimeoutTs: number;
  EthAmount: string;
  EthAmountEth: number;
  CstAmount: string;
  CstAmountEth: number;
  NftTokenId: number;
  Seed: string;
}

export interface ApiStakingDeposit {
  StakingDepositId: number;
  StakingDepositAmount: string;
  StakingDepositAmountEth: number;
  StakingPerToken: string;
  StakingPerTokenEth: number;
  StakingNumStakedTokens: number;
}

export interface ApiEnduranceChampion {
  WinnerAddr: string;
  NftTokenId: number;
  CstAmount: string;
  CstAmountEth: number;
}

export interface ApiChronoWarrior {
  WinnerAddr: string;
  EthAmount: string;
  EthAmountEth: number;
  CstAmount: string;
  CstAmountEth: number;
  NftTokenId: number;
}

export interface ApiRaffleNFTWinner {
  RecordId: number;
  EvtLogId: number;
  BlockNum: number;
  TxId: number;
  TxHash: string;
  TimeStamp: number;
  DateTime: string;
  WinnerAddr: string;
  WinnerAid: number;
  RoundNum: number;
  TokenId: number;
  CstAmount: string;
  CstAmountEth: number;
  WinnerIndex: number;
  IsRWalk: boolean;
  IsStaker: boolean;
}

export interface ApiRoundDetail {
  RoundNum: number;
  ClaimPrizeTx?: { Tx: ApiTxEnvelope };
  MainPrize: ApiMainPrize;
  CharityDeposit?: {
    CharityAddress: string;
    CharityAmount: string;
    CharityAmountETH: number;
  };
  StakingDeposit: ApiStakingDeposit;
  EnduranceChampion: ApiEnduranceChampion;
  LastCstBidder?: ApiEnduranceChampion;
  ChronoWarrior: ApiChronoWarrior;
  RoundStats: ApiCurRoundStats;
  RaffleNFTWinners: ApiRaffleNFTWinner[];
  StakingNFTWinners: ApiRaffleNFTWinner[];
  RaffleETHDeposits: ApiRaffleDepositResponse[];
  AllPrizes: unknown[];
}

export interface ApiRoundListItem {
  RoundNum: number;
  ClaimPrizeTx: { Tx: ApiTxEnvelope };
  MainPrize: ApiMainPrize;
  StakingDeposit: ApiStakingDeposit;
  EnduranceChampion: ApiEnduranceChampion;
  ChronoWarrior: ApiChronoWarrior;
  RoundStats: ApiCurRoundStats;
  RaffleNFTWinners: unknown;
  StakingNFTWinners: unknown;
  RaffleETHDeposits: unknown;
  AllPrizes: unknown;
}

// ── Staking rewards (winnings detail) ───────────────────────────────────

export interface ApiStakingRewardDeposit {
  RecordId: number;
  Tx?: Partial<ApiTxEnvelope>;
  DepositId: number;
  DepositTimeStamp: number;
  DepositDate: string;
  NumStakedNFTs: number;
  DepositAmount: string;
  DepositAmountEth: number;
  YourTokensStaked: number;
  YourRewardAmount: string;
  YourRewardAmountEth: number;
  YourCollectedAmount: string;
  YourCollectedAmountEth: number;
  PendingToClaim: string;
  PendingToClaimEth: number;
  NumUnclaimedTokens: number;
  AmountPerToken: string;
  AmountPerTokenEth: number;
}
