/**
 * Staking Wallet Contract Hooks
 *
 * Provides hooks for both CST and RandomWalk NFT staking.
 * Handles stake/unstake operations and reward tracking.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { zeroAddress } from 'viem';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { defaultChain } from '@/lib/web3/chains';
import StakingWalletCSTABI from '@/contracts/StakingWalletCosmicSignatureNft.json';
import StakingWalletRWLKABI from '@/contracts/StakingWalletRandomWalkNft.json';

/**
 * Hook for CST NFT Staking (with ETH rewards)
 */
export function useStakingWalletCST() {
	const contracts = useContractAddresses();
	const addr = contracts?.STAKING_WALLET_CST ?? zeroAddress;
	const queryEnabled = !!contracts?.STAKING_WALLET_CST;
	const readConfig = {
		address: addr,
		abi: StakingWalletCSTABI,
		chainId: defaultChain.id,
		query: { enabled: queryEnabled },
	} as const;
	const writeBase = {
		address: addr,
		abi: StakingWalletCSTABI,
		chainId: defaultChain.id,
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
					...readConfig,
					functionName: 'numStakedNfts'
				}),

			/**
			 * Get reward amount per staked NFT
			 */
			useRewardPerNft: () =>
				useReadContract({
					...readConfig,
					functionName: 'rewardAmountPerStakedNft'
				}),

			/**
			 * Get stake action details
			 */
			useStakeAction: (actionId: bigint) =>
				useReadContract({
					...readConfig,
					functionName: 'stakeActions',
					args: [actionId]
				}),

			/**
			 * Mapping slot for “this NFT id was used for staking” (0 = never, nonzero = used).
			 * Must match on-chain `usedNfts` (public mapping), not a fictional `wasNftUsed`.
			 */
			useWasStaked: (nftId: bigint) =>
				useReadContract({
					...readConfig,
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
					...writeBase,
					functionName: 'stake',
					args: [nftId]
				});
			},

			/**
			 * Stake multiple NFTs (batch operation)
			 */
			stakeMany: (nftIds: bigint[]) => {
				return writeContract({
					...writeBase,
					functionName: 'stakeMany',
					args: [nftIds]
				});
			},

			/**
			 * Unstake NFT and claim rewards
			 */
			unstake: (stakeActionId: bigint) => {
				return writeContract({
					...writeBase,
					functionName: 'unstake',
					args: [stakeActionId]
				});
			},

			/**
			 * Unstake multiple NFTs (batch operation)
			 */
			unstakeMany: (stakeActionIds: bigint[]) => {
				return writeContract({
					...writeBase,
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
	const contracts = useContractAddresses();
	const addr = contracts?.STAKING_WALLET_RWLK ?? zeroAddress;
	const queryEnabled = !!contracts?.STAKING_WALLET_RWLK;
	const readConfig = {
		address: addr,
		abi: StakingWalletRWLKABI,
		chainId: defaultChain.id,
		query: { enabled: queryEnabled },
	} as const;
	const writeBase = {
		address: addr,
		abi: StakingWalletRWLKABI,
		chainId: defaultChain.id,
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
					...readConfig,
					functionName: 'numStakedNfts'
				}),

			/**
			 * Get stake action details
			 */
			useStakeAction: (actionId: bigint) =>
				useReadContract({
					...readConfig,
					functionName: 'stakeActions',
					args: [actionId]
				}),

			/**
			 * Mapping slot for “this NFT id was used for staking” (0 = never, nonzero = used).
			 * Must match on-chain `usedNfts` (public mapping), not a fictional `wasNftUsed`.
			 */
			useWasStaked: (nftId: bigint) =>
				useReadContract({
					...readConfig,
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
					...writeBase,
					functionName: 'stake',
					args: [nftId]
				});
			},

			/**
			 * Stake multiple RandomWalk NFTs
			 */
			stakeMany: (nftIds: bigint[]) => {
				return writeContract({
					...writeBase,
					functionName: 'stakeMany',
					args: [nftIds]
				});
			},

			/**
			 * Unstake RandomWalk NFT (no rewards)
			 */
			unstake: (stakeActionId: bigint) => {
				return writeContract({
					...writeBase,
					functionName: 'unstake',
					args: [stakeActionId]
				});
			},

			/**
			 * Unstake multiple RandomWalk NFTs
			 */
			unstakeMany: (stakeActionIds: bigint[]) => {
				return writeContract({
					...writeBase,
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
