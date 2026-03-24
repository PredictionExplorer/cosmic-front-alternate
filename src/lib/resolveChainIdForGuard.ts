/**
 * Merge wagmi `useChainId` with EIP-1193 `eth_chainId` from the connector.
 *
 * - MetaMask **signs** on whatever network the extension has selected; that tracks
 *   `eth_chainId` on the connector provider, not always wagmi’s store.
 * - If wagmi says we’re on the app chain but the provider reports another chain
 *   (e.g. Arbitrum 42161 vs local 31337), we **must** treat the user as on the
 *   provider chain — otherwise the UI hides “wrong network” while MetaMask still
 *   shows Arbitrum and transactions are built for the wrong network.
 * - If wagmi is behind but the provider already matches the app chain, prefer the
 *   provider’s match (second / third branches).
 */
export function resolveChainIdForGuard(
  wagmiChainId: number,
  providerChainId: number | undefined,
  expectedChainId: number,
): number {
  if (
    providerChainId !== undefined &&
    wagmiChainId === expectedChainId &&
    providerChainId !== expectedChainId
  ) {
    return providerChainId;
  }

  if (wagmiChainId === expectedChainId) return wagmiChainId;
  if (providerChainId === expectedChainId) return providerChainId;
  if (providerChainId !== undefined) return providerChainId;
  return wagmiChainId;
}
