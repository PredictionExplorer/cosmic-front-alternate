/**
 * Smart Contract Addresses
 *
 * Central configuration for all Cosmic Signature smart contract addresses.
 * Addresses are organized by network (currently Arbitrum One).
 *
 * IMPORTANT: Update these addresses before deployment to production.
 */

import { Address } from 'viem';

/**
 * Contract addresses from reference implementation
 * Deployed on local testnet (Chain ID: 31337)
 *
 * These are the actual deployed contract addresses used by the system
 */
export const LOCAL_TESTNET_CONTRACTS = {
	/** Main game contract - handles bidding, prizes, and game logic */
	COSMIC_GAME: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,

	/** CosmicSignatureToken (CST) - ERC-20 token used for bidding and rewards */
	COSMIC_SIGNATURE_TOKEN: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,

	/** CosmicSignature NFT - ERC-721 NFTs awarded as prizes */
	COSMIC_SIGNATURE_NFT: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address,

	/** RandomWalk NFT - Pre-existing ERC-721 NFTs used for bid discounts */
	RANDOM_WALK_NFT: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as Address,

	/** Prizes Wallet (RaffleWallet) - Holds secondary prizes and donated items */
	PRIZES_WALLET: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as Address,

	/** CST NFT Staking Wallet - Stake Cosmic Signature NFTs for ETH rewards */
	STAKING_WALLET_CST: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788' as Address,

	/** RandomWalk Staking Wallet - Stake RandomWalk NFTs for raffle eligibility */
	STAKING_WALLET_RWLK: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' as Address,

	/** Charity Wallet - Receives charity donations (7% of prizes) */
	CHARITY_WALLET: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as Address,

	/** Marketing Wallet - Receives CST tokens for marketing activities */
	MARKETING_WALLET: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6' as Address,

	/** DAO Contract - Governance contract for CST token holders */
	COSMIC_DAO: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as Address
} as const;

/**
 * Placeholder for mainnet addresses (to be filled when deploying to production)
 */
export const MAINNET_CONTRACTS = {
	COSMIC_GAME: '0x0000000000000000000000000000000000000000' as Address,
	COSMIC_SIGNATURE_TOKEN: '0x0000000000000000000000000000000000000000' as Address,
	COSMIC_SIGNATURE_NFT: '0x0000000000000000000000000000000000000000' as Address,
	RANDOM_WALK_NFT: '0x0000000000000000000000000000000000000000' as Address,
	PRIZES_WALLET: '0x0000000000000000000000000000000000000000' as Address,
	STAKING_WALLET_CST: '0x0000000000000000000000000000000000000000' as Address,
	STAKING_WALLET_RWLK: '0x0000000000000000000000000000000000000000' as Address,
	CHARITY_WALLET: '0x0000000000000000000000000000000000000000' as Address,
	MARKETING_WALLET: '0x0000000000000000000000000000000000000000' as Address,
	COSMIC_DAO: '0x0000000000000000000000000000000000000000' as Address
} as const;

/**
 * Get contract addresses for a specific chain
 *
 * Returns the appropriate contract addresses based on the connected network
 */
export function getContractAddresses(chainId: number) {
	// Local testnet (default)
	if (chainId === 31337) {
		return LOCAL_TESTNET_CONTRACTS;
	}

	// Arbitrum One (mainnet)
	if (chainId === 42161) {
		return MAINNET_CONTRACTS;
	}

	// Arbitrum Sepolia (testnet)
	if (chainId === 421614) {
		return LOCAL_TESTNET_CONTRACTS; // Using same addresses for now
	}

	// Default to local testnet
	return LOCAL_TESTNET_CONTRACTS;
}

/**
 * Contract address type guard
 */
export function isValidContractAddress(address: string): address is Address {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Contract names for display purposes
 */
export const CONTRACT_NAMES = {
	[LOCAL_TESTNET_CONTRACTS.COSMIC_GAME]: 'Cosmic Game',
	[LOCAL_TESTNET_CONTRACTS.COSMIC_SIGNATURE_TOKEN]: 'Cosmic Signature Token (CST)',
	[LOCAL_TESTNET_CONTRACTS.COSMIC_SIGNATURE_NFT]: 'Cosmic Signature NFT',
	[LOCAL_TESTNET_CONTRACTS.RANDOM_WALK_NFT]: 'RandomWalk NFT',
	[LOCAL_TESTNET_CONTRACTS.PRIZES_WALLET]: 'Prizes Wallet',
	[LOCAL_TESTNET_CONTRACTS.STAKING_WALLET_CST]: 'CST Staking Wallet',
	[LOCAL_TESTNET_CONTRACTS.STAKING_WALLET_RWLK]: 'RandomWalk Staking Wallet',
	[LOCAL_TESTNET_CONTRACTS.CHARITY_WALLET]: 'Charity Wallet',
	[LOCAL_TESTNET_CONTRACTS.MARKETING_WALLET]: 'Marketing Wallet',
	[LOCAL_TESTNET_CONTRACTS.COSMIC_DAO]: 'Cosmic DAO'
} as const;

/**
 * Export for convenience - defaults to local testnet
 */
export const CONTRACTS = LOCAL_TESTNET_CONTRACTS;
