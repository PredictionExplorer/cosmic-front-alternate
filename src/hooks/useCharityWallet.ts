/**
 * Charity Wallet Contract Hook
 *
 * Provides typed access to the CharityWallet contract.
 * Used to fetch the charity address where donations are sent.
 */

'use client';

import { useReadContract } from 'wagmi';
import { zeroAddress } from 'viem';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { defaultChain } from '@/lib/web3/chains';
import CharityWalletABI from '@/contracts/CharityWallet.json';

/**
 * Hook for reading from the Charity Wallet contract
 */
export function useCharityWalletRead() {
	const contracts = useContractAddresses();
	const addr = contracts?.CHARITY_WALLET ?? zeroAddress;
	const queryEnabled = !!contracts?.CHARITY_WALLET;
	const contractConfig = {
		address: addr,
		abi: CharityWalletABI,
		chainId: defaultChain.id,
		query: { enabled: queryEnabled },
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

