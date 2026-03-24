/**
 * Network Switch Guard Component
 * 
 * Displays a modal prompting users to switch to the required network
 * when they're connected to the wrong network.
 * 
 * Automatically adds the network to MetaMask if it doesn't exist.
 */

"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AlertTriangle, Network, Loader2 } from "lucide-react";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { defaultChain } from "@/lib/web3/chains";
import { Button } from "@/components/ui/Button";
import { nsDebug } from "@/lib/networkSwitchDebug";

const SESSION_BYPASS_KEY = "cosmic-network-guard-bypass";

/**
 * NetworkSwitchGuard Component
 * 
 * Monitors the connected network and displays a modal if the user
 * needs to switch to the required network. This component should be
 * placed in the root layout to ensure it's always active.
 * 
 * Features:
 * - Automatically detects wrong network
 * - One-click network switching
 * - Adds network to MetaMask if not present
 * - Beautiful modal with glassmorphism effects
 * - Cannot be dismissed (blocks interaction)
 * 
 * @example
 * ```tsx
 * <Web3Provider>
 *   <NetworkSwitchGuard />
 *   <YourApp />
 * </Web3Provider>
 * ```
 */
export function NetworkSwitchGuard() {
  const { status } = useAccount();
  const {
    shouldShowSwitchModal,
    isSwitching,
    error,
    switchToRequiredNetwork,
    reportedChainId,
    isLocalNetworkEnv,
  } = useNetworkSwitch();

  /** Local dev escape hatch: fullscreen guard traps you — allow hiding for this tab session. */
  const [sessionBypass, setSessionBypass] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_BYPASS_KEY) === "1") {
        setSessionBypass(true);
      }
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (status === "disconnected") {
      try {
        sessionStorage.removeItem(SESSION_BYPASS_KEY);
      } catch {
        /* ignore */
      }
      setSessionBypass(false);
    }
  }, [status]);

  useEffect(() => {
    nsDebug("NetworkSwitchGuard render decision", {
      shouldShowSwitchModal,
      sessionBypass,
      modalVisible: shouldShowSwitchModal && !sessionBypass,
      reportedChainId,
      isLocalNetworkEnv,
    });
  }, [
    shouldShowSwitchModal,
    sessionBypass,
    reportedChainId,
    isLocalNetworkEnv,
  ]);

  const dismissForSession = () => {
    nsDebug("user clicked: Dismiss for this browser tab (session bypass)");
    try {
      sessionStorage.setItem(SESSION_BYPASS_KEY, "1");
    } catch {
      /* ignore */
    }
    setSessionBypass(true);
  };

  // Wrong chain + stable "connected" session (not mid-reconnect / HMR).
  if (!shouldShowSwitchModal || sessionBypass) {
    return null;
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-status-warning/30 bg-gradient-to-br from-background-surface via-background-elevated to-background-surface p-8 shadow-luxury backdrop-blur-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-warning/10 border border-status-warning/30">
                {isSwitching ? (
                  <Loader2 className="h-8 w-8 text-status-warning animate-spin" />
                ) : (
                  <Network className="h-8 w-8 text-status-warning" />
                )}
              </div>
              
              {!isSwitching && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-status-warning">
                  <AlertTriangle className="h-4 w-4 text-black" />
                </div>
              )}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-bold text-text-primary">
            {isSwitching ? "Switching Network..." : "Switch Network"}
          </h2>
          
          {/* Description */}
          <p className="mb-6 text-center text-text-secondary leading-relaxed">
            {isSwitching ? (
              <>
                Please confirm the network switch in your wallet.
                <br />
                <span className="text-sm text-text-muted mt-2 block">
                  If the network doesn&apos;t exist, you&apos;ll be prompted to add it.
                </span>
              </>
            ) : (
              <>
                This application requires you to connect to{" "}
                <span className="font-semibold text-primary">
                  {defaultChain.name}
                </span>
                .
                <br />
                <span className="text-sm text-text-muted mt-2 block">
                  This dialog opens automatically when your wallet is on another chain — you
                  don&apos;t open it yourself. Use the button below, or dismiss (local dev only)
                  to use the site while you fix MetaMask.
                </span>
              </>
            )}
          </p>
          
          {/* Network Details */}
          <div className="mb-6 rounded-lg border border-text-muted/10 bg-background-elevated p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Network Name:</span>
                <span className="font-mono text-text-primary">
                  {defaultChain.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Chain ID:</span>
                <span className="font-mono text-text-primary">
                  {defaultChain.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Currency:</span>
                <span className="font-mono text-text-primary">
                  {defaultChain.nativeCurrency.symbol}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-text-muted">RPC URL:</span>
                <span className="font-mono text-text-primary text-right text-xs break-all max-w-[200px]">
                  {defaultChain.rpcUrls.default.http[0]}
                </span>
              </div>
              <div className="flex justify-between border-t border-text-muted/10 pt-2 mt-2">
                <span className="text-text-muted">Wallet reports chain:</span>
                <span className="font-mono text-text-primary">
                  {reportedChainId ?? "—"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-status-error/30 bg-status-error/10 p-3">
              <p className="text-sm text-status-error">{error}</p>
            </div>
          )}
          
          {/* Action Button */}
          <Button
            size="lg"
            onClick={switchToRequiredNetwork}
            disabled={isSwitching}
            className="w-full"
          >
            {isSwitching ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Switching Network...
              </>
            ) : (
              <>
                <Network className="mr-2 h-5 w-5" />
                Switch to {defaultChain.name}
              </>
            )}
          </Button>

          {isLocalNetworkEnv && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full border-text-muted/30 text-text-muted hover:text-text-primary"
              onClick={dismissForSession}
              disabled={isSwitching}
            >
              Dismiss for this browser tab (use site; fix MetaMask in extension)
            </Button>
          )}
          
          {/* Help Text */}
          <p className="mt-4 text-center text-xs text-text-muted">
            {isSwitching ? (
              "This may take a few seconds..."
            ) : (
              <>
                The app tries to add this network automatically when you click the button.
                If the dialog keeps coming back, add it manually in MetaMask: network menu →
                Add network → Add a network manually — use the Chain ID and RPC above (symbol:{" "}
                {defaultChain.nativeCurrency.symbol}).
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

