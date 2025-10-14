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
import { AlertTriangle, Network, Loader2 } from "lucide-react";
import { useNetworkSwitch } from "@/hooks/useNetworkSwitch";
import { defaultChain } from "@/lib/web3/chains";
import { Button } from "@/components/ui/Button";

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
  const {
    isCorrectNetwork,
    isSwitching,
    error,
    switchToRequiredNetwork,
    isConnected,
  } = useNetworkSwitch();
  
  const [isVisible, setIsVisible] = useState(false);
  
  // Show modal when user is connected but on wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isConnected, isCorrectNetwork]);
  
  // Auto-trigger network switch on first detection
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && !isSwitching && !error) {
      // Small delay to ensure wallet is ready
      const timer = setTimeout(() => {
        switchToRequiredNetwork();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isCorrectNetwork, isSwitching, error, switchToRequiredNetwork]);
  
  if (!isVisible) {
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
                  Click below to switch or add the network.
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
          
          {/* Help Text */}
          <p className="mt-4 text-center text-xs text-text-muted">
            {isSwitching ? (
              "This may take a few seconds..."
            ) : (
              <>
                If you don&apos;t have this network, it will be added automatically.
                <br />
                You can also add it manually in MetaMask settings.
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

