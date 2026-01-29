/**
 * API Data Context
 *
 * Provides global access to frequently-used API data.
 * Implements caching and automatic refresh for real-time updates.
 *
 * Data managed:
 * - Dashboard info (current round, stats)
 * - User info (when wallet connected)
 * - System status
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import api from '@/services/api';

/**
 * Dashboard data type (simplified - expand as needed)
 */
interface DashboardData {
	CurRoundNum: number;
	LastBidderAddr: string;
	BidPriceEth: number;
	PrizeAmountEth: number;
	CosmicGameBalanceEth: number;
	CurNumBids: number;
	MainStats: Record<string, unknown>;
	// Prize percentages
	PrizePercentage: number;
	ChronoWarriorPercentage: number;
	RafflePercentage: number;
	StakignPercentage: number; // Note: Typo in API field name
	CharityPercentage: number;
	// Raffle configuration
	NumRaffleEthWinnersBidding: number;
	NumRaffleNFTWinnersBidding: number;
	NumRaffleNFTWinnersStakingRWalk: number;
	RaffleAmountEth: number;
	// Game configuration
	InitialSecondsUntilPrize: number;
	TimeoutClaimPrize: number;
	// Round activation
	RoundStartTime?: number;
	RoundStartTimeStamp?: number;
	ActivationTime?: number;
	// Add more fields as needed based on API response
	[key: string]: unknown;
}

/**
 * Context value type
 */
interface ApiDataContextValue {
	dashboardData: DashboardData | null;
	isLoading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	lastUpdated: number | null;
}

/**
 * Create context
 */
const ApiDataContext = createContext<ApiDataContextValue | undefined>(undefined);

/**
 * API Data Provider Props
 */
interface ApiDataProviderProps {
	children: ReactNode;
	/** Auto-refresh interval in milliseconds (default: 15000 = 15 seconds) */
	refreshInterval?: number;
	/** Enable auto-refresh (default: true) */
	autoRefresh?: boolean;
}

/**
 * API Data Provider Component
 *
 * Fetches and caches frequently-used API data.
 * Automatically refreshes data at specified intervals.
 * Pauses refresh when page is not visible (performance optimization).
 *
 * @example
 * ```tsx
 * <ApiDataProvider refreshInterval={15000}>
 *   <YourApp />
 * </ApiDataProvider>
 * ```
 */
export function ApiDataProvider({ children, refreshInterval = 15000, autoRefresh = true }: ApiDataProviderProps) {
	const { address } = useAccount();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<number | null>(null);

	/**
	 * Track last fetch time to prevent rapid re-fetches (using ref to avoid dependency issues)
	 */
	const lastFetchTimeRef = useRef(0);

	/**
	 * Fetch dashboard data
	 */
	const fetchData = useCallback(async () => {
		// Prevent fetching more than once per second to avoid overload
		const now = Date.now();
		if (now - lastFetchTimeRef.current < 1000) {
			console.log('[ApiData] Skipping fetch - too soon since last fetch');
			return;
		}

		try {
			lastFetchTimeRef.current = now;
			setIsLoading(true);
			setError(null);

			const data = await api.getDashboardInfo();
			setDashboardData(data);
			setLastUpdated(Date.now());
		} catch (err) {
			console.error('Failed to fetch dashboard data:', err);
			const error = err as Error;
			setError(error.message || 'Failed to fetch data');
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Initial fetch on mount
	 */
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	/**
	 * Auto-refresh with visibility check
	 */
	useEffect(() => {
		if (!autoRefresh) return;

		const interval = setInterval(() => {
			// Only refresh if page is visible (performance optimization)
			if (document.visibilityState === 'visible') {
				fetchData();
			}
		}, refreshInterval);

		return () => clearInterval(interval);
	}, [autoRefresh, refreshInterval, fetchData]);

	/**
	 * Refresh when wallet connects/disconnects
	 */
	useEffect(() => {
		if (address) {
			fetchData();
		}
	}, [address, fetchData]);

	const value: ApiDataContextValue = {
		dashboardData,
		isLoading,
		error,
		refresh: fetchData,
		lastUpdated
	};

	return <ApiDataContext.Provider value={value}>{children}</ApiDataContext.Provider>;
}

/**
 * Hook to use API data
 */
export function useApiData() {
	const context = useContext(ApiDataContext);
	if (!context) {
		throw new Error('useApiData must be used within ApiDataProvider');
	}
	return context;
}
