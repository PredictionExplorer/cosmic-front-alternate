/**
 * Probability Display Component
 *
 * Shows the user's probability of winning raffle prizes
 * based on their number of bids in the current round.
 *
 * Formula: probability = 1 - ((totalBids - userBids) / totalBids)^numWinners
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/Card";
import { useApiData } from "@/contexts/ApiDataContext";
import api from "@/services/api";

interface ProbabilityData {
  raffleETH: number;
  raffleNFT: number;
  userBids: number;
  totalBids: number;
}

export function ProbabilityDisplay() {
  const { address } = useAccount();
  const { dashboardData } = useApiData();
  const [probabilities, setProbabilities] = useState<ProbabilityData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function calculateProbability() {
      if (!address || !dashboardData) {
        setProbabilities(null);
        return;
      }

      setIsLoading(true);
      try {
        const currentRound = dashboardData.CurRoundNum;
        const numEthWinners = dashboardData.NumRaffleEthWinnersBidding || 0;
        const numNftWinners = dashboardData.NumRaffleNFTWinnersBidding || 0;

        // Fetch all bids for current round
        const bids = await api.getBidListByRound(currentRound, "desc");
        const totalBids = bids.length;

        // Count user's bids in current round
        const userBids = bids.filter(
          (bid: { BidderAddr?: string }) =>
            bid.BidderAddr?.toLowerCase() === address.toLowerCase()
        ).length;

        if (totalBids === 0 || userBids === 0) {
          setProbabilities(null);
          return;
        }

        // Calculate probability using the formula:
        // P(win) = 1 - P(lose all draws)
        // P(lose all draws) = ((totalBids - userBids) / totalBids)^numWinners
        const calculateWinProbability = (numWinners: number): number => {
          if (numWinners === 0) return 0;
          const probability =
            1 - Math.pow((totalBids - userBids) / totalBids, numWinners);
          return Math.max(0, Math.min(1, probability)); // Clamp between 0 and 1
        };

        setProbabilities({
          raffleETH: calculateWinProbability(numEthWinners),
          raffleNFT: calculateWinProbability(numNftWinners),
          userBids,
          totalBids,
        });
      } catch (error) {
        console.error("Failed to calculate probabilities:", error);
        setProbabilities(null);
      } finally {
        setIsLoading(false);
      }
    }

    calculateProbability();
    
    // Refresh probabilities every 15 seconds
    const interval = setInterval(calculateProbability, 15000);
    return () => clearInterval(interval);
  }, [address, dashboardData]);

  // Don't render if user is not connected or has no bids
  if (!address || !probabilities || probabilities.userBids === 0) {
    return null;
  }

  const raffleEthAmount = dashboardData?.RaffleAmountEth
    ? (dashboardData.RaffleAmountEth as number) /
      (dashboardData.NumRaffleEthWinnersBidding as number)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card glass className="p-6 md:p-8">
        <div className="text-center mb-6">
          <h3 className="font-serif text-xl md:text-2xl font-semibold text-text-primary mb-2">
            Your Winning Chances
          </h3>
          <p className="text-sm text-text-secondary">
            Based on your {probabilities.userBids} bid
            {probabilities.userBids !== 1 ? "s" : ""} out of{" "}
            {probabilities.totalBids} total
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ETH Raffle Probability */}
          <div className="text-center">
            <div className="mb-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 mb-3">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-3xl md:text-4xl font-mono font-bold text-primary">
                {(probabilities.raffleETH * 100).toFixed(2)}%
              </div>
            </div>
            <div className="text-text-secondary text-sm">
              Chance of winning
            </div>
            <div className="text-primary font-semibold mt-1">
              {raffleEthAmount.toFixed(4)} ETH
            </div>
            <div className="text-text-muted text-xs mt-1">
              (ETH Raffle Prize)
            </div>
          </div>

          {/* NFT Raffle Probability */}
          <div className="text-center">
            <div className="mb-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-platinum/10 border-2 border-accent-platinum/20 mb-3">
                <span className="text-2xl">🎨</span>
              </div>
            </div>
            <div className="mb-2">
              <div className="text-3xl md:text-4xl font-mono font-bold text-accent-platinum">
                {(probabilities.raffleNFT * 100).toFixed(2)}%
              </div>
            </div>
            <div className="text-text-secondary text-sm">
              Chance of winning
            </div>
            <div className="text-accent-platinum font-semibold mt-1">
              Cosmic Signature
            </div>
            <div className="text-text-muted text-xs mt-1">
              (NFT Raffle Prize)
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-border-subtle">
          <div className="text-center text-xs text-text-muted space-y-1">
            <p>
              {dashboardData?.NumRaffleEthWinnersBidding || 0} ETH winners and{" "}
              {dashboardData?.NumRaffleNFTWinnersBidding || 0} NFT winners will
              be selected
            </p>
            <p>More bids = Higher chances of winning!</p>
          </div>
        </div>

        {isLoading && (
          <div className="absolute top-2 right-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
