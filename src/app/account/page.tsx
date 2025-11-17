"use client";

import { useState, useEffect, use, Suspense } from "react";
import { motion } from "framer-motion";
import { Trophy, Gem, Award, TrendingUp, Activity, Loader2, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/game/StatCard";
import { AlertCard } from "@/components/features/AlertCard";
import { formatEth, shortenAddress, formatTime } from "@/lib/utils";
import { api } from "@/services/api";
import { isAddress, formatEther } from "viem";

// User info API response interface
interface UserInfoAPI {
  Address: string;
  NumBids: number;
  CosmicSignatureNumTransfers: number;
  CosmicTokenNumTransfers: number;
  MaxBidAmount: number;
  NumPrizes: number;
  MaxWinAmount: number;
  SumRaffleEthWinnings: number;
  SumRaffleEthWithdrawal: number;
  UnclaimedNFTs: number;
  NumRaffleEthWinnings: number;
  RaffleNFTsCount: number;
  RewardNFTsCount: number;
  TotalCSTokensWon: number;
  StakingStatistics: {
    CSTStakingInfo: {
      NumActiveStakers: number;
      NumDeposits: number;
      TotalNumStakeActions: number;
      TotalNumUnstakeActions: number;
      TotalRewardEth: number;
      UnclaimedRewardEth: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
    RWalkStakingInfo: {
      NumActiveStakers: number;
      TotalNumStakeActions: number;
      TotalNumUnstakeActions: number;
      TotalTokensMinted: number;
      TotalTokensStaked: number;
    };
  };
}

interface UserBalance {
  CosmicTokenBalance: string;
  ETH_Balance: string;
}

// User winnings API response interface
interface UserWinningsAPI {
  DonatedERC20Tokens: Array<{
    TokenAddress: string;
    TokenSymbol: string;
    Amount: string;
  }>;
  ETHRaffleToClaim: number;
  ETHRaffleToClaimWei: string;
  NumDonatedNFTToClaim: number;
  UnclaimedStakingReward: number;
}

// Default user info
const DEFAULT_USER_INFO: UserInfoAPI = {
  Address: "",
  NumBids: 0,
  CosmicSignatureNumTransfers: 0,
  CosmicTokenNumTransfers: 0,
  MaxBidAmount: 0,
  NumPrizes: 0,
  MaxWinAmount: 0,
  SumRaffleEthWinnings: 0,
  SumRaffleEthWithdrawal: 0,
  UnclaimedNFTs: 0,
  NumRaffleEthWinnings: 0,
  RaffleNFTsCount: 0,
  RewardNFTsCount: 0,
  TotalCSTokensWon: 0,
  StakingStatistics: {
    CSTStakingInfo: {
      NumActiveStakers: 0,
      NumDeposits: 0,
      TotalNumStakeActions: 0,
      TotalNumUnstakeActions: 0,
      TotalRewardEth: 0,
      UnclaimedRewardEth: 0,
      TotalTokensMinted: 0,
      TotalTokensStaked: 0,
    },
    RWalkStakingInfo: {
      NumActiveStakers: 0,
      TotalNumStakeActions: 0,
      TotalNumUnstakeActions: 0,
      TotalTokensMinted: 0,
      TotalTokensStaked: 0,
    },
  },
};

const DEFAULT_WINNINGS: UserWinningsAPI = {
  DonatedERC20Tokens: [],
  ETHRaffleToClaim: 0,
  ETHRaffleToClaimWei: "0",
  NumDonatedNFTToClaim: 0,
  UnclaimedStakingReward: 0,
};

function AccountPageContent() {
  const { address: connectedAddress, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const addressParam = searchParams.get("address");
  
  // Use address from URL param if provided, otherwise use connected wallet
  const viewAddress = addressParam || connectedAddress;
  const isViewingOwnAccount = connectedAddress && viewAddress?.toLowerCase() === connectedAddress.toLowerCase();

  const [userInfo, setUserInfo] = useState<UserInfoAPI>(DEFAULT_USER_INFO);
  const [balance, setBalance] = useState({ CosmicToken: 0, ETH: 0 });
  const [winnings, setWinnings] = useState<UserWinningsAPI>(DEFAULT_WINNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (viewAddress) {
      navigator.clipboard.writeText(viewAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch user data from API
  useEffect(() => {
    async function fetchUserData() {
      if (!viewAddress) {
        setLoading(false);
        return;
      }

      // Validate Ethereum address
      if (!isAddress(viewAddress)) {
        setError("Invalid Ethereum address");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const [userInfoResponse, balanceResponse, winningsResponse] = await Promise.all([
          api.getUserInfo(viewAddress),
          api.getUserBalance(viewAddress),
          api.getUserWinnings(viewAddress),
        ]);

        // Set user info
        if (userInfoResponse && userInfoResponse.UserInfo) {
          setUserInfo(userInfoResponse.UserInfo);
        }

        // Set balances
        if (balanceResponse) {
          setBalance({
            CosmicToken: Number(formatEther(BigInt(balanceResponse.CosmicTokenBalance || "0"))),
            ETH: Number(formatEther(BigInt(balanceResponse.ETH_Balance || "0"))),
          });
        }

        // Set winnings
        if (winningsResponse) {
          setWinnings({
            ...winningsResponse,
            DonatedERC20Tokens: winningsResponse.DonatedERC20Tokens || [],
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [viewAddress]);

  const hasUnclaimedPrizes =
    winnings.ETHRaffleToClaim > 0 ||
    winnings.UnclaimedStakingReward > 0 ||
    winnings.DonatedERC20Tokens.length > 0 ||
    winnings.NumDonatedNFTToClaim > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-text-secondary">Loading account data...</p>
          </Card>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <h1 className="heading-sm mb-4 text-status-error">Error</h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  if (!viewAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
            <h1 className="heading-sm mb-4">Account Dashboard</h1>
            <p className="text-text-secondary mb-6">
              Connect your wallet or enter an address to view account information
            </p>
          </Card>
        </Container>
      </div>
    );
  }

  if (userInfo.NumBids === 0 && userInfo.TotalCSTokensWon === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <Trophy className="mx-auto mb-4 text-text-muted" size={64} />
            <h1 className="heading-sm mb-4">No Activity Yet</h1>
            <p className="text-text-secondary mb-6">
              This address hasn&apos;t participated in Cosmic Signature yet.
            </p>
            {isViewingOwnAccount && (
              <Button asChild>
                <Link href="/game/play">Place Your First Bid</Link>
              </Button>
            )}
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h1 className="heading-lg mb-2">
                {isViewingOwnAccount ? "Your Account" : "User Account"}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-text-secondary">{viewAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle2 size={16} className="text-status-success" />
                  ) : (
                    <Copy size={16} className="text-text-secondary hover:text-primary" />
                  )}
                </button>
                <a
                  href={`https://sepolia.arbiscan.io/address/${viewAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View on Arbiscan
                  <ExternalLink size={14} />
                </a>
              </div>
              <p className="text-text-secondary mt-2">
                {userInfo.NumBids} bids placed • {userInfo.NumPrizes} prizes won
              </p>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Alert for Unclaimed Prizes */}
      {isViewingOwnAccount && hasUnclaimedPrizes && (
        <section className="py-8">
          <Container>
            <AlertCard
              severity="warning"
              title="You have prizes to claim"
              description={`${formatEth(
                (Number(winnings.ETHRaffleToClaim) + Number(winnings.UnclaimedStakingReward)).toString()
              )} ETH${
                winnings.DonatedERC20Tokens.length > 0
                  ? ` + ${winnings.DonatedERC20Tokens.length} ERC-20 token${
                      winnings.DonatedERC20Tokens.length > 1 ? "s" : ""
                    }`
                  : ""
              }${
                winnings.NumDonatedNFTToClaim > 0
                  ? ` + ${winnings.NumDonatedNFTToClaim} donated NFT${
                      winnings.NumDonatedNFTToClaim > 1 ? "s" : ""
                    }`
                  : ""
              } waiting for you`}
              action={{
                label: "Claim Now →",
                onClick: () => (window.location.href = "/account/winnings"),
              }}
            />
          </Container>
        </section>
      )}

      {/* Balances */}
      {(balance.ETH > 0 || balance.CosmicToken > 0) && (
        <section className="py-12">
          <Container>
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
              Balances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {balance.ETH > 0 && (
                <Card glass className="p-6">
                  <p className="text-sm text-text-secondary mb-2">ETH Balance</p>
                  <p className="font-mono text-3xl font-bold text-primary">
                    {balance.ETH.toFixed(6)} ETH
                  </p>
                </Card>
              )}
              {balance.CosmicToken > 0 && (
                <Card glass className="p-6">
                  <p className="text-sm text-text-secondary mb-2">CST Balance</p>
                  <p className="font-mono text-3xl font-bold text-status-warning">
                    {balance.CosmicToken.toFixed(2)} CST
                  </p>
                </Card>
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Key Metrics */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
            Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total NFTs Won"
              value={userInfo.TotalCSTokensWon}
              icon={Gem}
            />
            <StatCard
              label="Raffle NFTs"
              value={userInfo.RaffleNFTsCount}
              icon={Award}
            />
            <StatCard
              label="Total Bids"
              value={userInfo.NumBids}
              icon={Activity}
            />
            <StatCard
              label="Total ETH Won"
              value={`${(
                Number(userInfo.SumRaffleEthWinnings) + Number(userInfo.SumRaffleEthWithdrawal)
              ).toFixed(4)} ETH`}
              icon={Trophy}
            />
          </div>
        </Container>
      </section>

      {/* Detailed Statistics */}
      <section className="py-12">
        <Container>
          <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
            Detailed Information
          </h2>
          <Card glass className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Number of Bids</span>
                <span className="font-mono text-text-primary">{userInfo.NumBids}</span>
              </div>
              
              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Number of Prizes</span>
                <span className="font-mono text-text-primary">{userInfo.NumPrizes}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Max Bid Amount</span>
                <span className="font-mono text-text-primary">{Number(userInfo.MaxBidAmount).toFixed(6)} ETH</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Max Win Amount</span>
                <span className="font-mono text-text-primary">{Number(userInfo.MaxWinAmount).toFixed(6)} ETH</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">ETH Raffle Winnings</span>
                <span className="font-mono text-text-primary">{Number(userInfo.SumRaffleEthWinnings).toFixed(6)} ETH</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">ETH Withdrawn</span>
                <span className="font-mono text-text-primary">{Number(userInfo.SumRaffleEthWithdrawal).toFixed(6)} ETH</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Raffles Participated</span>
                <span className="font-mono text-text-primary">{userInfo.NumRaffleEthWinnings}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Reward NFTs</span>
                <span className="font-mono text-text-primary">{userInfo.RewardNFTsCount}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">CS NFT Transfers</span>
                <span className="font-mono text-text-primary">{userInfo.CosmicSignatureNumTransfers}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">CST Token Transfers</span>
                <span className="font-mono text-text-primary">{userInfo.CosmicTokenNumTransfers}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-text-muted/10">
                <span className="text-text-secondary">Unclaimed Donated NFTs</span>
                <span className="font-mono text-text-primary">{userInfo.UnclaimedNFTs}</span>
              </div>
            </div>
          </Card>
        </Container>
      </section>

      {/* Staking Statistics */}
      <section className="py-12 bg-background-surface/50">
        <Container>
          <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
            Staking Statistics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CST Staking */}
            <Card glass className="p-8">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                Cosmic Signature Staking
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Active Stakers</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.CSTStakingInfo.NumActiveStakers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Deposits</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.CSTStakingInfo.NumDeposits}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Stake Actions</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.CSTStakingInfo.TotalNumStakeActions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unstake Actions</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.CSTStakingInfo.TotalNumUnstakeActions}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-text-muted/10">
                  <span className="text-text-secondary">Total Rewards</span>
                  <span className="font-mono text-primary font-semibold">
                    {Number(userInfo.StakingStatistics.CSTStakingInfo.TotalRewardEth).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unclaimed Rewards</span>
                  <span className="font-mono text-status-warning font-semibold">
                    {Number(userInfo.StakingStatistics.CSTStakingInfo.UnclaimedRewardEth).toFixed(6)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tokens Staked</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.CSTStakingInfo.TotalTokensStaked}
                  </span>
                </div>
              </div>
            </Card>

            {/* RandomWalk Staking */}
            <Card glass className="p-8">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                RandomWalk Staking
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Active Stakers</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.RWalkStakingInfo.NumActiveStakers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Stake Actions</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.RWalkStakingInfo.TotalNumStakeActions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unstake Actions</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.RWalkStakingInfo.TotalNumUnstakeActions}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-text-muted/10">
                  <span className="text-text-secondary">Tokens Minted</span>
                  <span className="font-mono text-primary font-semibold">
                    {userInfo.StakingStatistics.RWalkStakingInfo.TotalTokensMinted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tokens Staked</span>
                  <span className="font-mono text-text-primary">
                    {userInfo.StakingStatistics.RWalkStakingInfo.TotalTokensStaked}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Quick Actions */}
      {isViewingOwnAccount && (
        <section className="py-12">
          <Container>
            <h2 className="font-serif text-2xl font-semibold text-text-primary mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button size="lg" className="w-full" asChild>
                <Link href="/game/play">
                  <Trophy className="mr-2" size={20} />
                  Place a Bid
                </Link>
              </Button>

              {hasUnclaimedPrizes && (
                <Button size="lg" variant="secondary" className="w-full" asChild>
                  <Link href="/account/winnings">
                    <TrendingUp className="mr-2" size={20} />
                    Claim Prizes
                  </Link>
                </Button>
              )}

              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href="/account/nfts">
                  <Gem className="mr-2" size={20} />
                  View My NFTs
                </Link>
              </Button>

              <Button size="lg" variant="outline" className="w-full" asChild>
                <Link href="/account/activity">
                  <Activity className="mr-2" size={20} />
                  View Activity
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

export default function AccountDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
