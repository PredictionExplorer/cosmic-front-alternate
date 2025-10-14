/**
 * Prizes Wallet Contract Hook
 *
 * Provides access to the PrizesWallet contract for claiming prizes.
 * Handles ETH prizes, donated NFTs, and donated ERC-20 tokens.
 */

'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import PrizesWalletABI from '@/contracts/PrizesWallet.json';

/**
 * Hook for reading from Prizes Wallet
 */
export function usePrizesWalletRead() {
	const contractConfig = {
		address: CONTRACTS.PRIZES_WALLET,
		abi: PrizesWalletABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Get user's ETH balance in prizes wallet
		 */
		useEthBalance: (address?: Address) =>
			useReadContract({
				...contractConfig,
				functionName: address ? 'getEthBalanceInfo' : 'getEthBalanceInfo',
				args: address ? [address] : undefined
			}),

		/**
		 * Get donated token balance amount
		 */
		useDonatedTokenBalance: (roundNum: bigint, tokenAddress: Address) =>
			useReadContract({
				...contractConfig,
				functionName: 'getDonatedTokenBalanceAmount',
				args: [roundNum, tokenAddress]
			}),

		/**
		 * Get donated NFT info
		 */
		useDonatedNft: (index: bigint) =>
			useReadContract({
				...contractConfig,
				functionName: 'donatedNfts',
				args: [index]
			}),

		/**
		 * Get main prize beneficiary for a round
		 */
		useMainPrizeBeneficiary: (roundNum: bigint) =>
			useReadContract({
				...contractConfig,
				functionName: 'mainPrizeBeneficiaryAddresses',
				args: [roundNum]
			}),

		/**
		 * Get round timeout time
		 */
		useRoundTimeout: (roundNum: bigint) =>
			useReadContract({
				...contractConfig,
				functionName: 'roundTimeoutTimesToWithdrawPrizes',
				args: [roundNum]
			})
	};
}

/**
 * Hook for writing to Prizes Wallet
 */
export function usePrizesWalletWrite() {
	const { data: hash, writeContract, isPending, error } = useWriteContract();
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	const contractConfig = {
		address: CONTRACTS.PRIZES_WALLET,
		abi: PrizesWalletABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Withdraw your ETH prizes
		 */
		withdrawEth: () => {
			return writeContract({
				...contractConfig,
				functionName: 'withdrawEth'
			});
		},

		/**
		 * Withdraw ETH for someone else (after timeout)
		 */
		withdrawEthFor: (address: Address) => {
			return writeContract({
				...contractConfig,
				functionName: 'withdrawEth',
				args: [address]
			});
		},

		/**
		 * Claim a donated NFT
		 */
		claimDonatedNft: (index: bigint) => {
			return writeContract({
				...contractConfig,
				functionName: 'claimDonatedNft',
				args: [index]
			});
		},

		/**
		 * Claim multiple donated NFTs
		 */
		claimManyDonatedNfts: (indexes: bigint[]) => {
			return writeContract({
				...contractConfig,
				functionName: 'claimManyDonatedNfts',
				args: [indexes]
			});
		},

		/**
		 * Claim a donated ERC-20 token
		 */
		claimDonatedToken: (roundNum: bigint, tokenAddress: Address, amount: bigint) => {
			return writeContract({
				...contractConfig,
				functionName: 'claimDonatedToken',
				args: [roundNum, tokenAddress, amount]
			});
		},

		/**
		 * Claim multiple donated ERC-20 tokens
		 */
		claimManyDonatedTokens: (
			tokens: Array<{
				roundNum: bigint;
				tokenAddress: Address;
				amount: bigint;
			}>
		) => {
			return writeContract({
				...contractConfig,
				functionName: 'claimManyDonatedTokens',
				args: [tokens]
			});
		},

		/**
		 * Withdraw everything (ETH + tokens + NFTs) in one transaction
		 */
		withdrawEverything: (
			withdrawEth: boolean,
			donatedTokens: Array<{ roundNum: bigint; tokenAddress: Address; amount: bigint }>,
			donatedNftIndexes: bigint[]
		) => {
			return writeContract({
				...contractConfig,
				functionName: 'withdrawEverything',
				args: [withdrawEth, donatedTokens, donatedNftIndexes]
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
export function usePrizesWallet() {
	const read = usePrizesWalletRead();
	const write = usePrizesWalletWrite();

	return {
		read,
		write,
		isTransactionPending: write.status.isPending || write.status.isConfirming,
		transactionHash: write.status.hash,
		transactionError: write.status.error
	};
}
