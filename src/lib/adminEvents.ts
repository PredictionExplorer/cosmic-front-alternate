/**
 * Admin Events Configuration
 *
 * Defines the display metadata for each system administration event type.
 * Indexed by RecordType from the API response.
 */

interface AdminEventDef {
  name: string;
  type?: string;
  description?: string;
}

export const ADMIN_EVENTS: AdminEventDef[] = [
  { name: "Undefined", description: "Undefined" },
  { name: "CharityPercentageChanged", type: "percentage", description: "The allocation percentage for the funds designated to the Charity wallet has been changed." },
  { name: "PrizePercentageChanged", type: "percentage", description: "The allocation percentage for funds designated for prize rewards has been changed." },
  { name: "RafflePercentageChanged", type: "percentage", description: "The allocation percentage for funds designated for raffle rewards has been changed." },
  { name: "StakingPercentageChanged", type: "percentage", description: "The allocation percentage for funds designated for staking rewards has been changed." },
  { name: "NumRaffleWinnersPerRoundChanged", type: "number", description: "The number of raffle winners per round has been changed." },
  { name: "NumRaffleNFTWinnersPerRoundChanged", type: "number", description: "The number of raffle NFT winners per round has been changed." },
  { name: "DelayDurationBeforeRoundActivationChanged", type: "time", description: "The delay duration time before round activation has been changed." },
  { name: "NumRaffleNFTWinnersStakingRWalkChanged", type: "number", description: "The number of raffle NFT winners for staking RandomWalk NFTs has been changed." },
  { name: "CharityAddressChanged", type: "address", description: "The address of the charity wallet has been changed." },
  { name: "RandomWalkAddressChanged", type: "address", description: "The address of the RandomWalkNFT contract has been changed." },
  { name: "PrizeWalletAddressChanged", type: "address", description: "The address of the raffle wallet has been changed." },
  { name: "StakingWalletAddressChanged", type: "address", description: "The address of the staking wallet has been changed." },
  { name: "StakingWalletRWalkAddressChanged", type: "address", description: "The address of the RandomWalk NFT staking wallet has been changed." },
  { name: "MarketingWalletAddressChanged", type: "address", description: "The address of the marketing wallet has been changed." },
  { name: "CosmicTokenAddressChanged", type: "address", description: "The address of the Cosmic Signature Token (ERC-20) contract has been changed." },
  { name: "CosmicSignatureAddressChanged", type: "address", description: "The address of the Cosmic Signature Token (ERC-721) contract has been changed." },
  { name: "Upgraded", type: "address", description: "The CosmicSignature contract has been upgraded." },
  { name: "TimeIncreaseChanged", type: "number", description: "The ratio of the time increasement has been changed." },
  { name: "TimeoutClaimPrizeChanged", type: "time", description: "The time out for claiming prize has been changed." },
  { name: "PriceIncreaseChanged", type: "number", description: "The ratio of the bid price increasement has been changed." },
  { name: "NanoSecondsExtraChanged", type: "time", description: "The value for the increment of prize time after every bid has been changed." },
  { name: "InitialSecondsUntilPrizeChanged", type: "time", description: "The initial value of the time until prize has been changed." },
  { name: "TreasurerAddressChanged", type: "address", description: "The address of the marketing wallet has been changed." },
  { name: "ActivationTimeChanged", type: "timestamp", description: "The round activation time has been changed." },
  { name: "RoundStartCSTAuctionLengthChanged", type: "number", description: "The length of the starting CST auction has been changed." },
  { name: "Erc20RewardMultiplierChanged", type: "number", description: "The ERC20 reward multiplier has been changed." },
  { name: "StartingBidPriceCSTMinLimitChanged", type: "number", description: "The minimum limit for the starting bid price with CST has been changed." },
  { name: "MarketingRewardChanged", type: "percentage", description: "The allocation percentage for funds designated for marketing rewards has been changed." },
  { name: "TokenRewardChanged", type: "percentage", description: "The allocation percentage for funds designated for token rewards has been changed." },
  { name: "MaxMessageLengthChanged", type: "number", description: "The max length of the bid message has been changed." },
  { name: "TokenGenerationScriptURLEvent", type: "url", description: "Token Generation Script URL has been changed." },
  { name: "BaseURI (CosmicSignature)", type: "url", description: "CosmicSignature NFT BaseURI has been changed." },
  { name: "Initialized (Initialized event, openzeppelin)", type: "number", description: "Contract initialization completed." },
  { name: "OwnershipTransferred", type: "address", description: "The ownership of the contract has been transferred." },
  { name: "TimeoutDurationToWithdrawPrizesChanged", type: "time", description: "The timeout duration to withdraw prizes has been changed." },
  { name: "EthDutchAuctionDurationDivisorChanged", type: "number", description: "The Eth dutch auction duration has been changed." },
  { name: "EthDutchAuctionEndingBidPriceDivisorChanged", type: "number", description: "The divisor for Eth dutch auction ending bid price has been changed." },
  { name: "ChronoWarriorEthPrizeAmountPercentageChanged", type: "number", description: "The allocation percentage for funds designated for chrono warrior Eth prize rewards has been changed." },
];
