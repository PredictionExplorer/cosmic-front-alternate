/**
 * Random Walk NFT Hook
 *
 * Provides read and write functionality for RandomWalk NFT contract.
 * Address comes from dashboard API (`ContractAddrs.RandomWalkAddr`).
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { zeroAddress } from 'viem';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import RandomWalkNFTABI from '@/contracts/RandomWalkNFT.json';

export function useRandomWalkNFT() {
	const chainId = useChainId();
	const contracts = useContractAddresses();
	const contractAddress = contracts?.RANDOM_WALK_NFT ?? zeroAddress;
	const hasAddr = !!contracts?.RANDOM_WALK_NFT;

	const useWalletOfOwner = (ownerAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'walletOfOwner',
			args: ownerAddress ? [ownerAddress] : undefined,
			query: {
				enabled: !!ownerAddress && hasAddr,
				retry: 1,
			},
		});
	};

	const useBalanceOf = (ownerAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'balanceOf',
			args: ownerAddress ? [ownerAddress] : undefined,
			query: {
				enabled: !!ownerAddress && hasAddr,
			},
		});
	};

	const useTokenOfOwnerByIndex = (ownerAddress?: `0x${string}`, index?: number) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'tokenOfOwnerByIndex',
			args: ownerAddress && index !== undefined ? [ownerAddress, BigInt(index)] : undefined,
			query: {
				enabled: !!ownerAddress && index !== undefined && hasAddr,
			},
		});
	};

	const useOwnerOf = (tokenId?: bigint) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'ownerOf',
			args: tokenId !== undefined ? [tokenId] : undefined,
			query: {
				enabled: tokenId !== undefined && hasAddr,
			},
		});
	};

	const useTokenName = (tokenId?: bigint) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'tokenNames',
			args: tokenId !== undefined ? [tokenId] : undefined,
			query: {
				enabled: tokenId !== undefined && hasAddr,
			},
		});
	};

	const useIsApprovedForAll = (ownerAddress?: `0x${string}`, operatorAddress?: `0x${string}`) => {
		return useReadContract({
			address: contractAddress,
			abi: RandomWalkNFTABI,
			functionName: 'isApprovedForAll',
			args: ownerAddress && operatorAddress ? [ownerAddress, operatorAddress] : undefined,
			query: {
				enabled: !!ownerAddress && !!operatorAddress && hasAddr,
			},
		});
	};

	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = contracts?.RANDOM_WALK_NFT
		? ({
				address: contracts.RANDOM_WALK_NFT,
				abi: RandomWalkNFTABI,
				chainId,
			} as const)
		: null;

	return {
		contractAddress: contracts?.RANDOM_WALK_NFT ?? contractAddress,

		read: {
			useWalletOfOwner,
			useBalanceOf,
			useTokenOfOwnerByIndex,
			useOwnerOf,
			useTokenName,
			useIsApprovedForAll,
		},

		write: {
			setApprovalForAll: (operator: `0x${string}`, approved: boolean) => {
				if (!contractConfig) {
					throw new Error('RandomWalk NFT contract address not loaded from the API yet.');
				}
				return writeContract({
					...contractConfig,
					functionName: 'setApprovalForAll',
					args: [operator, approved],
				});
			},
		},

		status: {
			hash,
			isPending,
			isConfirming,
			isSuccess,
			error,
		},
	};
}
