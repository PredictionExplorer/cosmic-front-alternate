/**
 * Time Offset Context
 *
 * Manages timestamp offset between server and local time.
 * Only applies to local testnet (Chain ID: 31337) to sync with blockchain time.
 *
 * Background:
 * On local testnet, the blockchain time may differ from system time
 * due to hardhat's time manipulation features. This context fetches
 * the server's blockchain time and calculates the offset to ensure
 * countdowns and timestamps display correctly.
 */

'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useChainId } from 'wagmi';
import api from '@/services/api';

/**
 * Time offset value in milliseconds
 */
interface TimeOffsetContextValue {
	/** Offset in milliseconds between server time and local time */
	offset: number;
	/** Whether the offset has been fetched */
	isReady: boolean;
	/** Manually refresh the offset */
	refresh: () => Promise<void>;
	/** Apply offset to a timestamp (in seconds) */
	applyOffset: (timestamp: number) => number;
}

/**
 * Create context
 */
const TimeOffsetContext = createContext<TimeOffsetContextValue | undefined>(undefined);

/**
 * Time Offset Provider Props
 */
interface TimeOffsetProviderProps {
	children: ReactNode;
	/** Auto-refresh interval in milliseconds (default: 60000 = 1 minute) */
	refreshInterval?: number;
}

/**
 * Time Offset Provider Component
 *
 * Fetches server time and calculates offset for local testnet only.
 * For other networks, offset is always 0.
 *
 * @example
 * ```tsx
 * <TimeOffsetProvider>
 *   <YourApp />
 * </TimeOffsetProvider>
 * ```
 */
export function TimeOffsetProvider({ children, refreshInterval = 60000 }: TimeOffsetProviderProps) {
	const chainId = useChainId();
	const [offset, setOffset] = useState(0);
	const [isReady, setIsReady] = useState(false);

	/**
	 * Check if we should use offset (only for local testnet)
	 */
	const shouldUseOffset = chainId === 31337;

	/**
	 * Fetch server time and calculate offset
	 */
	const fetchOffset = useCallback(async () => {
		// Only fetch offset for local testnet
		if (!shouldUseOffset) {
			setOffset(0);
			setIsReady(true);
			return;
		}

		try {
			const serverTime = await api.getCurrentTime();
			if (serverTime && typeof serverTime === 'number') {
				// Server returns timestamp in seconds, convert to milliseconds
				const serverTimeMs = serverTime * 1000;
				const localTimeMs = Date.now();
				const calculatedOffset = serverTimeMs - localTimeMs;
				
				setOffset(calculatedOffset);
				
				if (process.env.NODE_ENV === 'development') {
					console.log('[TimeOffset] Server time:', new Date(serverTimeMs).toISOString());
					console.log('[TimeOffset] Local time:', new Date(localTimeMs).toISOString());
					console.log('[TimeOffset] Offset:', calculatedOffset, 'ms');
				}
			}
		} catch (error) {
			console.error('[TimeOffset] Failed to fetch server time:', error);
			// On error, use 0 offset
			setOffset(0);
		} finally {
			setIsReady(true);
		}
	}, [shouldUseOffset]);

	/**
	 * Initial fetch on mount and when chainId changes
	 */
	useEffect(() => {
		fetchOffset();
	}, [fetchOffset]);

	/**
	 * Auto-refresh offset
	 */
	useEffect(() => {
		if (!shouldUseOffset) return;

		const interval = setInterval(() => {
			// Only refresh if page is visible
			if (document.visibilityState === 'visible') {
				fetchOffset();
			}
		}, refreshInterval);

		return () => clearInterval(interval);
	}, [shouldUseOffset, refreshInterval, fetchOffset]);

	/**
	 * Apply offset to a timestamp (in seconds)
	 * Returns adjusted timestamp in seconds
	 */
	const applyOffset = useCallback((timestamp: number): number => {
		if (!shouldUseOffset || offset === 0) {
			return timestamp;
		}
		// Convert offset from ms to seconds and subtract from timestamp
		return timestamp - (offset / 1000);
	}, [offset, shouldUseOffset]);

	const value: TimeOffsetContextValue = {
		offset,
		isReady,
		refresh: fetchOffset,
		applyOffset
	};

	return <TimeOffsetContext.Provider value={value}>{children}</TimeOffsetContext.Provider>;
}

/**
 * Hook to use time offset
 * 
 * @throws Error if used outside TimeOffsetProvider
 * 
 * @example
 * ```tsx
 * const { offset, applyOffset } = useTimeOffset();
 * 
 * // Apply to server timestamp (in seconds)
 * const adjustedTime = applyOffset(serverTimestamp);
 * 
 * // Use for countdown
 * const timeRemaining = adjustedTime - Math.floor(Date.now() / 1000);
 * ```
 */
export function useTimeOffset() {
	const context = useContext(TimeOffsetContext);
	if (!context) {
		throw new Error('useTimeOffset must be used within TimeOffsetProvider');
	}
	return context;
}

