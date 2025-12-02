/**
 * Charity Wallet Contract Hook
 *
 * Provides typed access to the CharityWallet contract.
 * Used to fetch the charity address where donations are sent.
 */

'use client';

import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import CharityWalletABI from '@/contracts/CharityWallet.json';

/**
 * Hook for reading from the Charity Wallet contract
 */
export function useCharityWalletRead() {
	const contractConfig = {
		address: CONTRACTS.CHARITY_WALLET,
		abi: CharityWalletABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Get the charity address
		 */
		useCharityAddress: () =>
			useReadContract({
				...contractConfig,
				functionName: 'charityAddress'
			})
	};
}

/**
 * Main hook export for charity wallet operations
 */
export function useCharityWallet() {
	return useCharityWalletRead();
}

