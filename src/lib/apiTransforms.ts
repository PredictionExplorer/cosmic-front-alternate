/**
 * API Response Transformers
 * 
 * Utilities to transform API responses into formats expected by components.
 * The API returns nested structures, but components expect flattened data.
 */

/**
 * API Bid Response (nested structure from backend)
 */
interface ApiBidResponse {
  Tx?: {
    EvtLogId?: number;
    TimeStamp?: number;
    TxHash?: string;
    BlockNum?: number;
    DateTime?: string;
  };
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

/**
 * Component Bid Data (flattened structure)
 * Exported for use in components that need to type bid data
 */
export interface ComponentBidData {
  EvtLogId: number;
  RoundNum: number;
  BidderAddr: string;
  BidType: number;
  BidPrice: string;
  BidPriceEth: number;
  RWalkNFTId: number;
  NumCSTTokens: string;
  TimeStamp: number;
  TxHash: string;
  Message: string;
  // Additional properties from API
  BidPosition?: number;
  CstPriceEth?: number;
  CSTRewardEth?: number;
  NFTDonationTokenId?: number;
  NFTDonationTokenAddr?: string;
  DonatedERC20TokenAddr?: string;
  DonatedERC20TokenAmount?: string;
  NumCSTTokensEth?: number;
}

/**
 * Transform bid data from API format to component format
 * API returns: { Tx: { EvtLogId, TimeStamp, TxHash, ... }, BidderAddr, EthPriceEth, ... }
 * Components expect: { EvtLogId, TimeStamp, TxHash, ..., BidderAddr, BidPriceEth, ... }
 */
export function transformBidData(apiBid: ApiBidResponse): ComponentBidData {
  return {
    EvtLogId: apiBid.Tx?.EvtLogId || 0,
    RoundNum: apiBid.RoundNum || 0,
    BidderAddr: apiBid.BidderAddr || "",
    BidType: apiBid.BidType || 0,
    BidPrice: apiBid.EthPrice || "0",
    BidPriceEth: apiBid.EthPriceEth || 0,
    RWalkNFTId: apiBid.RWalkNFTId || -1,
    NumCSTTokens: apiBid.CSTReward || "0",
    TimeStamp: apiBid.Tx?.TimeStamp || 0,
    TxHash: apiBid.Tx?.TxHash || "",
    Message: apiBid.Message || "",
    // Additional optional properties
    BidPosition: apiBid.BidPosition,
    CstPriceEth: apiBid.CstPriceEth,
    CSTRewardEth: apiBid.CSTRewardEth,
    NFTDonationTokenId: apiBid.NFTDonationTokenId,
    NFTDonationTokenAddr: apiBid.NFTDonationTokenAddr,
    DonatedERC20TokenAddr: apiBid.DonatedERC20TokenAddr,
    DonatedERC20TokenAmount: apiBid.DonatedERC20TokenAmount,
    NumCSTTokensEth: apiBid.NumCSTTokensEth,
  };
}

/**
 * Transform array of bids
 */
export function transformBidList(apiBids: ApiBidResponse[]): ComponentBidData[] {
  return apiBids.map(transformBidData);
}

/**
 * API Raffle Deposit Response (nested structure from backend)
 */
interface ApiRaffleDepositResponse {
  RecordId?: number;
  Tx?: {
    EvtLogId?: number;
    BlockNum?: number;
    TxId?: number;
    TxHash?: string;
    TimeStamp?: number;
    DateTime?: string;
  };
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

/**
 * Component Raffle Deposit Data (flattened structure)
 */
export interface ComponentRaffleDepositData {
  EvtLogId: number;
  TxHash: string;
  TimeStamp: number;
  RoundNum: number;
  Amount: number;
}

/**
 * Transform raffle deposit data from API format to component format
 * API returns: { RecordId, Tx: { EvtLogId, TxHash, TimeStamp, ... }, RoundNum, Amount, ... }
 * Components expect: { EvtLogId, TxHash, TimeStamp, RoundNum, Amount }
 */
export function transformRaffleDepositData(apiDeposit: ApiRaffleDepositResponse): ComponentRaffleDepositData {
  return {
    EvtLogId: apiDeposit.Tx?.EvtLogId || apiDeposit.RecordId || 0,
    TxHash: apiDeposit.Tx?.TxHash || "",
    TimeStamp: apiDeposit.Tx?.TimeStamp || 0,
    RoundNum: apiDeposit.RoundNum || 0,
    Amount: apiDeposit.Amount || 0,
  };
}

/**
 * Transform array of raffle deposits
 */
export function transformRaffleDepositList(apiDeposits: ApiRaffleDepositResponse[]): ComponentRaffleDepositData[] {
  return apiDeposits.map(transformRaffleDepositData);
}

