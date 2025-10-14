/**
 * Network Switch Hook
 *
 * Provides utilities for automatic network switching to the local testnet.
 * Handles adding the network to MetaMask if it doesn't exist.
 */

"use client";

import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { defaultChain } from "@/lib/web3/chains";

interface UseNetworkSwitchReturn {
  /** Whether the user is on the correct network */
  isCorrectNetwork: boolean;
  /** Whether the network switch is in progress */
  isSwitching: boolean;
  /** Error message if switch failed */
  error: string | null;
  /** Function to trigger network switch */
  switchToRequiredNetwork: () => Promise<void>;
  /** Whether the user is connected */
  isConnected: boolean;
}

/**
 * Hook to manage network switching
 *
 * Automatically detects if the user is on the wrong network
 * and provides a function to switch to the required network.
 *
 * If the network doesn't exist in MetaMask, it will prompt
 * the user to add it using wallet_addEthereumChain.
 *
 * @example
 * ```tsx
 * const { isCorrectNetwork, switchToRequiredNetwork } = useNetworkSwitch();
 *
 * if (!isCorrectNetwork) {
 *   await switchToRequiredNetwork();
 * }
 * ```
 */
export function useNetworkSwitch(): UseNetworkSwitchReturn {
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if on correct network
  const isCorrectNetwork = currentChainId === defaultChain.id;

  /**
   * Switch to the required network (local testnet)
   * If the network doesn't exist, prompt to add it
   */
  const switchToRequiredNetwork = async () => {
    if (!isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      // Try to switch using wagmi first
      if (switchChain) {
        switchChain({ chainId: defaultChain.id });
      }
    } catch (err: unknown) {
      console.error("Error switching network with wagmi:", err);

      // If wagmi fails, try direct MetaMask interaction
      // This is needed when the network doesn't exist in the wallet
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Try to switch network
          await (window.ethereum as any).request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${defaultChain.id.toString(16)}` }],
          });

          setError(null);
        } catch (switchError: unknown) {
          // If network doesn't exist (error code 4902), add it
          const error = switchError as { code?: number; message?: string };
          if (error.code === 4902) {
            try {
              await (window.ethereum as any).request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${defaultChain.id.toString(16)}`,
                    chainName: defaultChain.name,
                    nativeCurrency: {
                      name: defaultChain.nativeCurrency.name,
                      symbol: defaultChain.nativeCurrency.symbol,
                      decimals: defaultChain.nativeCurrency.decimals,
                    },
                    rpcUrls: [defaultChain.rpcUrls.default.http[0]],
                    blockExplorerUrls: defaultChain.blockExplorers?.default?.url
                      ? [defaultChain.blockExplorers.default.url]
                      : undefined,
                  },
                ],
              });

              setError(null);
            } catch (addError: unknown) {
              console.error("Error adding network:", addError);
              const error = addError as { message?: string };
              setError(
                error.message ||
                  "Failed to add network. Please add it manually in MetaMask."
              );
            }
          } else {
            console.error("Error switching network:", switchError);
            const error = switchError as { message?: string };
            setError(
              error.message ||
                "Failed to switch network. Please switch manually in MetaMask."
            );
          }
        }
      } else {
        setError("MetaMask not detected. Please install MetaMask.");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    isCorrectNetwork,
    isSwitching: isSwitching || isPending,
    error,
    switchToRequiredNetwork,
    isConnected,
  };
}
