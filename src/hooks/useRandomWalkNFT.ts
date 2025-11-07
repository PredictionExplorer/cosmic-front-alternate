/**
 * Random Walk NFT Hook
 * 
 * Provides read and write functionality for RandomWalk NFT contract
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddresses } from '@/lib/web3/contracts';
import { useChainId } from 'wagmi';
import RandomWalkNFTABI from '@/contracts/RandomWalkNFT.json';
import { defaultChain } from '@/lib/web3/chains';

export function useRandomWalkNFT() {
	const chainId = useChainId();
	const contractAddress = getContractAddresses(chainId).RANDOM_WALK_NFT;

	/**
	 * Get all NFT token IDs owned by a specific address
	 */
	const useWalletOfOwner = (ownerAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'walletOfOwner',
			args: ownerAddress ? [ownerAddress] : undefined,
			query: {
				enabled: !!ownerAddress,
			}
		});
	};

	/**
	 * Get balance (number of NFTs owned) by address
	 */
	const useBalanceOf = (ownerAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'balanceOf',
			args: ownerAddress ? [ownerAddress] : undefined,
			query: {
				enabled: !!ownerAddress,
			}
		});
	};

	/**
	 * Get token ID at specific index for owner
	 */
	const useTokenOfOwnerByIndex = (ownerAddress?: `0x${string}`, index?: number) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'tokenOfOwnerByIndex',
			args: ownerAddress && index !== undefined ? [ownerAddress, BigInt(index)] : undefined,
			query: {
				enabled: !!ownerAddress && index !== undefined,
			}
		});
	};

	/**
	 * Get owner of a specific token
	 */
	const useOwnerOf = (tokenId?: bigint) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'ownerOf',
			args: tokenId !== undefined ? [tokenId] : undefined,
			query: {
				enabled: tokenId !== undefined,
			}
		});
	};

	/**
	 * Get token name
	 */
	const useTokenName = (tokenId?: bigint) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'tokenNames',
			args: tokenId !== undefined ? [tokenId] : undefined,
			query: {
				enabled: tokenId !== undefined,
			}
		});
	};

	/**
	 * Check if operator is approved for all tokens of owner
	 */
	const useIsApprovedForAll = (ownerAddress?: `0x${string}`, operatorAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'isApprovedForAll',
			args: ownerAddress && operatorAddress ? [ownerAddress, operatorAddress] : undefined,
			query: {
				enabled: !!ownerAddress && !!operatorAddress,
			}
		});
	};

	// Write operations
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = {
		address: contractAddress,
		abi: RandomWalkNFTABI,
		chainId: defaultChain.id
	} as const;

	return {
		// Contract info
		contractAddress,
		
		// Read hooks
		read: {
			useWalletOfOwner,
			useBalanceOf,
			useTokenOfOwnerByIndex,
			useOwnerOf,
			useTokenName,
			useIsApprovedForAll,
		},

		// Write operations
		write: {
			/**
			 * Set approval for all tokens to an operator
			 */
			setApprovalForAll: (operator: `0x${string}`, approved: boolean) => {
				return writeContract({
					...contractConfig,
					functionName: 'setApprovalForAll',
					args: [operator, approved]
				});
			}
		},

		// Transaction status
		status: {
			hash,
			isPending,
			isConfirming,
			isSuccess,
			error
		}
	};
}
