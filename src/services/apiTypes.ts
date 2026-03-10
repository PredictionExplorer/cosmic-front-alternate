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
