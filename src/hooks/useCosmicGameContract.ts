/**
 * Cosmic Game Contract Hook
 *
 * Provides typed access to the main CosmicSignatureGame contract.
 * Handles all game logic including bidding, prize claiming, and donations.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, zeroAddress } from 'viem';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { defaultChain } from '@/lib/web3/chains';
import CosmicGameABI from '@/contracts/CosmicGame.json';
import {
  BID_CST_REWARD_AMOUNT_MIN_LIMIT_V2,
  bidArgsForV2,
  pickBidWriteAbi,
  type CosmicGameBidFunctionName,
} from '@/lib/web3/cosmicGameContractCompat';

/**
 * Hook for reading from the Cosmic Game contract
 *
 * Provides read-only access to contract state.
 * Results are automatically cached and refreshed.
 */
export function useCosmicGameRead() {
	const contracts = useContractAddresses();
	const address = contracts?.COSMIC_GAME ?? zeroAddress;
	const queryEnabled = !!contracts?.COSMIC_GAME;
	const contractConfig = {
		address,
		abi: CosmicGameABI,
		chainId: defaultChain.id,
		query: { enabled: queryEnabled },
	} as const;

	return {
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
			}),

		/**
		 * Get CST reward amount per bid.
		 *
		 * V2 contracts compute the reward dynamically (grows with time since the
		 * last bid) via `getBidCstRewardAmount`. On V1 contracts that selector
		 * doesn't exist, so we fall back to the fixed `cstRewardAmountForBidding`.
		 */
		useCstRewardPerBid: () => {
			// The V2 reward grows with time since the last bid, so keep it fresh.
			const v2 = useReadContract({
				...contractConfig,
				functionName: 'getBidCstRewardAmount',
				query: { enabled: queryEnabled, refetchInterval: 5000 }
			});
			const v1 = useReadContract({
				...contractConfig,
				functionName: 'cstRewardAmountForBidding',
				query: { enabled: queryEnabled && v2.isError }
			});
			return v2.isError ? v1 : v2;
		},

		/**
		 * Get maximum bid message length
		 */
		useBidMessageMaxLength: () =>
			useReadContract({
				...contractConfig,
				functionName: 'bidMessageLengthMaxLimit'
			}),

		/**
		 * Get ETH bid price increase divisor (used to calculate price increase %)
		 */
		useEthBidPriceIncreaseDivisor: () =>
			useReadContract({
				...contractConfig,
				functionName: 'ethBidPriceIncreaseDivisor'
			}),

		/**
		 * Get main prize time increment increase divisor (used to calculate time increase %)
		 */
		useMainPrizeTimeIncrementIncreaseDivisor: () =>
			useReadContract({
				...contractConfig,
				functionName: 'mainPrizeTimeIncrementIncreaseDivisor'
			}),

		/**
		 * Get CST dutch auction beginning bid price minimum limit
		 */
		useCstDutchAuctionBeginningBidPriceMinLimit: () =>
			useReadContract({
				...contractConfig,
				functionName: 'cstDutchAuctionBeginningBidPriceMinLimit'
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
	const contracts = useContractAddresses();
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const gameAddr = contracts?.COSMIC_GAME;
	const contractConfig = gameAddr
		? ({
				address: gameAddr,
				abi: CosmicGameABI,
				chainId: defaultChain.id,
			} as const)
		: null;

	const requireGameConfig = () => {
		if (!contractConfig) {
			throw new Error('Cosmic Game contract address not loaded from the API yet.');
		}
		return contractConfig;
	};

	/**
	 * Send a bid using the V2 argument shape (V2 appends `bidCstRewardAmountMinLimit_`
	 * after the message; 0 = accept any CST reward). The ABI is narrowed to the single
	 * matching overload since the merged ABI contains both V1 and V2 signatures.
	 * Note: `usePlaceBid` is the preferred bid path — it also handles the V1 fallback.
	 */
	const writeBid = (
		functionName: CosmicGameBidFunctionName,
		v1Args: readonly unknown[],
		options?: { value?: bigint; bidCstRewardAmountMinLimit?: bigint }
	) => {
		const args = bidArgsForV2(
			functionName,
			v1Args,
			options?.bidCstRewardAmountMinLimit ?? BID_CST_REWARD_AMOUNT_MIN_LIMIT_V2
		);
		return writeContract({
			...requireGameConfig(),
			abi: pickBidWriteAbi(functionName, args),
			functionName,
			args,
			...(options?.value !== undefined ? { value: options.value } : {})
		});
	};

	return {
		/**
		 * Place an ETH bid
		 *
		 * @param randomWalkNftId - RandomWalk NFT ID to use for discount, or -1 for none
		 * @param message - Bid message (max 280 characters)
		 * @param value - ETH amount to send (in Wei)
		 */
		bidWithEth: (randomWalkNftId: bigint, message: string, value: bigint) => {
			return writeBid('bidWithEth', [randomWalkNftId, message], { value });
		},

		/**
		 * Place a CST bid
		 *
		 * @param priceMaxLimit - Maximum price willing to pay (slippage protection)
		 * @param message - Bid message
		 */
		bidWithCst: (priceMaxLimit: bigint, message: string) => {
			return writeBid('bidWithCst', [priceMaxLimit, message]);
		},

		/**
		 * Place a CST bid and donate an NFT
		 */
		bidWithCstAndDonateNft: (priceMaxLimit: bigint, message: string, nftAddress: Address, nftTokenId: bigint) => {
			return writeBid('bidWithCstAndDonateNft', [priceMaxLimit, message, nftAddress, nftTokenId]);
		},

		/**
		 * Place a CST bid and donate ERC20 tokens
		 */
		bidWithCstAndDonateToken: (priceMaxLimit: bigint, message: string, tokenAddress: Address, amount: bigint) => {
			return writeBid('bidWithCstAndDonateToken', [priceMaxLimit, message, tokenAddress, amount]);
		},

		/**
		 * Claim the main prize
		 *
		 * Ends the round and distributes all prizes.
		 * Caller receives 25% of contract balance + 1 NFT.
		 */
		claimMainPrize: () => {
			return writeContract({
				...requireGameConfig(),
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
				...requireGameConfig(),
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
				...requireGameConfig(),
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
			return writeBid('bidWithEthAndDonateNft', [randomWalkNftId, message, nftAddress, nftId], { value });
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
			return writeBid('bidWithEthAndDonateToken', [randomWalkNftId, message, tokenAddress, amount], { value });
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
