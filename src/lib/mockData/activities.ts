// Mock activity data for timeline displays

export interface Activity {
	id: string;
	type: 'bid' | 'claim' | 'stake' | 'unstake' | 'donation' | 'transfer' | 'name-change';
	title: string;
	description: string;
	timestamp: number;
	roundNum?: number;
	amount?: string; // ETH or CST amount
	nftId?: number;
	txHash: string;
	metadata?: Record<string, any>;
}

// Fixed base timestamp for SSR compatibility (Dec 7, 2024 00:00 UTC)
const BASE_TIMESTAMP = 1733529600;

// Generate mock activities for current user
export const MOCK_USER_ACTIVITIES: Activity[] = [
	{
		id: '1',
		type: 'bid',
		title: 'Bid Placed',
		description: 'ETH bid in Round 234',
		timestamp: BASE_TIMESTAMP - 3600, // 1 hour ago
		roundNum: 234,
		amount: '0.0023 ETH',
		txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
		metadata: {
			bidType: 'ETH',
			message: "Let's win this!",
			cstEarned: '100 CST'
		}
	},
	{
		id: '2',
		type: 'claim',
		title: 'Main Prize Claimed',
		description: 'Won Round 233',
		timestamp: BASE_TIMESTAMP - 86400 * 1, // 1 day ago
		roundNum: 233,
		amount: '3.1 ETH',
		nftId: 1233,
		txHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef'
	},
	{
		id: '3',
		type: 'stake',
		title: 'NFT Staked',
		description: 'Staked Cosmic Signature #1234',
		timestamp: BASE_TIMESTAMP - 86400 * 3, // 3 days ago
		nftId: 1234,
		txHash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef'
	},
	{
		id: '4',
		type: 'bid',
		title: 'CST Bid Placed',
		description: 'CST bid in Round 232',
		timestamp: BASE_TIMESTAMP - 86400 * 5,
		roundNum: 232,
		amount: '450 CST',
		txHash: '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
		metadata: {
			bidType: 'CST',
			cstEarned: '100 CST'
		}
	},
	{
		id: '5',
		type: 'claim',
		title: 'Raffle Prize Claimed',
		description: 'Won ETH raffle in Round 231',
		timestamp: BASE_TIMESTAMP - 86400 * 8,
		roundNum: 231,
		amount: '0.3 ETH',
		txHash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef'
	},
	{
		id: '6',
		type: 'unstake',
		title: 'NFT Unstaked',
		description: 'Claimed 0.08 ETH in rewards',
		timestamp: BASE_TIMESTAMP - 86400 * 12,
		nftId: 1205,
		amount: '0.08 ETH',
		txHash: '0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef'
	},
	{
		id: '7',
		type: 'transfer',
		title: 'NFT Received',
		description: 'Received Cosmic Signature #1234',
		timestamp: BASE_TIMESTAMP - 86400 * 15,
		nftId: 1234,
		txHash: '0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef'
	},
	{
		id: '8',
		type: 'bid',
		title: 'Bid with Random Walk NFT',
		description: 'Used RWalk #4521 for 50% discount',
		timestamp: BASE_TIMESTAMP - 86400 * 18,
		roundNum: 229,
		amount: '0.0011 ETH',
		txHash: '0x8901234567abcdef8901234567abcdef8901234567abcdef8901234567abcdef',
		metadata: {
			bidType: 'ETH+RWALK',
			rwalkId: 4521,
			discount: '50%'
		}
	},
	{
		id: '9',
		type: 'donation',
		title: 'ETH Donated',
		description: 'Donated 0.1 ETH to Round 228',
		timestamp: BASE_TIMESTAMP - 86400 * 22,
		roundNum: 228,
		amount: '0.1 ETH',
		txHash: '0x9012345678abcdef9012345678abcdef9012345678abcdef9012345678abcdef'
	},
	{
		id: '10',
		type: 'name-change',
		title: 'NFT Named',
		description: 'Named NFT #1234 "Cosmic Dawn"',
		timestamp: BASE_TIMESTAMP - 86400 * 25,
		nftId: 1234,
		txHash: '0xa123456789abcdefa123456789abcdefa123456789abcdefa123456789abcdef',
		metadata: {
			newName: 'Cosmic Dawn'
		}
	}
];

// Helper functions
export function getUserActivities(address: string, limit?: number): Activity[] {
	// In real implementation, filter by address
	return limit ? MOCK_USER_ACTIVITIES.slice(0, limit) : MOCK_USER_ACTIVITIES;
}

export function getActivitiesByType(type: Activity['type']): Activity[] {
	return MOCK_USER_ACTIVITIES.filter(a => a.type === type);
}

export function getRecentActivities(limit: number = 10): Activity[] {
	return MOCK_USER_ACTIVITIES.slice(0, limit);
}
