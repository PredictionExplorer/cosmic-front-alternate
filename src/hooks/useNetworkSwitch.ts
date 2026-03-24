/**
 * Network Switch Hook
 *
 * Provides utilities for switching to the chain required by NEXT_PUBLIC_NETWORK.
 * Handles adding the network to the wallet when it is missing (EIP-1193 4902).
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { UserRejectedRequestError } from "viem";
import { defaultChain } from "@/lib/web3/chains";
import { getDefaultNetwork } from "@/lib/networkConfig";
import {
  nsDebug,
  nsDebugWarn,
  nsDebugError,
  nsDebugSerializeError,
} from "@/lib/networkSwitchDebug";
import { useResolvedChainId } from "@/hooks/useResolvedChainId";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/** Walk viem/wagmi error wrappers for an EIP-1193 numeric code. */
function getDeepErrorCode(err: unknown): number | undefined {
  let e: unknown = err;
  for (let depth = 0; depth < 6 && e; depth++) {
    if (typeof e === "object" && e !== null && "code" in e) {
      const c = (e as { code: unknown }).code;
      if (typeof c === "number") return c;
      if (typeof c === "string" && /^\d+$/.test(c)) return Number.parseInt(c, 10);
    }
    e =
      typeof e === "object" && e !== null && "cause" in e
        ? (e as { cause: unknown }).cause
        : undefined;
  }
  return undefined;
}

interface UseNetworkSwitchReturn {
  /** Whether the user is on the correct network */
  isCorrectNetwork: boolean;
  /** True when wallet session is fully connected (not reconnecting / HMR) */
  isWalletReady: boolean;
  /** Show the switch-network modal (wrong chain + stable connection) */
  shouldShowSwitchModal: boolean;
  /** Chain ID the app currently reads from the wallet session (for UI/debug) */
  reportedChainId: number | undefined;
  /** Whether the network switch is in progress */
  isSwitching: boolean;
  /** Error message if switch failed */
  error: string | null;
  /** Function to trigger network switch */
  switchToRequiredNetwork: () => Promise<void>;
  /** Whether the user is connected */
  isConnected: boolean;
  /** NEXT_PUBLIC_NETWORK is "local" — allow dismissible guard for dev */
  isLocalNetworkEnv: boolean;
}

/** Read chain id directly from the wallet (wagmi can lag behind MetaMask). */
async function readEthChainId(
  eth: EthereumProvider,
  label = "provider",
): Promise<number | undefined> {
  try {
    const hex = (await eth.request({ method: "eth_chainId" })) as string;
    const id = Number.parseInt(hex, 16);
    nsDebug(`eth_chainId (${label})`, { hex, chainId: id });
    return id;
  } catch (e) {
    nsDebugError(`eth_chainId failed (${label})`, nsDebugSerializeError(e));
    return undefined;
  }
}

async function addEthereumChain(ethereum: EthereumProvider): Promise<void> {
  const rpcUrl = defaultChain.rpcUrls.default.http[0];
  if (!rpcUrl) throw new Error("No RPC URL configured for this chain.");

  nsDebug("wallet_addEthereumChain request", {
    chainId: defaultChain.id,
    chainIdHex: `0x${defaultChain.id.toString(16)}`,
    rpcUrl,
    name: defaultChain.name,
  });

  const explorerUrl = defaultChain.blockExplorers?.default?.url;
  // MetaMask often rejects http:// “explorers” or RPC-looking URLs; omit unless https.
  const blockExplorerUrls =
    explorerUrl?.startsWith("https://") === true
      ? [explorerUrl]
      : undefined;

  await ethereum.request({
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
        rpcUrls: [rpcUrl],
        blockExplorerUrls,
      },
    ],
  });
  nsDebug("wallet_addEthereumChain completed OK");
}

/**
 * Injected-wallet path: switch chain, or add then (MetaMask switches after add).
 */
async function switchOrAddInjected(ethereum: EthereumProvider): Promise<void> {
  nsDebug("wallet_switchEthereumChain attempt", {
    targetChainId: defaultChain.id,
    chainIdHex: `0x${defaultChain.id.toString(16)}`,
  });
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${defaultChain.id.toString(16)}` }],
    });
    nsDebug("wallet_switchEthereumChain OK (first try)");
  } catch (switchError: unknown) {
    const code = getDeepErrorCode(switchError);
    nsDebug("wallet_switchEthereumChain threw", {
      code,
      detail: nsDebugSerializeError(switchError),
    });
    if (code === 4902) {
      nsDebug("4902 = chain not in wallet → wallet_addEthereumChain then switch again");
      await addEthereumChain(ethereum);
      // MetaMask often adds the network but leaves the *previous* chain selected until
      // wallet_switchEthereumChain runs again — wagmi never sees 31337, so the modal
      // stays. Always switch explicitly after add.
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${defaultChain.id.toString(16)}` }],
      });
      nsDebug("wallet_switchEthereumChain OK (after add)");
      return;
    }
    throw switchError;
  }
}

/**
 * Hook to manage network switching
 *
 * Detects if the user is on the wrong chain and exposes a function to switch.
 * Uses `switchChainAsync` so the wallet flow is awaited; the previous fire-and-
 * forget `switchChain()` + immediate `finally` never waited for approval, so the
 * chain often never changed and the guard modal stayed open.
 */
export function useNetworkSwitch(): UseNetworkSwitchReturn {
  const { isConnected, status, connector } = useAccount();
  const { wagmiChainId, providerChainId, resolvedChainId } = useResolvedChainId();
  const { switchChainAsync, isPending } = useSwitchChain();

  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCorrectNetwork = resolvedChainId === defaultChain.id;
  const isWalletReady = status === "connected";
  /** Avoid modal during reconnect / Fast Refresh so wagmi chain state isn’t flaky */
  const shouldShowSwitchModal = isWalletReady && !isCorrectNetwork;

  useEffect(() => {
    nsDebug("wagmi snapshot", {
      status,
      isConnected,
      useChainIdWagmi: wagmiChainId,
      useChainIdProvider: providerChainId,
      resolvedChainId,
      expectedChainId: defaultChain.id,
      chainName: defaultChain.name,
      isCorrectNetwork,
      isWalletReady,
      shouldShowSwitchModal,
      switchChainPending: isPending,
      connector: connector
        ? { id: connector.id, name: connector.name, type: connector.type }
        : null,
    });
  }, [
    status,
    isConnected,
    wagmiChainId,
    providerChainId,
    resolvedChainId,
    isCorrectNetwork,
    isWalletReady,
    shouldShowSwitchModal,
    isPending,
    connector?.id,
    connector?.name,
    connector?.type,
  ]);

  const switchToRequiredNetwork = useCallback(async () => {
    nsDebug("--- switchToRequiredNetwork() clicked ---", {
      resolvedChainId,
      expected: defaultChain.id,
    });

    if (!isConnected) {
      nsDebugWarn("aborted: not connected");
      setError("Please connect your wallet first");
      return;
    }
    if (resolvedChainId === defaultChain.id) {
      nsDebug("aborted: already on target chain");
      setError(null);
      return;
    }

    /** EIP-1193 provider for the wallet the user actually connected (not always `window.ethereum`). */
    const resolveEip1193Provider =
      async (): Promise<EthereumProvider | null> => {
        if (connector?.getProvider) {
          try {
            const p = await connector.getProvider();
            if (p && typeof (p as EthereumProvider).request === "function") {
              nsDebug("resolveEip1193Provider: using connector.getProvider()", {
                connectorId: connector.id,
              });
              return p as EthereumProvider;
            }
            nsDebugWarn("connector.getProvider() returned unusable value");
          } catch (e) {
            nsDebugError(
              "connector.getProvider() threw",
              nsDebugSerializeError(e),
            );
          }
        }
        if (typeof window !== "undefined" && window.ethereum) {
          nsDebug("resolveEip1193Provider: fallback window.ethereum");
          return window.ethereum as EthereumProvider;
        }
        nsDebugWarn("resolveEip1193Provider: no provider");
        return null;
      };

    setIsSwitching(true);
    setError(null);

    try {
      if (switchChainAsync) {
        nsDebug("calling switchChainAsync", { chainId: defaultChain.id });
        await switchChainAsync({ chainId: defaultChain.id });
        nsDebug("switchChainAsync promise settled; waiting 300ms for wallet");
        // MetaMask sometimes resolves before the active chain updates; give it a beat.
        await new Promise((r) => setTimeout(r, 300));
      } else {
        nsDebugWarn("switchChainAsync is undefined — skipping wagmi switch");
      }

      const eth = await resolveEip1193Provider();
      if (!eth) {
        nsDebugError("no EIP-1193 provider after switch attempt");
        setError("No wallet provider available. Reconnect your wallet and try again.");
        return;
      }

      let chainId = await readEthChainId(eth, "after wagmi switch");
      if (chainId !== defaultChain.id) {
        nsDebug("on-chain id mismatch after wagmi → switchOrAddInjected", {
          readChainId: chainId,
          expected: defaultChain.id,
        });
        await switchOrAddInjected(eth);
        chainId = await readEthChainId(eth, "after switchOrAddInjected");
      }

      nsDebug("post-verify eth_chainId", {
        chainId,
        expected: defaultChain.id,
        match: chainId === defaultChain.id,
      });

      if (chainId !== defaultChain.id) {
        const rpc = defaultChain.rpcUrls.default.http[0] ?? "";
        setError(
          `Your wallet is still on chain ${chainId ?? "unknown"} (this app needs ${defaultChain.id}). ` +
            `In MetaMask: open the network menu (top) → if "${defaultChain.name}" is missing, choose ` +
            `"Add network" → "Add a network manually" and enter Network name: ${defaultChain.name}, ` +
            `RPC URL: ${rpc}, Chain ID: ${defaultChain.id}, Currency: ${defaultChain.nativeCurrency.symbol}. ` +
            `Then select that network. If MetaMask already shows chain ${defaultChain.id} but this message persists, refresh the page.`,
        );
      } else {
        nsDebug("switch flow OK: eth_chainId matches expected chain");
      }
    } catch (err: unknown) {
      nsDebugError("try block threw", nsDebugSerializeError(err));

      if (
        err instanceof UserRejectedRequestError ||
        getDeepErrorCode(err) === 4001
      ) {
        nsDebug("user rejected (4001) — stopping");
        setError(
          "Switch was cancelled in your wallet. Approve the request to continue.",
        );
        return;
      }

      nsDebug("entering catch fallback: switchOrAddInjected via same provider");

      // Wagmi failed (e.g. chain not in wallet yet, or connector quirk). Use the
      // same EIP-1193 provider RainbowKit / wagmi connected with.
      const eth = await resolveEip1193Provider();
      if (eth) {
        try {
          await switchOrAddInjected(eth);
          await new Promise((r) => setTimeout(r, 300));
          let chainId = await readEthChainId(eth);
          if (chainId !== defaultChain.id) {
            await switchOrAddInjected(eth);
            chainId = await readEthChainId(eth);
          }
          if (chainId !== defaultChain.id) {
            const rpc = defaultChain.rpcUrls.default.http[0] ?? "";
            setError(
              `Could not switch to chain ${defaultChain.id}. Wallet still reports ${chainId ?? "unknown"}. ` +
                `Add the network manually in MetaMask (Chain ID ${defaultChain.id}, RPC ${rpc}) then select it.`,
            );
          }
        } catch (fallbackErr: unknown) {
          nsDebugError(
            "catch fallback switchOrAddInjected failed",
            nsDebugSerializeError(fallbackErr),
          );
          if (
            fallbackErr instanceof UserRejectedRequestError ||
            getDeepErrorCode(fallbackErr) === 4001
          ) {
            setError(
              "Cancelled in your wallet. Approve adding or switching the network.",
            );
            return;
          }
          console.error("Injected switch/add failed:", fallbackErr);
          const msg =
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "Failed to add or switch network.";
          setError(msg);
        }
        return;
      }

      console.error("Network switch failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to switch network. Try manually in your wallet.",
      );
    } finally {
      setIsSwitching(false);
      nsDebug("--- switchToRequiredNetwork() finished (finally) ---");
    }
  }, [isConnected, resolvedChainId, switchChainAsync, connector]);

  /** Local dev: parent UI may hide the fullscreen guard while still wrong chain. */
  const isLocalNetworkEnv = getDefaultNetwork() === "local";

  return {
    isCorrectNetwork,
    isWalletReady,
    shouldShowSwitchModal,
    reportedChainId: resolvedChainId,
    isSwitching: isSwitching || isPending,
    error,
    switchToRequiredNetwork,
    isConnected,
    isLocalNetworkEnv,
  };
}
