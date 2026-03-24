/**
 * Domain / UI types.
 *
 * These are the "clean" shapes the UI works with. For types that match the
 * API exactly, we re-export from the canonical DTO file so there is one
 * source of truth.
 */

export type {
	ApiCSTToken as CSTToken,
	ApiStakedCSTToken as StakedCSTToken,
	ApiRWLKToken as RWLKToken,
	ApiStakedRWLKToken as StakedRWLKToken,
	ApiStakingAction as StakingAction,
	ApiStakingReward as StakingReward,
	ApiCollectedStakingReward as CollectedStakingReward,
	ApiRWLKMint as RWLKMint,
	ApiClaimHistory as ClaimHistory,
	ApiMarketingReward as MarketingReward,
	ApiDonatedNFT as DonatedNFT,
	ApiDonatedERC20 as DonatedERC20,
	ApiUserInfo as UserInfo,
	ApiDashboardData as DashboardData,
} from "@/services/apiTypes";

export interface NFT {
	id: number;
	tokenId: number;
	name: string;
	owner: string;
	round: number;
	seed: string;
	imageUrl: string;
	videoUrl?: string;
	mintedAt: string;
	customName?: string;
}

export interface Round {
	roundNumber: number;
	prizePool: number;
	lastBidder: string;
	totalBids: number;
	ethBidPrice: number;
	cstBidPrice: number;
	timeRemaining: number;
	isActive: boolean;
	startedAt?: string;
	enduranceChampion?: Champion;
	chronoWarrior?: Champion;
}

export interface Champion {
	address: string;
	duration: number;
	ensName?: string;
}

export interface Bid {
	id: string;
	roundNumber: number;
	bidder: string;
	type: 'ETH' | 'CST' | 'ETH+NFT';
	amount: number;
	timestamp: string;
	message?: string;
	randomWalkNftId?: number;
}

export interface Prize {
	type: 'main' | 'endurance' | 'chrono' | 'raffle-eth' | 'raffle-nft' | 'staking';
	winner: string;
	amount?: number;
	nftId?: number;
	roundNumber: number;
	claimedAt?: string;
}

export interface StakeAction {
	id: string;
	nftId: number;
	staker: string;
	stakedAt: string;
	unstakedAt?: string;
	rewardsEarned?: number;
}

export interface UserStats {
	address: string;
	totalBids: number;
	totalSpentEth: number;
	totalSpentCst: number;
	prizesWon: Prize[];
	nftsOwned: NFT[];
	nftsStaked: NFT[];
	cstBalance: number;
}
