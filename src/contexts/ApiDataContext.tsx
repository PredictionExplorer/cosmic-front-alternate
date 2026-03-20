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

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import api from '@/services/api';
import type { ApiDashboardData as DashboardData } from '@/services/apiTypes';
import { validateDashboard } from '@/services/apiValidators';
import { reportError } from '@/lib/errorReporter';

/**
 * Parse the ActivationTime field from the dashboard API response.
 * The backend sends this as a Unix timestamp (number), an ISO date string,
 * "0", or an empty string. We normalize it to a Unix timestamp in seconds
 * or `null` if the round is already active.
 */
export function parseActivationTime(val: unknown): number | null {
	if (val == null || val === "" || val === "0" || val === 0) return null;
	if (typeof val === "number") return val;
	const num = Number(val);
	if (!isNaN(num) && num > 1_000_000_000) return num;
	if (typeof val === "string") {
		const parsed = new Date(val).getTime();
		if (!isNaN(parsed)) return Math.floor(parsed / 1000);
	}
	return null;
}

/**
 * Validate and normalize the raw dashboard API response. This is the single
 * place where the dashboard shape is checked and any backend quirks (e.g.
 * mixed ActivationTime formats) are resolved.
 */
function normalizeDashboard(raw: Record<string, unknown>): DashboardData {
	const data = validateDashboard(raw);

	if (data.CurRoundStats) {
		(data.CurRoundStats as unknown as Record<string, unknown>)._activationTimestamp =
			parseActivationTime(data.CurRoundStats.ActivationTime);
	}

	return data;
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
	 * After we have dashboard data once, background polls should not flip `isLoading` — otherwise
	 * pages like /contracts (which gate the whole UI on `isLoading`) flash every refreshInterval.
	 */
	const hasDashboardDataRef = useRef(false);

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
			// Only show global loading before the first successful dashboard load
			if (!hasDashboardDataRef.current) {
				setIsLoading(true);
			}
			setError(null);

			const raw = await api.getDashboardInfo();
			const normalized = normalizeDashboard(raw as unknown as Record<string, unknown>);
			setDashboardData(normalized);
			hasDashboardDataRef.current = true;
			setLastUpdated(Date.now());
		} catch (err) {
			reportError(err, 'ApiDataContext.fetchData');
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

	const value: ApiDataContextValue = useMemo(() => ({
		dashboardData,
		isLoading,
		error,
		refresh: fetchData,
		lastUpdated
	}), [dashboardData, isLoading, error, fetchData, lastUpdated]);

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
