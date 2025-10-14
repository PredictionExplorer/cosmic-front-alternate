/**
 * Cosmic Signature NFT Contract Hook
 *
 * Provides access to the CosmicSignatureNft (ERC-721) contract.
 * Handles NFT metadata, ownership, transfers, and name customization.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { Address } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import CosmicSignatureNFTABI from '@/contracts/CosmicSignature.json';

/**
 * Hook for Cosmic Signature NFT operations
 */
export function useCosmicSignatureNFT() {
	const { address: userAddress } = useAccount();
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = {
		address: CONTRACTS.COSMIC_SIGNATURE_NFT,
		abi: CosmicSignatureNFTABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Read operations
		 */
		read: {
			/**
			 * Get NFT metadata (name + seed)
			 */
			useMetadata: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'getNftMetaData',
					args: [nftId]
				}),

			/**
			 * Get NFT custom name
			 */
			useName: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'getNftName',
					args: [nftId]
				}),

			/**
			 * Get NFT seed (for image generation)
			 */
			useSeed: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'getNftSeed',
					args: [nftId]
				}),

			/**
			 * Get NFT owner
			 */
			useOwner: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'ownerOf',
					args: [nftId]
				}),

			/**
			 * Get user's NFT balance
			 */
			useBalance: (address?: Address) =>
				useReadContract({
					...contractConfig,
					functionName: 'balanceOf',
					args: [address || userAddress!],
					query: {
						enabled: !!address || !!userAddress
					}
				}),

			/**
			 * Get NFT ID by index for a user
			 */
			useTokenOfOwnerByIndex: (address: Address, index: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'tokenOfOwnerByIndex',
					args: [address, index]
				}),

			/**
			 * Get total supply of NFTs
			 */
			useTotalSupply: () =>
				useReadContract({
					...contractConfig,
					functionName: 'totalSupply'
				}),

			/**
			 * Check if address is approved for all
			 */
			useIsApprovedForAll: (owner: Address, operator: Address) =>
				useReadContract({
					...contractConfig,
					functionName: 'isApprovedForAll',
					args: [owner, operator]
				}),

			/**
			 * Get token URI (metadata URL)
			 */
			useTokenURI: (nftId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'tokenURI',
					args: [nftId]
				})
		},

		/**
		 * Write operations
		 */
		write: {
			/**
			 * Set custom name for an NFT
			 *
			 * @param nftId - Token ID
			 * @param name - New name (max 32 bytes)
			 */
			setName: (nftId: bigint, name: string) => {
				return writeContract({
					...contractConfig,
					functionName: 'setNftName',
					args: [nftId, name]
				});
			},

			/**
			 * Approve staking wallet to manage all your NFTs
			 *
			 * @param operator - Staking wallet address
			 * @param approved - True to approve, false to revoke
			 */
			setApprovalForAll: (operator: Address, approved: boolean) => {
				return writeContract({
					...contractConfig,
					functionName: 'setApprovalForAll',
					args: [operator, approved]
				});
			},

			/**
			 * Transfer NFT
			 */
			transfer: (from: Address, to: Address, tokenId: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'transferFrom',
					args: [from, to, tokenId]
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
 * Hook for RandomWalk NFT operations
 */
export function useRandomWalkNFT() {
	const { address: userAddress } = useAccount();
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = {
		address: CONTRACTS.RANDOM_WALK_NFT,
		abi: [
			// Minimal ABI - only what we need
			{
				name: 'mint',
				type: 'function',
				stateMutability: 'payable',
				inputs: [],
				outputs: []
			},
			{
				name: 'getMintPrice',
				type: 'function',
				stateMutability: 'view',
				inputs: [],
				outputs: [{ type: 'uint256' }]
			},
			{
				name: 'walletOfOwner',
				type: 'function',
				stateMutability: 'view',
				inputs: [{ type: 'address' }],
				outputs: [{ type: 'uint256[]' }]
			},
			{
				name: 'ownerOf',
				type: 'function',
				stateMutability: 'view',
				inputs: [{ type: 'uint256' }],
				outputs: [{ type: 'address' }]
			},
			{
				name: 'balanceOf',
				type: 'function',
				stateMutability: 'view',
				inputs: [{ type: 'address' }],
				outputs: [{ type: 'uint256' }]
			},
			{
				name: 'setApprovalForAll',
				type: 'function',
				stateMutability: 'nonpayable',
				inputs: [
					{ type: 'address', name: 'operator' },
					{ type: 'bool', name: 'approved' }
				],
				outputs: []
			},
			{
				name: 'isApprovedForAll',
				type: 'function',
				stateMutability: 'view',
				inputs: [
					{ type: 'address', name: 'owner' },
					{ type: 'address', name: 'operator' }
				],
				outputs: [{ type: 'bool' }]
			}
		]
	} as const;

	return {
		/**
		 * Read operations
		 */
		read: {
			/**
			 * Get current mint price
			 */
			useMintPrice: () =>
				useReadContract({
					...contractConfig,
					functionName: 'getMintPrice'
				}),

			/**
			 * Get all NFT IDs owned by a user
			 */
			useWalletOfOwner: (address?: Address) =>
				useReadContract({
					...contractConfig,
					functionName: 'walletOfOwner',
					args: [address || userAddress!],
					query: {
						enabled: !!address || !!userAddress
					}
				}),

			/**
			 * Get NFT owner
			 */
			useOwner: (tokenId: bigint) =>
				useReadContract({
					...contractConfig,
					functionName: 'ownerOf',
					args: [tokenId]
				}),

			/**
			 * Get user's RandomWalk NFT balance
			 */
			useBalance: (address?: Address) =>
				useReadContract({
					...contractConfig,
					functionName: 'balanceOf',
					args: [address || userAddress!],
					query: {
						enabled: !!address || !!userAddress
					}
				}),

			/**
			 * Check if approved for all
			 */
			useIsApprovedForAll: (owner: Address, operator: Address) =>
				useReadContract({
					...contractConfig,
					functionName: 'isApprovedForAll',
					args: [owner, operator]
				})
		},

		/**
		 * Write operations
		 */
		write: {
			/**
			 * Mint a RandomWalk NFT
			 *
			 * @param value - ETH amount (should be getMintPrice() + buffer)
			 */
			mint: (value: bigint) => {
				return writeContract({
					...contractConfig,
					functionName: 'mint',
					value
				});
			},

			/**
			 * Approve staking wallet
			 */
			setApprovalForAll: (operator: Address, approved: boolean) => {
				return writeContract({
					...contractConfig,
					functionName: 'setApprovalForAll',
					args: [operator, approved]
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
