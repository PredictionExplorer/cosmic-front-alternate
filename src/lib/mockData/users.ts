// Mock user data - mirrors API structure from /user/info/:address

export interface UserProfile {
	address: string;
	ensName?: string;
	totalBids: number;
	totalETHSpent: string; // Wei
	totalCSTSpent: string; // Wei
	totalETHWon: string; // Wei
	totalCSTWon: string; // Wei
	nftsOwned: number;
	nftsWon: number;
	nftsStaked: number;
	mainPrizesWon: number;
	championPrizesWon: number;
	rafflePrizesWon: number;
	firstBidAt: number; // Unix timestamp
	lastBidAt: number; // Unix timestamp
	joinedDate: string;
	isEnduranceChampion: boolean;
	isChronoWarrior: boolean;
}

export interface UserWinnings {
	unclaimedETH: string; // Wei
	unclaimedNFTs: number;
	unclaimedERC20Tokens: Array<{
		tokenAddress: string;
		tokenSymbol: string;
		amount: string;
	}>;
	unclaimedDonatedNFTs: Array<{
		nftAddress: string;
		tokenId: number;
		round: number;
	}>;
}

// Mock current user (alice.eth)
export const MOCK_CURRENT_USER: UserProfile = {
	address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
	ensName: 'alice.eth',
	totalBids: 47,
	totalETHSpent: '2500000000000000000', // 2.5 ETH
	totalCSTSpent: '5000000000000000000000', // 5,000 CST
	totalETHWon: '4200000000000000000', // 4.2 ETH
	totalCSTWon: '8000000000000000000000', // 8,000 CST
	nftsOwned: 12,
	nftsWon: 8,
	nftsStaked: 5,
	mainPrizesWon: 3,
	championPrizesWon: 2,
	rafflePrizesWon: 3,
	firstBidAt: 1701388800, // Dec 1, 2023
	lastBidAt: 1733529600, // Dec 7, 2024 00:00 UTC (fixed for SSR)
	joinedDate: 'December 2023',
	isEnduranceChampion: false,
	isChronoWarrior: true
};

// Mock winnings for current user
export const MOCK_USER_WINNINGS: UserWinnings = {
	unclaimedETH: '500000000000000000', // 0.5 ETH
	unclaimedNFTs: 0, // NFTs auto-sent
	unclaimedERC20Tokens: [
		{
			tokenAddress: '0x1234567890123456789012345678901234567890',
			tokenSymbol: 'USDC',
			amount: '1000000000' // 1,000 USDC (6 decimals)
		}
	],
	unclaimedDonatedNFTs: [
		{
			nftAddress: '0x9876543210987654321098765432109876543210',
			tokenId: 4521,
			round: 230
		},
		{
			nftAddress: '0x9876543210987654321098765432109876543210',
			tokenId: 4522,
			round: 230
		}
	]
};

// Mock other users
export const MOCK_USERS: UserProfile[] = [
	MOCK_CURRENT_USER,
	{
		address: '0x8234f35Cc6634C0532925a3b844Bc9e7595f1cDa',
		ensName: 'bob.eth',
		totalBids: 52,
		totalETHSpent: '3100000000000000000',
		totalCSTSpent: '6200000000000000000000',
		totalETHWon: '5400000000000000000',
		totalCSTWon: '9500000000000000000000',
		nftsOwned: 15,
		nftsWon: 10,
		nftsStaked: 8,
		mainPrizesWon: 4,
		championPrizesWon: 3,
		rafflePrizesWon: 3,
		firstBidAt: 1698710400,
		lastBidAt: 1733522400, // Fixed timestamp
		joinedDate: 'November 2023',
		isEnduranceChampion: true,
		isChronoWarrior: false
	},
	{
		address: '0x9345a46Dd7745D0643036a4c955Cc0e8706g2fEb',
		ensName: 'carol.eth',
		totalBids: 38,
		totalETHSpent: '1900000000000000000',
		totalCSTSpent: '3800000000000000000000',
		totalETHWon: '3100000000000000000',
		totalCSTWon: '6200000000000000000000',
		nftsOwned: 9,
		nftsWon: 6,
		nftsStaked: 4,
		mainPrizesWon: 2,
		championPrizesWon: 2,
		rafflePrizesWon: 2,
		firstBidAt: 1704067200,
		lastBidAt: 1733515200, // Fixed timestamp
		joinedDate: 'January 2024',
		isEnduranceChampion: false,
		isChronoWarrior: false
	}
];

// Helper functions
export function getUserProfile(address: string): UserProfile | null {
	return MOCK_USERS.find(u => u.address.toLowerCase() === address.toLowerCase()) || null;
}

export function getAllUsers(): UserProfile[] {
	return MOCK_USERS;
}

export function getTopBidders(limit: number = 10): UserProfile[] {
	return [...MOCK_USERS].sort((a, b) => b.totalBids - a.totalBids).slice(0, limit);
}

export function getTopWinners(limit: number = 10): UserProfile[] {
	return [...MOCK_USERS].sort((a, b) => parseFloat(b.totalETHWon) - parseFloat(a.totalETHWon)).slice(0, limit);
}
