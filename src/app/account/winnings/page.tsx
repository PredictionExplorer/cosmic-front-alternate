"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Coins, Gem, CheckCircle, Package, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/data/EmptyState";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { api } from "@/services/api";
import { usePrizesWallet } from "@/hooks/usePrizesWallet";
import { formatEth } from "@/lib/utils";
import { parseEther } from "viem";

interface DonatedNFT {
  Index: number;
  NftAddr: string;
  TokenId: number;
  RoundNum: number;
  Claimed: boolean;
}

interface DonatedERC20 {
  RoundNum: number;
  TokenAddr: string;
  TokenSymbol: string;
  AmountEth: string;
  Claimed: boolean;
}

interface UserWinnings {
  DonatedERC20Tokens: DonatedERC20[];
  ETHRaffleToClaim: number;
  ETHRaffleToClaimWei: string;
  NumDonatedNFTToClaim: number;
  UnclaimedStakingReward: number;
}

interface ClaimHistoryItem {
  RoundNum: number;
  Description?: string;
  Amount?: number;
}

export default function MyWinningsPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [winnings, setWinnings] = useState<UserWinnings | null>(null);
  const [donatedNFTs, setDonatedNFTs] = useState<DonatedNFT[]>([]);
  const [showClaimedHistory, setShowClaimedHistory] = useState(false);
  const [claimHistory, setClaimHistory] = useState<ClaimHistoryItem[]>([]);
  
  // Claiming states
  const [claimingEth, setClaimingEth] = useState(false);
  const [claimingNFT, setClaimingNFT] = useState<number | null>(null);
  const [claimingERC20, setClaimingERC20] = useState<number | null>(null);
  
  const prizesWallet = usePrizesWallet();

  // Fetch user's winnings and claim history
  useEffect(() => {
    async function fetchWinnings() {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [winningsData, unclaimedNFTs, claimedNFTs, claimHistoryData] = await Promise.all([
          api.getUserWinnings(address),
          api.getUnclaimedDonatedNFTsByUser(address),
          api.getClaimedDonatedNFTsByUser(address),
          api.getClaimHistoryByUser(address),
        ]);

        setWinnings({
          ...winningsData,
          DonatedERC20Tokens: winningsData.DonatedERC20Tokens || [],
        });
        setDonatedNFTs([...unclaimedNFTs, ...claimedNFTs]);
        setClaimHistory(claimHistoryData);
      } catch (error) {
        console.error("Error fetching winnings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchWinnings();
  }, [address, isConnected]);

  // Refresh data after successful transaction
  const refreshData = async () => {
    if (!address) return;
    
    try {
      const [winningsData, unclaimedNFTs, claimedNFTs, claimHistoryData] = await Promise.all([
        api.getUserWinnings(address),
        api.getUnclaimedDonatedNFTsByUser(address),
        api.getClaimedDonatedNFTsByUser(address),
        api.getClaimHistoryByUser(address),
      ]);

      setWinnings({
        ...winningsData,
        DonatedERC20Tokens: winningsData.DonatedERC20Tokens || [],
      });
      setDonatedNFTs([...unclaimedNFTs, ...claimedNFTs]);
      setClaimHistory(claimHistoryData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Claim ETH prizes
  const handleClaimETH = async () => {
    try {
      setClaimingEth(true);
      await prizesWallet.write.withdrawEth();
      
      // Wait for transaction confirmation
      if (prizesWallet.write.status.isSuccess) {
        setTimeout(refreshData, 3000);
      }
    } catch (error) {
      console.error("Error claiming ETH:", error);
    } finally {
      setClaimingEth(false);
    }
  };

  // Claim single donated NFT
  const handleClaimNFT = async (nftIndex: number) => {
    try {
      setClaimingNFT(nftIndex);
      await prizesWallet.write.claimDonatedNft(BigInt(nftIndex));
      
      if (prizesWallet.write.status.isSuccess) {
        setTimeout(refreshData, 3000);
      }
    } catch (error) {
      console.error("Error claiming NFT:", error);
    } finally {
      setClaimingNFT(null);
    }
  };

  // Claim all donated NFTs
  const handleClaimAllNFTs = async () => {
    const unclaimedNFTs = donatedNFTs.filter(nft => !nft.Claimed);
    if (unclaimedNFTs.length === 0) return;

    try {
      const indexes = unclaimedNFTs.map(nft => BigInt(nft.Index));
      await prizesWallet.write.claimManyDonatedNfts(indexes);
      
      if (prizesWallet.write.status.isSuccess) {
        setTimeout(refreshData, 3000);
      }
    } catch (error) {
      console.error("Error claiming all NFTs:", error);
    }
  };

  // Claim single ERC20 token
  const handleClaimERC20 = async (roundNum: number, tokenAddr: string, amount: string) => {
    try {
      setClaimingERC20(roundNum);
      await prizesWallet.write.claimDonatedToken(
        BigInt(roundNum),
        tokenAddr as `0x${string}`,
        BigInt(amount)
      );
      
      if (prizesWallet.write.status.isSuccess) {
        setTimeout(refreshData, 3000);
      }
    } catch (error) {
      console.error("Error claiming ERC20:", error);
    } finally {
      setClaimingERC20(null);
    }
  };

  // Claim all ERC20 tokens
  const handleClaimAllERC20 = async () => {
    if (!winnings) return;
    
    const unclaimedTokens = (winnings.DonatedERC20Tokens || []).filter(t => !t.Claimed);
    if (unclaimedTokens.length === 0) return;

    try {
      const tokens = unclaimedTokens.map(token => ({
        roundNum: BigInt(token.RoundNum),
        tokenAddress: token.TokenAddr as `0x${string}`,
        amount: BigInt(token.AmountEth),
      }));
      
      await prizesWallet.write.claimManyDonatedTokens(tokens);
      
      if (prizesWallet.write.status.isSuccess) {
        setTimeout(refreshData, 3000);
      }
    } catch (error) {
      console.error("Error claiming all ERC20:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <section className="section-padding bg-background-surface/50">
          <Container>
            <Breadcrumbs
              items={[
                { label: "My Account", href: "/account" },
                { label: "Winnings" },
              ]}
              className="mb-8"
            />
            <Card glass className="p-12 text-center">
              <h1 className="heading-sm mb-4">Connect Your Wallet</h1>
              <p className="text-text-secondary">
                Please connect your wallet to view and claim your prizes
              </p>
            </Card>
          </Container>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-text-secondary">Loading your prizes...</p>
          </Card>
        </Container>
      </div>
    );
  }

  const hasUnclaimedPrizes =
    (winnings?.ETHRaffleToClaim || 0) > 0 ||
    (winnings?.UnclaimedStakingReward || 0) > 0 ||
    ((winnings?.DonatedERC20Tokens || []).filter(t => !t.Claimed).length || 0) > 0 ||
    donatedNFTs.filter(nft => !nft.Claimed).length > 0;

  const totalEthToClaim = (winnings?.ETHRaffleToClaim || 0) + (winnings?.UnclaimedStakingReward || 0);
  
  const unclaimedNFTs = donatedNFTs.filter(nft => !nft.Claimed);
  const unclaimedERC20 = (winnings?.DonatedERC20Tokens || []).filter(t => !t.Claimed);

  if (!hasUnclaimedPrizes && claimHistory.length === 0) {
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
                  {totalEthToClaim.toFixed(6)} ETH
                </span>
                <span className="text-text-secondary">+ more to claim</span>
              </div>
            )}
          </motion.div>
        </Container>
      </section>

      {/* Transaction Status */}
      {prizesWallet.isTransactionPending && (
        <section className="py-4">
          <Container>
            <Card glass className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
                <div>
                  <p className="font-semibold text-text-primary">Transaction in progress...</p>
                  <p className="text-sm text-text-secondary">
                    Please wait while your transaction is being confirmed
                  </p>
                </div>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* Unclaimed Prizes */}
      {hasUnclaimedPrizes && (
        <section className="py-12">
          <Container>
            <h2 className="font-serif text-3xl font-semibold text-text-primary mb-8">
              Ready to Claim
            </h2>

            <div className="space-y-6">
              {/* ETH Prizes */}
              {totalEthToClaim > 0 && (
                <Card glass className="p-8 border-primary/20 shadow-luxury-lg">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 p-4 rounded-lg bg-primary/10">
                        <Coins size={32} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                          ETH Prizes
                        </h3>
                        <p className="text-text-secondary mb-4">
                          {winnings?.ETHRaffleToClaim ? "Raffle prizes" : ""}
                          {winnings?.ETHRaffleToClaim && winnings?.UnclaimedStakingReward ? " and " : ""}
                          {winnings?.UnclaimedStakingReward ? "staking rewards" : ""}
                        </p>
                        <div className="font-mono text-4xl font-bold text-primary mb-2">
                          {totalEthToClaim.toFixed(6)} ETH
                        </div>
                        <p className="text-sm text-text-muted">
                          ≈ ${(totalEthToClaim * 2400).toFixed(2)} USD
                        </p>
                      </div>
                    </div>

                    <Button 
                      size="lg" 
                      onClick={handleClaimETH}
                      disabled={claimingEth || prizesWallet.isTransactionPending}
                    >
                      {claimingEth ? "Claiming..." : "Claim ETH"}
                    </Button>
                  </div>
                </Card>
              )}

              {/* ERC-20 Tokens */}
              {unclaimedERC20.length > 0 && (
                <Card glass className="p-8">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-4 rounded-lg bg-status-success/10">
                        <Package size={32} className="text-status-success" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                          ERC-20 Tokens
                        </h3>
                        <p className="text-text-secondary">
                          {unclaimedERC20.length} donated token{unclaimedERC20.length > 1 ? "s" : ""} from rounds you won
                        </p>
                      </div>
                    </div>
                    
                    {unclaimedERC20.length > 1 && (
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={handleClaimAllERC20}
                        disabled={prizesWallet.isTransactionPending}
                      >
                        Claim All
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {unclaimedERC20.map((token, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10"
                      >
                        <div>
                          <span className="font-mono text-lg text-text-primary">
                            {(parseFloat(token.AmountEth) / 1e18).toLocaleString()}{" "}
                            {token.TokenSymbol}
                          </span>
                          <p className="text-xs text-text-secondary mt-1">
                            From Round {token.RoundNum}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleClaimERC20(token.RoundNum, token.TokenAddr, token.AmountEth)}
                          disabled={claimingERC20 === token.RoundNum || prizesWallet.isTransactionPending}
                        >
                          {claimingERC20 === token.RoundNum ? "Claiming..." : "Claim"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Donated NFTs */}
              {unclaimedNFTs.length > 0 && (
                <Card glass className="p-8">
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-4 rounded-lg bg-status-info/10">
                        <Gem size={32} className="text-status-info" />
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-semibold text-text-primary mb-2">
                          Donated NFTs
                        </h3>
                        <p className="text-text-secondary">
                          {unclaimedNFTs.length} NFT{unclaimedNFTs.length > 1 ? "s" : ""} donated by other players
                        </p>
                      </div>
                    </div>
                    
                    {unclaimedNFTs.length > 1 && (
                      <Button 
                        size="lg" 
                        variant="outline"
                        onClick={handleClaimAllNFTs}
                        disabled={prizesWallet.isTransactionPending}
                      >
                        Claim All
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unclaimedNFTs.map((nft) => (
                      <div
                        key={nft.Index}
                        className="p-4 rounded-lg bg-background-elevated border border-text-muted/10"
                      >
                        <p className="text-text-primary mb-2 font-medium">
                          Token #{nft.TokenId}
                        </p>
                        <p className="text-sm text-text-secondary mb-3">
                          From Round {nft.RoundNum}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleClaimNFT(nft.Index)}
                          disabled={claimingNFT === nft.Index || prizesWallet.isTransactionPending}
                        >
                          {claimingNFT === nft.Index ? "Claiming..." : "Claim NFT"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Claimed History */}
      {claimHistory.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <button
              onClick={() => setShowClaimedHistory(!showClaimedHistory)}
              className="w-full text-left mb-6 flex items-center justify-between group"
            >
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Claim History
              </h2>
              <span className="text-text-secondary group-hover:text-primary transition-colors">
                {showClaimedHistory ? "Hide" : "Show"} ({claimHistory.length})
              </span>
            </button>

            {showClaimedHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                {claimHistory.map((item, index) => (
                  <Card key={index} glass className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-4">
                        <CheckCircle size={20} className="text-status-success" />
                        <div>
                          <p className="font-serif text-lg font-semibold text-text-primary">
                            {item.Description || "Prize Claimed"}
                          </p>
                          <p className="text-sm text-text-secondary">
                            Round {item.RoundNum}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xl font-semibold text-status-success">
                          {item.Amount?.toFixed(6)} ETH
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
      )}
    </div>
  );
}
