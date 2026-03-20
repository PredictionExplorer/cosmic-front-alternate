"use client";

import { useChainId } from "wagmi";
import { defaultChain } from "@/lib/web3/chains";
import { resolveChainIdForGuard } from "@/lib/resolveChainIdForGuard";
import { useProviderChainId } from "@/hooks/useProviderChainId";

/**
 * Single place for “what chain is the wallet really on?” for UI (guard, header button).
 */
export function useResolvedChainId() {
  const wagmiChainId = useChainId();
  const providerChainId = useProviderChainId();
  const expectedChainId = defaultChain.id;
  const resolvedChainId = resolveChainIdForGuard(
    wagmiChainId,
    providerChainId,
    expectedChainId,
  );
  const isOnAppChain = resolvedChainId === expectedChainId;

  return {
    wagmiChainId,
    providerChainId,
    expectedChainId,
    resolvedChainId,
    isOnAppChain,
  };
}
