'use client';

/**
 * System Mode Context
 *
 * Provides global access to the system's current operational mode and
 * historical round activation data fetched from get_system_modelist API.
 *
 * Modes:
 *   0 — Normal operation
 *   1 — Maintenance pending (triggered after next prize claim)
 *   2 — Active maintenance mode
 *
 * Note: The on-chain systemMode() function is not in the current ABI.
 * The current mode is exposed as 0 (normal) by default. To enable live
 * mode reading, wire up a useReadContract call once the ABI exposes it.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import api from '@/services/api';
import { reportError } from '@/lib/errorReporter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemModeChange {
  RoundNum: number;
  EvtLogId: number | string;
  NextEvtLogId: number | string;
  TimeStamp: number;
}

interface SystemModeContextValue {
  /** 0 = normal, 1 = maintenance pending, 2 = maintenance active */
  currentMode: number;
  /** Full list of round activations / system-mode changes from the API */
  modeList: SystemModeChange[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SystemModeContext = createContext<SystemModeContextValue | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SystemModeProviderProps {
  children: ReactNode;
  /** Auto-refresh interval in ms (default: 60 000 ms = 1 minute) */
  refreshInterval?: number;
}

export function SystemModeProvider({
  children,
  refreshInterval = 60_000,
}: SystemModeProviderProps) {
  const [currentMode] = useState(0);
  const [modeList, setModeList] = useState<SystemModeChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = (await api.getSystemModeList()) as unknown as SystemModeChange[];
      setModeList(Array.isArray(list) ? list : []);

      // Future: derive currentMode from contract read.
      // For now the contract ABI does not expose systemMode(), so we leave it
      // at 0 (normal operation). Uncomment below once available:
      //
      // const result = await publicClient.readContract({
      //   address: COSMIC_GAME_ADDRESS,
      //   abi: CosmicGameABI,
      //   functionName: 'systemMode',
      // });
      // setCurrentMode(Number(result));
    } catch (err) {
      reportError(err, 'SystemMode.fetchData');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic refresh (only when tab is visible)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    }, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  const value = useMemo<SystemModeContextValue>(
    () => ({ currentMode, modeList, isLoading, refresh: fetchData }),
    [currentMode, modeList, isLoading, fetchData]
  );

  return (
    <SystemModeContext.Provider value={value}>
      {children}
    </SystemModeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSystemMode() {
  const ctx = useContext(SystemModeContext);
  if (!ctx) {
    throw new Error('useSystemMode must be used inside <SystemModeProvider>');
  }
  return ctx;
}
