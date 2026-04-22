"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2, ExternalLink } from "lucide-react";

import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/services/api";
import type { ApiStakedCSTToken, ApiStakingAction } from "@/services/apiTypes";
import { explorer } from "@/lib/web3/chains";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { AddressDisplay } from "@/components/features/AddressDisplay";

/** Stake actions: ActionType === 1 is unstake; otherwise stake (see account statistics UI). */
function buildStakeTxByActionId(actions: ApiStakingAction[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const a of actions) {
    if (a.ActionType !== 1 && a.Tx?.TxHash) {
      map.set(a.ActionId, a.Tx.TxHash);
    }
  }
  return map;
}

function resolveTxHash(staked: ApiStakedCSTToken, stakeTxByActionId: Map<number, string>): string | null {
  const fromStake = stakeTxByActionId.get(staked.StakeActionId);
  if (fromStake) return fromStake;
  const mint = staked.TokenInfo?.Tx?.TxHash;
  return mint?.trim() ? mint : null;
}

export default function CstGloballyStakedTokensPage() {
  const { data, isLoading, error } = useApiQuery(
    "stats-global-staked-cst-tokens",
    async () => {
      const [staked, actions] = await Promise.all([
        api.getStakedCSTTokens(),
        api.getStakingCSTActions(),
      ]);
      return {
        staked: staked as ApiStakedCSTToken[],
        actions: actions as ApiStakingAction[],
      };
    },
  );

  const stakeTxByActionId = useMemo(
    () => (data?.actions ? buildStakeTxByActionId(data.actions) : new Map<number, string>()),
    [data?.actions],
  );

  const rows = useMemo(() => {
    if (!data?.staked) return [];
    return [...data.staked].sort((a, b) => {
      const idA = a.TokenInfo?.TokenId ?? 0;
      const idB = b.TokenInfo?.TokenId ?? 0;
      return idA - idB;
    });
  }, [data?.staked]);

  return (
    <div className="min-h-screen">
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Game", href: "/game/play" },
              { label: "Statistics", href: "/game/statistics" },
              { label: "Globally staked CST" },
            ]}
          />
          <h1 className="heading-xl mb-2">Globally staked Cosmic Signature NFTs</h1>
          <p className="body-lg text-text-secondary mb-8 max-w-3xl">
            All tokens currently locked in the CST staking contract. Data comes from the same API as{" "}
            <code className="text-xs font-mono bg-background-elevated px-1.5 py-0.5 rounded">
              staking/cst/staked_tokens/all
            </code>
            .
          </p>

          {isLoading && (
            <Card glass className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
              <p className="text-text-secondary">Loading staked tokens…</p>
            </Card>
          )}

          {error && (
            <Card glass className="p-8 border border-status-error/30">
              <p className="text-status-error text-sm">
                {error instanceof Error ? error.message : "Failed to load staked tokens."}
              </p>
            </Card>
          )}

          {!isLoading && !error && data && (
            <Card glass className="overflow-hidden p-0">
              <div className="px-6 py-4 border-b border-text-muted/10 bg-background-elevated/50">
                <p className="text-sm text-text-secondary">
                  <span className="font-mono text-text-primary">{rows.length}</span> token
                  {rows.length !== 1 ? "s" : ""} staked
                </p>
              </div>
              {rows.length === 0 ? (
                <div className="p-12 text-center text-text-secondary text-sm">
                  No CST tokens are staked right now.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background-elevated border-b border-text-muted/10 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-text-primary">Staker</th>
                        <th className="px-4 py-3 text-left font-semibold text-text-primary">Token ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-text-primary">
                          Stake transaction
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text-muted/10">
                      {rows.map((staked) => {
                        const addr = staked.UserAddr || staked.TokenInfo?.StakedOwnerAddr || "";
                        const tokenId = staked.TokenInfo?.TokenId;
                        const txHash = resolveTxHash(staked, stakeTxByActionId);
                        return (
                          <tr key={`${staked.StakeActionId}-${tokenId}`} className="hover:bg-background-elevated/40">
                            <td className="px-4 py-3 align-top">
                              {addr ? (
                                <Link
                                  href={`/user/${addr}`}
                                  className="inline-flex hover:text-primary hover:underline"
                                >
                                  <AddressDisplay
                                    address={addr}
                                    shorten
                                    chars={8}
                                    showCopy
                                    showLink={false}
                                  />
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 align-top font-mono">
                              {tokenId != null ? (
                                <Link href={`/gallery/${tokenId}`} className="text-primary hover:underline">
                                  #{tokenId}
                                </Link>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {txHash ? (
                                <a
                                  href={explorer.tx(txHash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono text-xs break-all"
                                >
                                  <span className="hidden sm:inline">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                                  <span className="sm:hidden">{txHash.slice(0, 6)}…</span>
                                  <ExternalLink size={14} className="flex-shrink-0 opacity-80" />
                                </a>
                              ) : (
                                <span className="text-text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          <p className="mt-8 text-xs text-text-muted max-w-2xl">
            Transaction links use Arbiscan for the configured network (see{" "}
            <code className="font-mono">NEXT_PUBLIC_NETWORK</code>). Stake tx is taken from global stake
            actions when available; otherwise the NFT mint transaction hash is shown.
          </p>
        </Container>
      </section>
    </div>
  );
}
