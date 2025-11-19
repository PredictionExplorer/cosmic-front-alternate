"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Coins, 
  Gem, 
  CheckCircle, 
  Package, 
  Loader2, 
  ExternalLink,
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/data/EmptyState";
import { Breadcrumbs } from "@/components/features/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { usePrizesWallet } from "@/hooks/usePrizesWallet";
import { safeTimestamp } from "@/lib/utils";

interface RaffleWinning {
  EvtLogId: number;
  TxHash: string;
  TimeStamp: number;
  RoundNum: number;
  Amount: number;
}

interface DonatedNFT {
  Index: number;
  NftAddr: string;
  TokenId: number;
  RoundNum: number;
  TimeStamp: number;
  Claimed: boolean;
}

interface DonatedERC20 {
  RoundNum: number;
  TokenAddr: string;
  TokenSymbol: string;
  TokenName: string;
  AmountEth: string;
  Amount: number;
  TimeStamp: number;
  Claimed: boolean;
}

interface StakingReward {
  ActionId: number;
  TokenId: number;
  RoundNum: number;
  RewardAmountEth: number;
  TimeStamp: number;
}

export default function MyWinningsPage() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  
  // Unclaimed winnings data
  const [raffleETHWinnings, setRaffleETHWinnings] = useState<RaffleWinning[]>([]);
  const [donatedNFTs, setDonatedNFTs] = useState<DonatedNFT[]>([]);
  const [donatedERC20, setDonatedERC20] = useState<DonatedERC20[]>([]);
  const [stakingRewards, setStakingRewards] = useState<StakingReward[]>([]);
  
  // Summary data
  const [totalEthToClaim, setTotalEthToClaim] = useState(0);
  const [totalStakingRewards, setTotalStakingRewards] = useState(0);
  
  // Transaction states
  const [claiming, setClaiming] = useState({
    eth: false,
    nft: null as number | null,
    erc20: null as number | null,
    staking: null as number | null,
  });
  
  const prizesWallet = usePrizesWallet();

  // Fetch all unclaimed winnings
  const fetchWinnings = useCallback(async () => {
    if (!address || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [
        raffleDeposits,
        unclaimedNFTs,
        claimedNFTs,
        erc20Tokens,
        stakingRewardsData,
      ] = await Promise.all([
        api.getUnclaimedRaffleDeposits(address),
        api.getUnclaimedDonatedNFTsByUser(address),
        api.getClaimedDonatedNFTsByUser(address),
        api.getERC20DonationsByUser(address),
        api.getStakingCSTRewardsToClaim(address),
      ]);

      setRaffleETHWinnings(raffleDeposits.sort((a: RaffleWinning, b: RaffleWinning) => 
        b.TimeStamp - a.TimeStamp
      ));
      
      setDonatedNFTs([...unclaimedNFTs, ...claimedNFTs].sort((a: DonatedNFT, b: DonatedNFT) => 
        b.TimeStamp - a.TimeStamp
      ));
      
      setDonatedERC20(erc20Tokens.sort((a: DonatedERC20, b: DonatedERC20) => 
        b.TimeStamp - a.TimeStamp
      ));
      
      setStakingRewards(stakingRewardsData);

      // Calculate totals
      const ethTotal = raffleDeposits.reduce((sum: number, w: RaffleWinning) => sum + w.Amount, 0);
      const stakingTotal = stakingRewardsData.reduce((sum: number, r: StakingReward) => 
        sum + r.RewardAmountEth, 0
      );
      
      setTotalEthToClaim(ethTotal);
      setTotalStakingRewards(stakingTotal);
    } catch (error) {
      console.error("Error fetching winnings:", error);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchWinnings();
  }, [fetchWinnings]);

  // Refresh data after successful transaction
  const refreshData = () => {
    setTimeout(fetchWinnings, 3000);
  };

  // Claim all ETH (raffle + staking)
  const handleClaimETH = async () => {
    try {
      setClaiming(prev => ({ ...prev, eth: true }));
      await prizesWallet.write.withdrawEth();
      refreshData();
    } catch (error) {
      console.error("Error claiming ETH:", error);
    } finally {
      setClaiming(prev => ({ ...prev, eth: false }));
    }
  };

  // Claim single donated NFT
  const handleClaimNFT = async (nftIndex: number) => {
    try {
      setClaiming(prev => ({ ...prev, nft: nftIndex }));
      await prizesWallet.write.claimDonatedNft(BigInt(nftIndex));
      refreshData();
    } catch (error) {
      console.error("Error claiming NFT:", error);
    } finally {
      setClaiming(prev => ({ ...prev, nft: null }));
    }
  };

  // Claim all donated NFTs
  const handleClaimAllNFTs = async () => {
    const unclaimedNFTs = donatedNFTs.filter(nft => !nft.Claimed);
    if (unclaimedNFTs.length === 0) return;

    try {
      const indexes = unclaimedNFTs.map(nft => BigInt(nft.Index));
      await prizesWallet.write.claimManyDonatedNfts(indexes);
      refreshData();
    } catch (error) {
      console.error("Error claiming all NFTs:", error);
    }
  };

  // Claim single ERC20 token
  const handleClaimERC20 = async (token: DonatedERC20) => {
    try {
      setClaiming(prev => ({ ...prev, erc20: token.RoundNum }));
      await prizesWallet.write.claimDonatedToken(
        BigInt(token.RoundNum),
        token.TokenAddr as `0x${string}`,
        BigInt(token.AmountEth)
      );
      refreshData();
    } catch (error) {
      console.error("Error claiming ERC20:", error);
    } finally {
      setClaiming(prev => ({ ...prev, erc20: null }));
    }
  };

  // Claim all ERC20 tokens
  const handleClaimAllERC20 = async () => {
    const unclaimedTokens = donatedERC20.filter(t => !t.Claimed);
    if (unclaimedTokens.length === 0) return;

    try {
      const tokens = unclaimedTokens.map(token => ({
        roundNum: BigInt(token.RoundNum),
        tokenAddress: token.TokenAddr as `0x${string}`,
        amount: BigInt(token.AmountEth),
      }));
      
      await prizesWallet.write.claimManyDonatedTokens(tokens);
      refreshData();
    } catch (error) {
      console.error("Error claiming all ERC20:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
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
              <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
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

  const unclaimedNFTs = donatedNFTs.filter(nft => !nft.Claimed);
  const unclaimedERC20 = donatedERC20.filter(t => !t.Claimed);

  const hasUnclaimedPrizes =
    totalEthToClaim > 0 ||
    totalStakingRewards > 0 ||
    unclaimedNFTs.length > 0 ||
    unclaimedERC20.length > 0;

  const totalClaimableEth = totalEthToClaim + totalStakingRewards;

  if (!hasUnclaimedPrizes && raffleETHWinnings.length === 0 && donatedNFTs.length === 0) {
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
            <h1 className="heading-xl mb-4">Pending Winnings</h1>
            {hasUnclaimedPrizes && (
              <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/20">
                <Trophy size={24} className="text-primary" />
                <span className="font-mono text-3xl font-semibold text-primary">
                  {totalClaimableEth.toFixed(6)} ETH
                </span>
                <span className="text-text-secondary">
                  + {unclaimedNFTs.length} NFTs + {unclaimedERC20.length} Tokens
                </span>
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
                  {prizesWallet.transactionHash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${prizesWallet.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View on Arbiscan <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* Claimable ETH Rewards (Raffle) */}
      {raffleETHWinnings.length > 0 && (
        <section className="py-12">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Claimable ETH Rewards
              </h2>
              {totalEthToClaim > 0 && (
                <div className="text-right">
                  <p className="text-sm text-text-secondary mb-1">Total Claimable</p>
                  <p className="font-mono text-2xl font-bold text-primary">
                    {totalEthToClaim.toFixed(6)} ETH
                  </p>
                </div>
              )}
            </div>

            {totalEthToClaim > 0 && (
              <Card glass className="p-6 mb-6 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Coins size={40} className="text-primary" />
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Total Raffle ETH</p>
                      <p className="font-mono text-3xl font-bold text-primary">
                        {totalEthToClaim.toFixed(6)} ETH
                      </p>
                      <p className="text-sm text-text-muted mt-1">
                        ≈ ${(totalEthToClaim * 2400).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    onClick={handleClaimETH}
                    disabled={claiming.eth || prizesWallet.isTransactionPending}
                  >
                    {claiming.eth ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={20} />
                        Claiming...
                      </>
                    ) : (
                      "Claim All ETH"
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* Raffle Winnings Table */}
            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Amount (ETH)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {raffleETHWinnings.map((winning, index) => (
                      <tr 
                        key={winning.EvtLogId}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <a
                            href={`https://sepolia.arbiscan.io/tx/${winning.TxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1"
                          >
                            {formatTimestamp(winning.TimeStamp)}
                            <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/game/history/rounds/${winning.RoundNum}`}>
                            <Badge variant="default">Round {winning.RoundNum}</Badge>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="warning">Unclaimed</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                          {winning.Amount.toFixed(7)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* CST Staking Rewards */}
      {stakingRewards.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                CST Staking Rewards
              </h2>
              {totalStakingRewards > 0 && (
                <div className="text-right">
                  <p className="text-sm text-text-secondary mb-1">Total Uncollected</p>
                  <p className="font-mono text-2xl font-bold text-status-success">
                    {totalStakingRewards.toFixed(6)} ETH
                  </p>
                </div>
              )}
            </div>

            <Card glass className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-elevated border-b border-text-muted/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary">
                        Date
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Token ID
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        Round
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                        Reward (ETH)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingRewards.map((reward, index) => (
                      <tr 
                        key={reward.ActionId}
                        className={`border-b border-text-muted/5 ${
                          index % 2 === 0 ? "bg-background-surface/30" : ""
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {formatTimestamp(reward.TimeStamp)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link href={`/gallery/${reward.TokenId}`}>
                            <span className="font-mono text-sm text-primary hover:text-primary/80">
                              #{reward.TokenId}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="default">Round {reward.RoundNum}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-text-primary">
                          {reward.RewardAmountEth.toFixed(7)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-background-elevated border-t border-text-muted/10">
                <p className="text-sm text-text-secondary mb-3">
                  <AlertCircle size={16} className="inline mr-2" />
                  Staking rewards will be automatically claimed when you unstake your NFT
                </p>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* ERC-20 Tokens */}
      {donatedERC20.length > 0 && (
        <section className="py-12">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Donated ERC-20 Tokens
              </h2>
              {unclaimedERC20.length > 1 && (
                <Button 
                  variant="outline"
                  onClick={handleClaimAllERC20}
                  disabled={prizesWallet.isTransactionPending}
                >
                  Claim All ({unclaimedERC20.length})
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {donatedERC20.map((token) => (
                <Card 
                  key={`${token.RoundNum}-${token.TokenAddr}`} 
                  glass 
                  className={`p-6 ${token.Claimed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${
                        token.Claimed ? "bg-background-elevated" : "bg-status-success/10"
                      }`}>
                        <Package 
                          size={24} 
                          className={token.Claimed ? "text-text-muted" : "text-status-success"} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-mono text-xl font-semibold text-text-primary">
                            {(parseFloat(token.AmountEth) / 1e18).toLocaleString(undefined, {
                              maximumFractionDigits: 6
                            })}{" "}
                            {token.TokenSymbol}
                          </h3>
                          {token.Claimed ? (
                            <Badge variant="success">
                              <CheckCircle size={12} className="mr-1" />
                              Claimed
                            </Badge>
                          ) : (
                            <Badge variant="warning">Unclaimed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-1">
                          {token.TokenName || "ERC-20 Token"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span>Round {token.RoundNum}</span>
                          <span>•</span>
                          <span>{formatTimestamp(token.TimeStamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!token.Claimed && (
                      <Button
                        size="sm"
                        onClick={() => handleClaimERC20(token)}
                        disabled={claiming.erc20 === token.RoundNum || prizesWallet.isTransactionPending}
                      >
                        {claiming.erc20 === token.RoundNum ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Claiming...
                          </>
                        ) : (
                          "Claim"
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Donated NFTs */}
      {donatedNFTs.length > 0 && (
        <section className="py-12 bg-background-surface/50">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                Donated NFTs
              </h2>
              {unclaimedNFTs.length > 1 && (
                <Button 
                  variant="outline"
                  onClick={handleClaimAllNFTs}
                  disabled={prizesWallet.isTransactionPending}
                >
                  Claim All ({unclaimedNFTs.length})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {donatedNFTs.map((nft) => (
                <Card 
                  key={nft.Index} 
                  glass 
                  className={`p-6 ${nft.Claimed ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Gem size={20} className={nft.Claimed ? "text-text-muted" : "text-status-info"} />
                      <h3 className="font-serif text-lg font-semibold text-text-primary">
                        Token #{nft.TokenId}
                      </h3>
                    </div>
                    {nft.Claimed ? (
                      <Badge variant="success">
                        <CheckCircle size={12} className="mr-1" />
                        Claimed
                      </Badge>
                    ) : (
                      <Badge variant="warning">Unclaimed</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Round</span>
                      <Link href={`/game/history/rounds/${nft.RoundNum}`}>
                        <span className="text-primary hover:text-primary/80">
                          {nft.RoundNum}
                        </span>
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Date</span>
                      <span className="text-text-primary">
                        {new Date(safeTimestamp(nft)).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contract</span>
                      <span className="font-mono text-xs text-text-muted">
                        {nft.NftAddr.substring(0, 6)}...{nft.NftAddr.slice(-4)}
                      </span>
                    </div>
                  </div>
                  
                  {!nft.Claimed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleClaimNFT(nft.Index)}
                      disabled={claiming.nft === nft.Index || prizesWallet.isTransactionPending}
                    >
                      {claiming.nft === nft.Index ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={16} />
                          Claiming...
                        </>
                      ) : (
                        "Claim NFT"
                      )}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Summary Section */}
      {hasUnclaimedPrizes && (
        <section className="py-12">
          <Container>
            <Card glass className="p-8">
              <h3 className="font-serif text-2xl font-semibold text-text-primary mb-6">
                Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-text-secondary mb-2">ETH Raffle</p>
                  <p className="font-mono text-2xl font-bold text-primary">
                    {totalEthToClaim.toFixed(4)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">ETH</p>
                </div>

                <div className="p-4 rounded-lg bg-status-success/5 border border-status-success/10">
                  <p className="text-sm text-text-secondary mb-2">Staking Rewards</p>
                  <p className="font-mono text-2xl font-bold text-status-success">
                    {totalStakingRewards.toFixed(4)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">ETH</p>
                </div>

                <div className="p-4 rounded-lg bg-status-warning/5 border border-status-warning/10">
                  <p className="text-sm text-text-secondary mb-2">ERC-20 Tokens</p>
                  <p className="font-mono text-2xl font-bold text-status-warning">
                    {unclaimedERC20.length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Tokens</p>
                </div>

                <div className="p-4 rounded-lg bg-status-info/5 border border-status-info/10">
                  <p className="text-sm text-text-secondary mb-2">Donated NFTs</p>
                  <p className="font-mono text-2xl font-bold text-status-info">
                    {unclaimedNFTs.length}
                  </p>
                  <p className="text-xs text-text-muted mt-1">NFTs</p>
                </div>
              </div>
            </Card>
          </Container>
        </section>
      )}

      {/* Navigation */}
      <section className="py-12">
        <Container>
          <Card glass className="p-6 text-center">
            <p className="text-text-secondary mb-4">
              View your complete winning history and statistics
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/account">View Account Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/account/activity">View Activity History</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}
