/**
 * Cosmic Token Contract Hook
 *
 * Provides typed access to the CosmicToken (CST) ERC-20 contract.
 * Handles token balance queries, transfers, and allowances.
 */

'use client';

import { useReadContract, useAccount } from 'wagmi';
import { Address, formatUnits } from 'viem';
import { CONTRACTS } from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import CosmicTokenABI from '@/contracts/CosmicToken.json';

/**
 * Hook for reading from the Cosmic Token contract
 *
 * Provides read-only access to contract state.
 * Results are automatically cached and refreshed.
 */
export function useCosmicTokenRead() {
	const contractConfig = {
		address: CONTRACTS.COSMIC_SIGNATURE_TOKEN,
		abi: CosmicTokenABI,
		chainId: defaultChain.id
	} as const;

	return {
		/**
		 * Get token balance for an address
		 */
		useBalance: (address?: Address) =>
			useReadContract({
				...contractConfig,
				functionName: 'balanceOf',
				args: address ? [address] : undefined,
				query: {
					enabled: !!address
				}
			}),

		/**
		 * Get total token supply
		 */
		useTotalSupply: () =>
			useReadContract({
				...contractConfig,
				functionName: 'totalSupply'
			}),

		/**
		 * Get token allowance
		 */
		useAllowance: (owner?: Address, spender?: Address) =>
			useReadContract({
				...contractConfig,
				functionName: 'allowance',
				args: owner && spender ? [owner, spender] : undefined,
				query: {
					enabled: !!(owner && spender)
				}
			}),

		/**
		 * Get token name
		 */
		useName: () =>
			useReadContract({
				...contractConfig,
				functionName: 'name'
			}),

		/**
		 * Get token symbol
		 */
		useSymbol: () =>
			useReadContract({
				...contractConfig,
				functionName: 'symbol'
			}),

		/**
		 * Get token decimals
		 */
		useDecimals: () =>
			useReadContract({
				...contractConfig,
				functionName: 'decimals'
			})
	};
}

/**
 * Hook to get the formatted CST balance for the connected wallet
 *
 * Returns the balance formatted as a string with proper decimals.
 * Returns '0' if wallet is not connected.
 */
export function useCosmicTokenBalance() {
	const { address } = useAccount();
	const { useBalance, useDecimals } = useCosmicTokenRead();

	const { data: balance, isLoading: balanceLoading, error: balanceError } = useBalance(address);
	const { data: decimals, isLoading: decimalsLoading } = useDecimals();

	// Format balance with proper decimals
	const formattedBalance = (typeof balance === 'bigint' && typeof decimals === 'number')
		? formatUnits(balance, decimals)
		: '0';

	return {
		balance,
		formattedBalance,
		decimals: decimals || 18,
		isLoading: balanceLoading || decimalsLoading,
		error: balanceError,
		hasBalance: typeof balance === 'bigint' && balance > 0n
	};
}

/**
 * Combined hook for Cosmic Token operations
 */
export function useCosmicToken() {
	const read = useCosmicTokenRead();
	const balance = useCosmicTokenBalance();

	return {
		read,
		balance
	};
}

