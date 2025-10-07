/**
 * Staking Wallet Contract Hooks
 *
 * Provides hooks for both CST and RandomWalk NFT staking.
 * Handles stake/unstake operations and reward tracking.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '@/lib/web3/contracts';
import StakingWalletCSTABI from '@/contracts/StakingWalletCosmicSignatureNft.json';
import StakingWalletRWLKABI from '@/contracts/StakingWalletRandomWalkNft.json';

/**
 * Hook for CST NFT Staking (with ETH rewards)
 */
export function useStakingWalletCST() {
	const contractConfig = {
		address: CONTRACTS.STAKING_WALLET_CST,
		abi: StakingWalletCSTABI
	} as const;

	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	return {
		/**
		 * Read operations
		 */
		read: {
			/**
			 * Get total number of staked NFTs (global)
			 */
			useNumStaked: () =>
				useReadContract({
					...contractConfig,
					functionName: 'numStakedNfts'
				}),

			/**
			 * Get reward amount per staked NFT
			 */
			useRewardPerNft: () =>
				useReadContract({
					...contractConfig,
					functionName: 'rewardAmountPerStakedNft'
				}),

			/**
			 * Get stake action details
			 */
			useStakeAction: (actionId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'stakeActions',
					args: [actionId]
				}),

			/**
			 * Check if NFT was already staked before
			 */
			useWasStaked: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'usedNfts',
					args: [nftId]
				})
		},

		/**
		 * Write operations
		 */
		write: {
			/**
			 * Stake a single NFT
			 */
			stake: (nftId: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'stake',
					args: [nftId]
				});
			},

			/**
			 * Stake multiple NFTs (batch operation)
			 */
			stakeMany: (nftIds: bigint[]) => {
				return writeContract({
					...contractConfig,
					functionName: 'stakeMany',
					args: [nftIds]
				});
			},

			/**
			 * Unstake NFT and claim rewards
			 */
			unstake: (stakeActionId: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'unstake',
					args: [stakeActionId]
				});
			},

			/**
			 * Unstake multiple NFTs (batch operation)
			 */
			unstakeMany: (stakeActionIds: bigint[]) => {
				return writeContract({
					...contractConfig,
					functionName: 'unstakeMany',
					args: [stakeActionIds]
				});
			}
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
 * Hook for RandomWalk NFT Staking (raffle eligibility only, no ETH rewards)
 */
export function useStakingWalletRWLK() {
	const contractConfig = {
		address: CONTRACTS.STAKING_WALLET_RWLK,
		abi: StakingWalletRWLKABI
	} as const;

	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	return {
		/**
		 * Read operations
		 */
		read: {
			/**
			 * Get total number of staked RandomWalk NFTs (global)
			 */
			useNumStaked: () =>
				useReadContract({
					...contractConfig,
					functionName: 'numStakedNfts'
				}),

			/**
			 * Get stake action details
			 */
			useStakeAction: (actionId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'stakeActions',
					args: [actionId]
				}),

			/**
			 * Check if NFT was already staked before
			 */
			useWasStaked: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'usedNfts',
					args: [nftId]
				})
		},

		/**
		 * Write operations
		 */
		write: {
			/**
			 * Stake a single RandomWalk NFT
			 *
			 * IMPORTANT: NFT can only be staked ONCE, ever. This is permanent.
			 */
			stake: (nftId: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'stake',
					args: [nftId]
				});
			},

			/**
			 * Stake multiple RandomWalk NFTs
			 */
			stakeMany: (nftIds: bigint[]) => {
				return writeContract({
					...contractConfig,
					functionName: 'stakeMany',
					args: [nftIds]
				});
			},

			/**
			 * Unstake RandomWalk NFT (no rewards)
			 */
			unstake: (stakeActionId: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'unstake',
					args: [stakeActionId]
				});
			},

			/**
			 * Unstake multiple RandomWalk NFTs
			 */
			unstakeMany: (stakeActionIds: bigint[]) => {
				return writeContract({
					...contractConfig,
					functionName: 'unstakeMany',
					args: [stakeActionIds]
				});
			}
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
