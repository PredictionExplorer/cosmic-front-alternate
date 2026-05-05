/**
 * Cosmic Signature NFT Contract Hook
 *
 * Provides access to the CosmicSignatureNft (ERC-721) contract.
 * Handles NFT metadata, ownership, transfers, and name customization.
 */

'use client';

import {
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
	useAccount,
} from 'wagmi';
import { Address, zeroAddress } from 'viem';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { defaultChain } from '@/lib/web3/chains';
import CosmicSignatureNFTABI from '@/contracts/CosmicSignature.json';

/**
 * Hook for Cosmic Signature NFT operations
 */
export function useCosmicSignatureNFT() {
	const { address: userAddress } = useAccount();
	const contracts = useContractAddresses();
	const nftAddr = contracts?.COSMIC_SIGNATURE_NFT ?? zeroAddress;
	const hasAddr = !!contracts?.COSMIC_SIGNATURE_NFT;

	const writeConfig = contracts?.COSMIC_SIGNATURE_NFT
		? ({
				address: contracts.COSMIC_SIGNATURE_NFT,
				abi: CosmicSignatureNFTABI,
				chainId: defaultChain.id,
			} as const)
		: null;

	const requireNftConfig = () => {
		if (!writeConfig) {
			throw new Error('Cosmic Signature NFT address not loaded from the API yet.');
		}
		return writeConfig;
	};

	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const baseRead = {
		address: nftAddr,
		abi: CosmicSignatureNFTABI,
		chainId: defaultChain.id,
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
					...baseRead,
					functionName: 'getNftMetaData',
					args: [nftId],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get NFT custom name
			 */
			useName: (nftId: bigint) =>
				useReadContract({
					...baseRead,
					functionName: 'getNftName',
					args: [nftId],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get NFT seed (for image generation)
			 */
			useSeed: (nftId: bigint) =>
				useReadContract({
					...baseRead,
					functionName: 'getNftSeed',
					args: [nftId],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get NFT owner
			 */
			useOwner: (nftId: bigint) =>
				useReadContract({
					...baseRead,
					functionName: 'ownerOf',
					args: [nftId],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get user's NFT balance
			 */
			useBalance: (address?: Address) =>
				useReadContract({
					...baseRead,
					functionName: 'balanceOf',
					args: [address || userAddress!],
					query: {
						enabled: hasAddr && (!!address || !!userAddress),
					},
				}),

			/**
			 * Get NFT ID by index for a user
			 */
			useTokenOfOwnerByIndex: (address: Address, index: bigint) =>
				useReadContract({
					...baseRead,
					functionName: 'tokenOfOwnerByIndex',
					args: [address, index],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get total supply of NFTs
			 */
			useTotalSupply: () =>
				useReadContract({
					...baseRead,
					functionName: 'totalSupply',
					query: { enabled: hasAddr },
				}),

			/**
			 * Check if address is approved for all
			 */
			useIsApprovedForAll: (owner: Address, operator: Address) =>
				useReadContract({
					...baseRead,
					functionName: 'isApprovedForAll',
					args: [owner, operator],
					query: { enabled: hasAddr },
				}),

			/**
			 * Get token URI (metadata URL)
			 */
			useTokenURI: (nftId: bigint) =>
				useReadContract({
					...baseRead,
					functionName: 'tokenURI',
					args: [nftId],
					query: { enabled: hasAddr },
				}),
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
					...requireNftConfig(),
					functionName: 'setNftName',
					args: [nftId, name],
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
					...requireNftConfig(),
					functionName: 'setApprovalForAll',
					args: [operator, approved],
				});
			},

			/**
			 * Transfer NFT
			 */
			transfer: (from: Address, to: Address, tokenId: bigint) => {
				return writeContract({
					...requireNftConfig(),
					functionName: 'transferFrom',
					args: [from, to, tokenId],
				});
			},
		},

		/**
		 * Transaction status
		 */
		status: {
			hash,
			isPending,
			isConfirming,
			isSuccess,
			error,
		},
	};
}
