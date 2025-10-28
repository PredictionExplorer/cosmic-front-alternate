/**
 * Random Walk NFT Hook
 * 
 * Provides read functionality for RandomWalk NFT contract
 */

import { useReadContract, useAccount } from 'wagmi';
import { getContractAddresses } from '@/lib/web3/contracts';
import { useChainId } from 'wagmi';
import RandomWalkNFTABI from '@/contracts/RandomWalkNFT.json';

export function useRandomWalkNFT() {
	const chainId = useChainId();
	const { address } = useAccount();
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
		}
	};
}
