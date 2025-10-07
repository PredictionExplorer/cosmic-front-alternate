"use client";

import { motion } from "framer-motion";
import { Trophy, Coins, Gem, CheckCircle, Package } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/data/EmptyState";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { MOCK_USER_WINNINGS } from "@/lib/mockData/users";
import { formatEth } from "@/lib/utils";
import { useState } from "react";

export default function MyWinningsPage() {
  const winnings = MOCK_USER_WINNINGS;
  const [showClaimedHistory, setShowClaimedHistory] = useState(false);

  const hasUnclaimedPrizes =
    parseFloat(winnings.unclaimedETH) > 0 ||
    winnings.unclaimedERC20Tokens.length > 0 ||
    winnings.unclaimedDonatedNFTs.length > 0;

  // Mock claimed history
  const claimedHistory = [
    { date: "Dec 1, 2025", type: "Main Prize", amount: "3.1 ETH", round: 233 },
    { date: "Nov 15, 2025", type: "Raffle", amount: "0.3 ETH", round: 228 },
    { date: "Oct 30, 2025", type: "Staking", amount: "0.8 ETH", round: 220 },
  ];

  if (!hasUnclaimedPrizes && claimedHistory.length === 0) {
    return (
      <div className="min-h-screen section-padding">
        <Container>
          <Breadcrumbs
            items={[
              { label: "My Account", href: "/account" },
              { label: "Winnings" },
            ]}
            className="mb-8"
          />

          <EmptyState
            icon={Trophy}
            title="No Prizes Yet"
            description="Start playing to win prizes! Every round has 15+ opportunities to win."
            action={{
              label: "Start Playing",
              href: "/game/play",
            }}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <Breadcrumbs
            items={[
              { label: "My Account", href: "/account" },
              { label: "Winnings" },
            ]}
            className="mb-8"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="heading-xl mb-4">Your Prizes</h1>
            {hasUnclaimedPrizes && (
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy size={20} className="text-primary" />
                <span className="font-mono text-2xl font-semibold text-primary">
                  {formatEth(winnings.unclaimedETH)} ETH
                </span>
                <span className="text-text-secondary">+ more to claim</span>
              </div>
            )}
          </motion.div>
        </Container>
      </section>

      {/* Unclaimed Prizes */}
      {hasUnclaimedPrizes && (
        <section className="py-12">
          <Container>
            <h2 className="font-serif text-3xl font-semibold text-text-primary mb-8">
              Ready to Claim
            </h2>

            <div className="space-y-6">
              {/* ETH Prizes */}
              {parseFloat(winnings.unclaimedETH) > 0 && (
                <Card glass className="p-8 border-primary/20 shadow-luxury-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-4 rounded-lg bg-primary/10">
                        <Coins size={32} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                          ETH Prize
                        </h3>
                        <p className="text-text-secondary mb-4">
                          Raffle and Chrono-Warrior prizes from recent rounds
                        </p>
                        <div className="font-mono text-4xl font-bold text-primary mb-2">
                          {formatEth(winnings.unclaimedETH)} ETH
                        </div>
                        <p className="text-sm text-text-muted">
                          ≈ $
                          {(
                            parseFloat(formatEth(winnings.unclaimedETH)) * 2400
                          ).toFixed(2)}{" "}
                          USD
                        </p>
                      </div>
                    </div>

                    <Button size="lg">Claim ETH</Button>
                  </div>
                </Card>
              )}

              {/* ERC-20 Tokens */}
              {winnings.unclaimedERC20Tokens.length > 0 && (
                <Card glass className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-4 rounded-lg bg-status-success/10">
                        <Package size={32} className="text-status-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                          ERC-20 Tokens
                        </h3>
                        <p className="text-text-secondary mb-4">
                          Donated tokens from rounds you won
                        </p>

                        <div className="space-y-3">
                          {winnings.unclaimedERC20Tokens.map((token, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded bg-background-elevated"
                            >
                              <div>
                                <span className="font-mono text-lg text-text-primary">
                                  {(
                                    parseFloat(token.amount) / 1e6
                                  ).toLocaleString()}{" "}
                                  {token.tokenSymbol}
                                </span>
                              </div>
                              <Button size="sm" variant="outline">
                                Claim
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Donated NFTs */}
              {winnings.unclaimedDonatedNFTs.length > 0 && (
                <Card glass className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="flex-shrink-0 p-4 rounded-lg bg-status-info/10">
                          <Gem size={32} className="text-status-info" />
                        </div>
                        <div>
                          <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                            Donated NFTs
                          </h3>
                          <p className="text-text-secondary">
                            {winnings.unclaimedDonatedNFTs.length} NFT
                            {winnings.unclaimedDonatedNFTs.length > 1
                              ? "s"
                              : ""}{" "}
                            donated by other players
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {winnings.unclaimedDonatedNFTs.map((nft, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-background-elevated border border-text-muted/10"
                          >
                            <p className="text-text-primary mb-2 font-medium">
                              Token #{nft.tokenId}
                            </p>
                            <p className="text-sm text-text-secondary mb-3">
                              From Round {nft.round}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                            >
                              Claim NFT
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Claimed History */}
      <section className="py-12">
        <Container>
          <button
            onClick={() => setShowClaimedHistory(!showClaimedHistory)}
            className="w-full text-left mb-6 flex items-center justify-between group"
          >
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              Claimed History
            </h2>
            <span className="text-text-secondary group-hover:text-primary transition-colors">
              {showClaimedHistory ? "Hide" : "Show"} ({claimedHistory.length})
            </span>
          </button>

          {showClaimedHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              {claimedHistory.map((item, index) => (
                <Card key={index} glass className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CheckCircle size={20} className="text-status-success" />
                      <div>
                        <p className="font-serif text-lg font-semibold text-text-primary">
                          {item.type}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {item.date} • Round {item.round}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xl font-semibold text-status-success">
                        {item.amount}
                      </p>
                      <p className="text-xs text-text-muted">Claimed</p>
                    </div>
                  </div>
                </Card>
              ))}
            </motion.div>
          )}
        </Container>
      </section>
    </div>
  );
}
