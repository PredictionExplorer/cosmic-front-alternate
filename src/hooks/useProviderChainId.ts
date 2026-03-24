/**
 * Chain ID from the wallet EIP-1193 provider (initial eth_chainId + chainChanged).
 *
 * No polling: MetaMask SDK sometimes returns a stale chain id on repeated eth_chainId
 * while wagmi is already correct — polling made the guard reopen after a good switch.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";

type Eip1193Like = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
  off?: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
};

function parseChainHex(hex: string): number {
  const h = hex.startsWith("0x") ? hex : `0x${hex}`;
  return Number.parseInt(h, 16);
}

async function readChainId(provider: Eip1193Like): Promise<number | undefined> {
  try {
    const hex = (await provider.request({ method: "eth_chainId" })) as string;
    return parseChainHex(hex);
  } catch {
    return undefined;
  }
}

/**
 * Live chain ID from the wallet provider. `undefined` while disconnected or before first read.
 */
export function useProviderChainId(): number | undefined {
  const { connector, status } = useAccount();
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const providerRef = useRef<Eip1193Like | null>(null);

  useEffect(() => {
    if (status !== "connected" || !connector?.getProvider) {
      setChainId(undefined);
      providerRef.current = null;
      return;
    }

    let cancelled = false;

    const onChainChanged = (...args: unknown[]) => {
      const hex = typeof args[0] === "string" ? args[0] : "";
      if (!hex) return;
      setChainId(parseChainHex(hex));
    };

    void (async () => {
      try {
        const raw = await connector.getProvider();
        if (cancelled || !raw || typeof (raw as Eip1193Like).request !== "function") {
          return;
        }
        const provider = raw as Eip1193Like;
        providerRef.current = provider;

        const id = await readChainId(provider);
        if (!cancelled && id !== undefined) {
          setChainId(id);
        }

        if (typeof provider.on === "function") {
          provider.on("chainChanged", onChainChanged);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      const p = providerRef.current;
      providerRef.current = null;
      if (p) {
        if (typeof p.removeListener === "function") {
          p.removeListener("chainChanged", onChainChanged);
        } else if (typeof p.off === "function") {
          p.off("chainChanged", onChainChanged);
        }
      }
    };
  }, [connector, status]);

  return chainId;
}
