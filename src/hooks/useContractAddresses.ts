'use client';

import { useMemo } from 'react';
import { useApiData } from '@/contexts/ApiDataContext';
import {
	contractAddressesFromDashboard,
	type CosmicContractAddresses,
} from '@/lib/web3/contractAddresses';

/**
 * All Cosmic on-chain addresses from `statistics/dashboard` → `ContractAddrs`.
 * `null` until the first successful dashboard load (or if the payload is incomplete).
 */
export function useContractAddresses(): CosmicContractAddresses | null {
	const { dashboardData } = useApiData();
	return useMemo(
		() => contractAddressesFromDashboard(dashboardData),
		[dashboardData],
	);
}
