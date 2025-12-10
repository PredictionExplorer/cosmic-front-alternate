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

export interface CSTToken {
	RecordId: number;
	Tx: {
		EvtLogId: number;
		BlockNum: number;
		TxId: number;
		TxHash: string;
		TimeStamp: number;
		DateTime: string;
	};
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

export interface StakedCSTToken {
	TokenInfo: CSTToken;
	StakeEvtLogId: number;
	StakeBlockNum: number;
	StakeActionId: number;
	StakeTimeStamp: number;
	StakeDateTime: string;
	UserAddr: string;
	UserAid: number;
}

export interface RWLKToken {
	TokenId: number;
	TokenName?: string;
	IsUsed: boolean;
	IsStaked: boolean;
	StakeActionId?: number;
}

export interface StakedRWLKToken {
	TokenId: number;
	TokenName?: string;
	StakeActionId: number;
	StakeTimeStamp: number;
	StakeDateTime: string;
	UserAddr: string;
	UserAid: number;
}

