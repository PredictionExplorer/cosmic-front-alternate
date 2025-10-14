/**
 * Cosmic Game Contract Hook
 *
 * Provides typed access to the main CosmicSignatureGame contract.
 * Handles all game logic including bidding, prize claiming, and donations.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import CosmicGameABI from '@/contracts/CosmicGame.json';

/**
 * Hook for reading from the Cosmic Game contract
 *
 * Provides read-only access to contract state.
 * Results are automatically cached and refreshed.
 */
export function useCosmicGameRead() {
	const contractConfig = {
		address: CONTRACTS.COSMIC_GAME,
		abi: CosmicGameABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Get current round number
		 */
		useRoundNum: () =>
			useReadContract({
				...contractConfig,
				functionName: 'roundNum'
			}),

		/**
		 * Get current ETH bid price
		 */
		useEthBidPrice: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getNextEthBidPrice'
			}),

		/**
		 * Get current CST bid price
		 */
		useCstBidPrice: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getNextCstBidPrice'
			}),

		/**
		 * Get last bidder address
		 */
		useLastBidder: () =>
			useReadContract({
				...contractConfig,
				functionName: 'lastBidderAddress'
			}),

		/**
		 * Get main prize time (when prize can be claimed)
		 */
		useMainPrizeTime: () =>
			useReadContract({
				...contractConfig,
				functionName: 'mainPrizeTime'
			}),

		/**
		 * Get main prize amount
		 */
		useMainPrizeAmount: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getMainEthPrizeAmount'
			}),

		/**
		 * Get duration until main prize can be claimed
		 */
		useDurationUntilMainPrize: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getDurationUntilMainPrize'
			}),

		/**
		 * Get current champions
		 */
		useCurrentChampions: () =>
			useReadContract({
				...contractConfig,
				functionName: 'tryGetCurrentChampions'
			}),

		/**
		 * Get total bids in a round
		 */
		useTotalBids: (roundNum: bigint) =>
			useReadContract({
				...contractConfig,
				functionName: 'getTotalNumBids',
				args: [roundNum]
			}),

		/**
		 * Get ETH Dutch auction durations
		 */
		useEthAuctionDurations: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getEthDutchAuctionDurations'
			}),

		/**
		 * Get CST Dutch auction durations
		 */
		useCstAuctionDurations: () =>
			useReadContract({
				...contractConfig,
				functionName: 'getCstDutchAuctionDurations'
			}),

		/**
		 * Get round activation time
		 */
		useRoundActivationTime: () =>
			useReadContract({
				...contractConfig,
				functionName: 'roundActivationTime'
			}),

		/**
		 * Check if RandomWalk NFT was used
		 */
		useIsRandomWalkUsed: (nftId: bigint) =>
			useReadContract({
				...contractConfig,
				functionName: 'usedRandomWalkNfts',
				args: [nftId]
			})
	};
}

/**
 * Hook for writing to the Cosmic Game contract
 *
 * Provides functions to submit transactions.
 * Handles gas estimation and error handling.
 */
export function useCosmicGameWrite() {
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = {
		address: CONTRACTS.COSMIC_GAME,
		abi: CosmicGameABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Place an ETH bid
		 *
		 * @param randomWalkNftId - RandomWalk NFT ID to use for discount, or -1 for none
		 * @param message - Bid message (max 280 characters)
		 * @param value - ETH amount to send (in Wei)
		 */
		bidWithEth: (randomWalkNftId: bigint, message: string, value: bigint) => {
			return writeContract({
				...contractConfig,
				functionName: 'bidWithEth',
				args: [randomWalkNftId, message],
				value
			});
		},

		/**
		 * Place a CST bid
		 *
		 * @param priceMaxLimit - Maximum price willing to pay (slippage protection)
		 * @param message - Bid message
		 */
		bidWithCst: (priceMaxLimit: bigint, message: string) => {
			return writeContract({
				...contractConfig,
				functionName: 'bidWithCst',
				args: [priceMaxLimit, message]
			});
		},

		/**
		 * Claim the main prize
		 *
		 * Ends the round and distributes all prizes.
		 * Caller receives 25% of contract balance + 1 NFT.
		 */
		claimMainPrize: () => {
			return writeContract({
				...contractConfig,
				functionName: 'claimMainPrize'
			});
		},

		/**
		 * Donate ETH to the prize pool
		 *
		 * @param value - ETH amount to donate (in Wei)
		 */
		donateEth: (value: bigint) => {
			return writeContract({
				...contractConfig,
				functionName: 'donateEth',
				value
			});
		},

		/**
		 * Donate ETH with additional info (for advertising)
		 *
		 * @param data - JSON-formatted info string
		 * @param value - ETH amount to donate (in Wei)
		 */
		donateEthWithInfo: (data: string, value: bigint) => {
			return writeContract({
				...contractConfig,
				functionName: 'donateEthWithInfo',
				args: [data],
				value
			});
		},

		/**
		 * Bid with ETH and donate an NFT
		 */
		bidWithEthAndDonateNft: (
			randomWalkNftId: bigint,
			message: string,
			nftAddress: Address,
			nftId: bigint,
			value: bigint
		) => {
			return writeContract({
				...contractConfig,
				functionName: 'bidWithEthAndDonateNft',
				args: [randomWalkNftId, message, nftAddress, nftId],
				value
			});
		},

		/**
		 * Bid with ETH and donate ERC-20 tokens
		 */
		bidWithEthAndDonateToken: (
			randomWalkNftId: bigint,
			message: string,
			tokenAddress: Address,
			amount: bigint,
			value: bigint
		) => {
			return writeContract({
				...contractConfig,
				functionName: 'bidWithEthAndDonateToken',
				args: [randomWalkNftId, message, tokenAddress, amount],
				value
			});
		},

		/**
		 * Transaction status
		 */
		status: {
			hash,
			isPending,
			isConfirming,
			isSuccess,
			error
		}
	};
}

/**
 * Combined hook for both read and write operations
 */
export function useCosmicGame() {
	const read = useCosmicGameRead();
	const write = useCosmicGameWrite();

	return {
		read,
		write,
		// Convenience helpers
		isTransactionPending: write.status.isPending || write.status.isConfirming,
		transactionHash: write.status.hash,
		transactionError: write.status.error
	};
}
