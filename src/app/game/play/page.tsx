"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { explorer } from '@/lib/web3/chains';
import { motion } from "framer-motion";
import { Trophy, AlertCircle, Loader2, ChevronDown, X, Timer } from "lucide-react";
import { useAccount } from "wagmi";
import { CONTRACTS, isDeployedAddress } from "@/lib/web3/contracts";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { useCosmicGame } from "@/hooks/useCosmicGameContract";
import { useRandomWalkNFT } from "@/hooks/useRandomWalkNFT";
import { usePlaceBid } from "@/hooks/usePlaceBid";
import { useClaimPrize } from "@/hooks/useClaimPrize";
import { useApiData } from "@/contexts/ApiDataContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useTimeOffset } from "@/contexts/TimeOffsetContext";
import { formatWeiToEth } from "@/lib/web3/utils";
import { validateBidMessageLength, getByteLength } from "@/lib/web3/errorDecoder";
import { formatEth, formatTime } from "@/lib/utils";
import { api } from "@/services/api";
import { useApiQuery } from "@/hooks/useApiQuery";

export default function PlayPage() {
  const { address, isConnected } = useAccount();
  const { read, transactionHash } = useCosmicGame();
  const { read: readRandomWalk } = useRandomWalkNFT();
  const { dashboardData, refresh: refreshDashboard } = useApiData();
  const { showWarning } = useNotification();
  const { applyOffset } = useTimeOffset();

  const { placeEthBid, placeCstBid, isSubmitting: isBidSubmitting } = usePlaceBid();
  const { claimMainPrize, isSubmitting: isClaimSubmitting } = useClaimPrize();
  const isTransactionPending = isBidSubmitting || isClaimSubmitting;

  // UI State
  const [bidType, setBidType] = useState<"ETH" | "CST">("ETH");
  const [useRandomWalkNft, setUseRandomWalkNft] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<bigint | null>(null);
  const [bidMessage, setBidMessage] = useState("");
  const [bidMessageError, setBidMessageError] = useState("");
  const [maxCstPrice, setMaxCstPrice] = useState("");
  const [priceBuffer, setPriceBuffer] = useState(2);
  const [showHelpCard, setShowHelpCard] = useState(true);

  // Advanced Options State
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [donationType, setDonationType] = useState<"nft" | "token">("nft");
  const [donationNftAddress, setDonationNftAddress] = useState("");
  const [donationNftTokenId, setDonationNftTokenId] = useState("");
  const [donationTokenAddress, setDonationTokenAddress] = useState("");
  const [donationTokenAmount, setDonationTokenAmount] = useState("");

  // Get data from dashboard API and blockchain
  const roundNum = dashboardData?.CurRoundNum;
  const lastBidder = dashboardData?.LastBidderAddr;
  const { data: ethBidPriceRaw, refetch: refetchEthPrice, error: ethPriceError } =
    read.useEthBidPrice();
  const { data: cstBidPriceRaw, refetch: refetchCstPrice, error: cstPriceError } =
    read.useCstBidPrice();

  // API fallback for CST bid price
  const { data: apiFallbackCstWei } = useApiQuery<bigint | null>(
    "play-cst-price-fallback",
    async () => {
      const priceData = await api.getCSTPrice();
      const weiStr = priceData?.CSTPrice ?? priceData?.cst_price ?? priceData?.price ?? priceData?.NextBidPrice;
      if (weiStr != null) return BigInt(String(weiStr));
      return null;
    },
    { enabled: cstBidPriceRaw === undefined || cstBidPriceRaw === null, refetchInterval: 5000 },
  );

  const effectiveCstBidPriceRaw = (cstBidPriceRaw as bigint | undefined) ?? apiFallbackCstWei ?? undefined;

  // API fallback for ETH bid price
  const { data: apiFallbackPriceWei } = useApiQuery<bigint | null>(
    "play-eth-price-fallback",
    async () => {
      const priceData = await api.getETHBidPrice();
      const weiStr = priceData?.ETHPrice ?? priceData?.eth_price ?? priceData?.price;
      if (weiStr != null) return BigInt(String(weiStr));
      return null;
    },
    { enabled: !ethBidPriceRaw, refetchInterval: 5000 },
  );

  const effectiveEthBidPriceRaw = (ethBidPriceRaw as bigint | undefined) ?? apiFallbackPriceWei ?? undefined;
  const { data: prizeAmount, refetch: refetchPrizeAmount } =
    read.useMainPrizeAmount();
  const { data: cstRewardPerBid } = read.useCstRewardPerBid();

  // Get user's Random Walk NFTs
  const { data: userNfts, refetch: refetchWalletNfts } =
    readRandomWalk.useWalletOfOwner(address);

  const ownedNfts = (userNfts as bigint[] | undefined) ?? [];

  // Auto-refresh blockchain data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchEthPrice();
      refetchCstPrice();
      refetchPrizeAmount();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetchEthPrice, refetchCstPrice, refetchPrizeAmount]);

  // Track previous values to prevent unnecessary refetches
  const prevRoundRef = useRef<number | undefined>(undefined);
  const prevBidsRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (dashboardData) {
      const currentRound = dashboardData.CurRoundNum;
      const currentBids = dashboardData.CurNumBids;
      if (prevRoundRef.current !== currentRound || prevBidsRef.current !== currentBids) {
        prevRoundRef.current = currentRound;
        prevBidsRef.current = currentBids;
        refetchEthPrice();
        refetchCstPrice();
        refetchPrizeAmount();
      }
    }
  }, [dashboardData, refetchEthPrice, refetchCstPrice, refetchPrizeAmount]);

  // Fetch used NFTs from API
  const { data: usedNftsData, refetch: refetchUsedNfts } = useApiQuery<number[]>(
    "play-used-nfts",
    async () => {
      const response = await api.getUsedRWLKNfts();
      let normalizedList: number[] = [];
      if (Array.isArray(response)) {
        normalizedList = response.map((item) => {
          if (typeof item === "object" && item !== null && "RWalkTokenId" in item) {
            return Number(item.RWalkTokenId);
          }
          return Number(item);
        });
      }
      return normalizedList;
    },
    { refetchInterval: 15000 },
  );
  const usedNfts = usedNftsData ?? [];

  // Fetch last bid message from API
  const { data: lastBidMessageData } = useApiQuery<string>(
    roundNum != null ? `play-last-bid-${roundNum}` : "",
    async () => {
      const bids = await api.getBidListByRound(Number(roundNum), "desc");
      return (bids && bids.length > 0) ? (bids[0].Message || "") : "";
    },
    { enabled: roundNum != null, refetchInterval: 5000 },
  );
  const lastBidMessage = lastBidMessageData ?? "";

  // Filter out used NFTs and sort
  const availableNfts = ownedNfts
    .filter((nftId) => !usedNfts.includes(Number(nftId)))
    .sort((a, b) => Number(a) - Number(b));

  // Clear selected NFT if no longer available
  useEffect(() => {
    if (selectedNftId !== null && !availableNfts.some((id) => id === selectedNftId)) {
      setSelectedNftId(null);
    }
  }, [availableNfts, selectedNftId]);

  // Prize time
  const { data: mainPrizeTime } = useApiQuery<number | null>(
    "play-prize-time",
    () => api.getPrizeTime(),
    { refetchInterval: 10000 },
  );

  // Calculate timer with offset
  const [timeRemaining, setTimeRemaining] = useState(0);
  useEffect(() => {
    if (mainPrizeTime) {
      const update = () => {
        const adjustedPrizeTime = applyOffset(Number(mainPrizeTime));
        const remaining = adjustedPrizeTime - Math.floor(Date.now() / 1000);
        setTimeRemaining(Math.max(0, remaining));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [mainPrizeTime, applyOffset]);

  // Claim timeout check
  const claimTimeoutExpired =
    mainPrizeTime &&
    dashboardData?.TimeoutClaimPrize &&
    timeRemaining <= 1 &&
    Date.now() / 1000 > applyOffset(Number(mainPrizeTime)) + dashboardData.TimeoutClaimPrize;

  const numBids = (dashboardData?.CurNumBids as number) || 0;
  const hasBids =
    numBids > 0 &&
    lastBidder &&
    lastBidder !== "0x0000000000000000000000000000000000000000" &&
    (lastBidder as string).toLowerCase() !== "0x0000000000000000000000000000000000000000";

  // Round activation
  const roundActivationTimestamp: number | null = useMemo(() => {
    const activationVal = dashboardData?.CurRoundStats?.ActivationTime;
    if (activationVal == null || activationVal === "" || activationVal === "0" || activationVal === 0) return null;
    if (typeof activationVal === "number") return activationVal;
    const num = Number(activationVal);
    if (!isNaN(num) && num > 1_000_000_000) return num;
    const parsed = new Date(activationVal as string).getTime();
    if (!isNaN(parsed)) return Math.floor(parsed / 1000);
    return null;
  }, [dashboardData?.CurRoundStats?.ActivationTime]);

  const [timeUntilRoundStarts, setTimeUntilRoundStarts] = useState(0);
  useEffect(() => {
    if (roundActivationTimestamp === null) {
      setTimeUntilRoundStarts(0);
      return;
    }
    const updateTimer = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const adjustedStart = applyOffset(roundActivationTimestamp);
      setTimeUntilRoundStarts(Math.max(0, adjustedStart - currentTime));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roundActivationTimestamp, applyOffset]);

  const hasEverLoadedRef = useRef(false);
  useEffect(() => {
    if (dashboardData && roundNum !== undefined && roundNum !== null) {
      hasEverLoadedRef.current = true;
    }
  }, [dashboardData, roundNum]);

  const hasRoundData = hasEverLoadedRef.current || (!!dashboardData && roundNum !== undefined && roundNum !== null);
  const hasActivationDelay = roundActivationTimestamp !== null && timeUntilRoundStarts > 0;
  const isRoundActive = hasRoundData && !hasActivationDelay;

  const canClaimMainPrize =
    isConnected &&
    address &&
    hasBids &&
    timeRemaining <= 5 &&
    (address.toLowerCase() === (lastBidder as string).toLowerCase() || claimTimeoutExpired);

  // Format prices
  const ethBidPrice = effectiveEthBidPriceRaw
    ? parseFloat(formatWeiToEth(effectiveEthBidPriceRaw, 6))
    : 0;
  const cstBidPrice = effectiveCstBidPriceRaw
    ? parseFloat(formatWeiToEth(effectiveCstBidPriceRaw, 2))
    : 0;

  const adjustedEthPrice = ethBidPrice * (1 + priceBuffer / 100);
  const discountedEthPrice = useRandomWalkNft ? adjustedEthPrice * 0.5 : adjustedEthPrice;

  const cstRewardAmount = cstRewardPerBid
    ? Number(cstRewardPerBid) / 1e18
    : 100;

  // Build donation object from form state
  const buildDonation = () => {
    if (donationType === "nft" && donationNftAddress && donationNftTokenId) {
      return { type: "nft" as const, address: donationNftAddress, tokenId: donationNftTokenId };
    }
    if (donationType === "token" && donationTokenAddress && donationTokenAmount) {
      return { type: "token" as const, address: donationTokenAddress, amount: donationTokenAmount };
    }
    return null;
  };

  const handleEthBid = async () => {
    if (!isRoundActive) {
      showWarning(`Round has not started yet. Please wait ${formatTime(timeUntilRoundStarts)}.`);
      return;
    }
    if (!effectiveEthBidPriceRaw) {
      return;
    }

    const success = await placeEthBid({
      bidMessage,
      ethBidPrice: effectiveEthBidPriceRaw,
      priceBuffer,
      useRandomWalkNft,
      selectedNftId,
      donation: buildDonation(),
    });

    if (success) {
      setBidMessage("");
      setDonationNftAddress("");
      setDonationNftTokenId("");
      setDonationTokenAddress("");
      setDonationTokenAmount("");

      setTimeout(async () => {
        refreshDashboard();
        refetchEthPrice();
        refetchCstPrice();
        refetchPrizeAmount();
        if (useRandomWalkNft || (donationType === "nft" && donationNftAddress && donationNftTokenId)) {
          try {
            await refetchWalletNfts();
            refetchUsedNfts();
            if (useRandomWalkNft && selectedNftId !== null) setSelectedNftId(null);
          } catch {}
        }
      }, 2000);
    }
  };

  const handleCstBid = async () => {
    if (!isRoundActive) {
      showWarning(`Round has not started yet. Please wait ${formatTime(timeUntilRoundStarts)}.`);
      return;
    }
    if (effectiveCstBidPriceRaw === undefined) {
      return;
    }

    const success = await placeCstBid({
      bidMessage,
      cstBidPrice: effectiveCstBidPriceRaw,
      maxCstPrice,
      donation: buildDonation(),
    });

    if (success) {
      setBidMessage("");
      setDonationNftAddress("");
      setDonationNftTokenId("");
      setDonationTokenAddress("");
      setDonationTokenAmount("");

      setTimeout(async () => {
        refreshDashboard();
        refetchEthPrice();
        refetchCstPrice();
        refetchPrizeAmount();
        if (donationType === "nft" && donationNftAddress && donationNftTokenId) {
          try {
            await refetchWalletNfts();
          } catch {}
        }
      }, 2000);
    }
  };

  const handleClaimMainPrize = async () => {
    if (timeRemaining > 5) {
      showWarning(`Please wait ${Math.ceil(timeRemaining)} more seconds before claiming the prize.`);
      return;
    }

    const success = await claimMainPrize();
    if (success) {
      setTimeout(() => refreshDashboard(), 2000);
    }
  };

  // Prepare display data
  const currentRound = {
    roundNumber: (roundNum != null && roundNum >= 0) ? roundNum.toString() : "0",
    prizePool: prizeAmount
      ? parseFloat(formatWeiToEth(prizeAmount as bigint, 4))
      : 0,
    totalBids: (dashboardData?.CurNumBids as number) || 0,
    lastBidder: (lastBidder as string) || "0x0",
    timeRemaining,
  };

  const contractDeployed = isDeployedAddress(CONTRACTS.COSMIC_GAME);

  return (
    <div className="min-h-screen">
      {/* Wrong-network / undeployed banner */}
      {!contractDeployed && (
        <div className="w-full bg-status-error/10 border-b border-status-error/40 text-status-error py-3">
          <Container>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <AlertCircle size={16} />
              Cosmic Signature is not deployed on this network. Please switch your wallet to the correct network before placing bids.
            </div>
          </Container>
        </div>
      )}

      {/* Compact Header with Round Info */}
      <section className="py-6 bg-background-surface/50 border-b border-text-muted/10">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left: Round Number */}
            <div>
              <div className="text-4xl font-bold font-serif text-gradient mb-2">
                Round {currentRound.roundNumber}
              </div>
              <div className="flex items-center gap-2">
                {!hasRoundData ? (
                  <Badge variant="default">Loading...</Badge>
                ) : !isRoundActive && timeUntilRoundStarts > 0 ? (
                  <Badge variant="default">Pending Activation</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
                <span className="text-sm text-text-muted">
                  {currentRound.totalBids} bid{currentRound.totalBids !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            {/* Center: Countdown Timer */}
            <div className="flex justify-center">
              {!hasRoundData ? (
                <div className="text-center">
                  <div className="text-sm text-text-muted mb-2">Loading Round Data...</div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : !isRoundActive && timeUntilRoundStarts > 0 ? (
                <div className="text-center">
                  <div className="text-base font-semibold text-status-info mb-2 uppercase tracking-wider">Round Starts In</div>
                  <CountdownTimer targetSeconds={timeUntilRoundStarts} size="lg" />
                </div>
              ) : timeRemaining > 0 ? (
                <CountdownTimer targetSeconds={timeRemaining} size="lg" />
              ) : null}
            </div>
            
            {/* Right: Prize Pool */}
            <div className="text-right">
              <div className="text-sm text-text-secondary mb-1">Prize Pool</div>
              <div className="text-2xl font-serif font-bold text-gradient">
                {formatEth(dashboardData?.PrizeAmountEth || 0)} ETH
              </div>
            </div>
          </div>
          
          {/* Last Bidder Info */}
          {lastBidder && lastBidder !== "0x0000000000000000000000000000000000000000" && (
            <div className="mt-4 pt-4 border-t border-text-muted/10">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary">Last Bidder:</span>
                <span className="font-mono text-primary">{lastBidder}</span>
                {lastBidMessage && (
                  <>
                    <span className="text-text-muted">&bull;</span>
                    <span className="text-text-secondary italic">{lastBidMessage}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Claim Main Prize Banner */}
      {canClaimMainPrize ? (
        <section className="py-8 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-y border-primary/30">
          <Container>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center space-x-2 mb-4">
                <Trophy size={32} className="text-primary animate-pulse" />
                <h2 className="text-3xl font-serif font-bold text-primary">
                  Claim Your Main Prize!
                </h2>
                <Trophy size={32} className="text-primary animate-pulse" />
              </div>
              <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                {claimTimeoutExpired ? (
                  <>
                    The winner didn&apos;t claim within 24 hours! Claim the prize
                    now to receive{" "}
                  </>
                ) : timeRemaining > 0 && timeRemaining <= 5 ? (
                  <>
                    The countdown is finishing! Wait a few more seconds for blockchain 
                    synchronization, then claim your prize to receive{" "}
                  </>
                ) : (
                  <>
                    The countdown has ended and you are the last bidder. Claim
                    your prize now to receive{" "}
                  </>
                )}
                <span className="text-primary font-semibold">
                  {(currentRound.prizePool * 0.25).toFixed(4)} ETH
                </span>{" "}
                and a{" "}
                <span className="text-primary font-semibold">
                  Cosmic Signature NFT
                </span>
                !
              </p>
              {isTransactionPending ? (
                <Button size="xl" disabled className="shadow-luxury-lg">
                  <Loader2 className="mr-2 animate-spin" size={24} />
                  Processing Transaction...
                </Button>
              ) : (
                <div className="space-y-2">
                <Button
                  size="xl"
                  onClick={handleClaimMainPrize}
                    className="shadow-luxury-lg animate-pulse w-full"
                >
                  <Trophy className="mr-2" size={24} />
                  Claim Main Prize
                </Button>
                  {timeRemaining > 0 && timeRemaining <= 5 && (
                    <p className="text-xs text-status-info text-center">
                      Almost ready! Wait {Math.ceil(timeRemaining)} more second{Math.ceil(timeRemaining) !== 1 ? 's' : ''} for blockchain sync...
                    </p>
                  )}
                </div>
              )}
              {!claimTimeoutExpired && (
                <p className="text-xs text-text-muted mt-4">
                  Important: You have 1 day to claim. After that, anyone can
                  claim and receive your prize.
                </p>
              )}
            </motion.div>
          </Container>
        </section>
      ) : null}

      {/* Main Dashboard */}
      <section className="py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Bid Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bid Type Selector */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Place Your Bid</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ETH or CST Toggle */}
                  <div className="flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
                    <button
                      onClick={() => setBidType("ETH")}
                      disabled={isTransactionPending || !isRoundActive}
                      className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                        bidType === "ETH"
                          ? "bg-primary/10 text-primary"
                          : !isRoundActive
                          ? "text-text-muted opacity-50"
                          : "text-text-secondary hover:text-primary"
                      }`}
                    >
                      ETH Bid
                    </button>
                    <button
                      onClick={() => setBidType("CST")}
                      disabled={isTransactionPending || !isRoundActive || numBids === 0}
                      className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                        bidType === "CST"
                          ? "bg-primary/10 text-primary"
                          : !isRoundActive || numBids === 0
                          ? "text-text-muted opacity-50 cursor-not-allowed"
                          : "text-text-secondary hover:text-primary"
                      }`}
                      title={numBids === 0 ? "First bid must be ETH" : !isRoundActive ? "Round not active yet" : ""}
                    >
                      CST Bid
                      {numBids === 0 && (
                        <span className="text-xs block font-semibold text-status-warning">(First bid must be ETH)</span>
                      )}
                    </button>
                  </div>

                  {bidType === "ETH" ? (
                    <>
                      {/* Current ETH Price */}
                      <div className="space-y-2">
                        <label className="text-sm text-text-secondary">
                          Current Bid Price
                        </label>
                        <div className="flex items-baseline space-x-2">
                          <span className="font-mono text-4xl font-semibold text-primary">
                            {ethBidPrice.toFixed(6)}
                          </span>
                          <span className="text-text-secondary">ETH</span>
                        </div>
                        {useRandomWalkNft && (
                          <p className="text-xs text-status-success">
                            50% discount applied with Random Walk NFT
                          </p>
                        )}
                      </div>

                      {/* Random Walk NFT Toggle */}
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={useRandomWalkNft}
                            onChange={(e) => {
                              setUseRandomWalkNft(e.target.checked);
                              if (!e.target.checked) {
                                setSelectedNftId(null);
                              }
                            }}
                            disabled={isTransactionPending}
                            className="h-5 w-5 rounded border-text-muted/30 bg-background-elevated text-primary"
                          />
                          <span className="text-text-primary group-hover:text-primary transition-colors">
                            Use Random Walk NFT (50% discount)
                          </span>
                        </label>

                        {/* NFT List */}
                        {useRandomWalkNft && (
                          <div className="ml-8 space-y-3">
                            {ownedNfts.length === 0 ? (
                              <div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20">
                                <p className="text-sm text-text-secondary flex items-start">
                                  <AlertCircle
                                    size={16}
                                    className="mr-2 mt-0.5 flex-shrink-0 text-status-error"
                                  />
                                  You don&apos;t own any Random Walk NFTs.
                                </p>
                              </div>
                            ) : availableNfts.length === 0 ? (
                              <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
                                <p className="text-sm text-text-secondary flex items-start">
                                  <AlertCircle
                                    size={16}
                                    className="mr-2 mt-0.5 flex-shrink-0 text-status-warning"
                                  />
                                  All your Random Walk NFTs ({ownedNfts.length})
                                  have already been used.
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <label className="text-sm text-text-secondary">
                                    Select Random Walk NFT (
                                    {availableNfts.length} available
                                    {ownedNfts.length > availableNfts.length &&
                                      `, ${
                                        ownedNfts.length - availableNfts.length
                                      } used`}
                                    )
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-background-elevated border border-text-muted/10">
                                    {availableNfts.map((nftId) => (
                                      <button
                                        key={nftId.toString()}
                                        onClick={() => setSelectedNftId(nftId)}
                                        disabled={isTransactionPending}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                                          selectedNftId === nftId
                                            ? "border-status-info bg-status-info/10 shadow-lg"
                                            : "border-text-muted/20 bg-background-surface hover:border-primary/40"
                                        }`}
                                      >
                                        <div className="text-xs text-text-secondary">
                                          Token ID
                                        </div>
                                        <div className={`font-mono text-lg font-semibold ${
                                          selectedNftId === nftId ? "text-status-info" : "text-primary"
                                        }`}>
                                          #{nftId.toString()}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {selectedNftId !== null ? (
                                  <div className="p-3 rounded-lg bg-status-info/10 border border-status-info/20">
                                    <p className="text-xs text-text-primary font-medium">
                                      You have selected token #{Number(selectedNftId)} to get 50% discount in bid price
                                    </p>
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/20">
                                    <p className="text-xs text-text-secondary flex items-start">
                                      <AlertCircle
                                        size={14}
                                        className="mr-2 mt-0.5 flex-shrink-0 text-status-warning"
                                      />
                                      Warning: Each Random Walk NFT can only be
                                      used once, ever. This action is permanent.
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Current CST Price */}
                      <div className="space-y-2">
                        <label className="text-sm text-text-secondary">
                          Current CST Bid Price
                        </label>
                        <div className="flex items-baseline space-x-2">
                          {numBids === 0 ? (
                            <span className="font-mono text-2xl font-semibold text-status-warning">
                              ETH bid required first
                            </span>
                          ) : cstBidPrice === 0 ? (
                            <>
                              <span className="font-mono text-4xl font-semibold text-status-success">
                                FREE
                              </span>
                              <span className="text-status-success">BID</span>
                            </>
                          ) : (
                            <>
                              <span className="font-mono text-4xl font-semibold text-primary">
                                {cstBidPrice.toFixed(2)}
                              </span>
                              <span className="text-text-secondary">CST</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          {numBids === 0
                            ? "The first bid in each round must be placed with ETH."
                            : cstBidPrice === 0
                            ? "Dutch auction ended - Bid for free!"
                            : "Price decreases to 0 over time"}
                        </p>
                      </div>

                      {/* Max Price Protection */}
                      {cstBidPrice > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm text-text-secondary">
                            Maximum Price (Slippage Protection)
                          </label>
                          <input
                            type="number"
                            value={maxCstPrice}
                            onChange={(e) => setMaxCstPrice(e.target.value)}
                            placeholder={`Leave empty for auto (${(cstBidPrice * 1.1).toFixed(2)} CST)`}
                            disabled={isTransactionPending}
                            className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <p className="text-xs text-text-secondary">
                            Your bid will revert if the price increases above
                            this limit
                          </p>
                        </div>
                      )}

                      {/* Free Bid Info */}
                      {cstBidPrice === 0 && (
                        <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
                          <p className="text-sm text-text-secondary text-center">
                            This is a{" "}
                            <span className="text-status-success font-semibold">
                              free bid
                            </span>
                            ! No CST tokens required.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm text-text-secondary">
                      Message (Optional)
                    </label>
                    <textarea
                      value={bidMessage}
                      onChange={(e) => {
                        const newMessage = e.target.value;
                        setBidMessage(newMessage);
                        const validation = validateBidMessageLength(newMessage);
                        setBidMessageError(!validation.isValid ? (validation.error || '') : '');
                      }}
                      rows={3}
                      disabled={isTransactionPending}
                      placeholder="Add a message with your bid..."
                      className={`w-full px-4 py-3 rounded-lg bg-background-elevated border ${
                        bidMessageError 
                          ? 'border-status-error' 
                          : 'border-text-muted/10'
                      } text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none`}
                    />
                    {bidMessageError ? (
                      <p className="text-xs text-status-error">{bidMessageError}</p>
                    ) : (
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>Maximum 280 bytes (some Unicode chars use multiple bytes)</span>
                        <span className={getByteLength(bidMessage) > 280 ? 'text-status-error font-semibold' : ''}>
                          {getByteLength(bidMessage)}/280 bytes
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      disabled={isTransactionPending}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 hover:border-primary/40 transition-colors"
                    >
                      <span className="text-sm text-text-secondary">
                        Advanced Options
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform ${
                          showAdvancedOptions ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showAdvancedOptions && (
                      <div className="space-y-4 p-4 rounded-lg bg-background-elevated border border-text-muted/10">
                        <p className="text-xs text-text-secondary">
                          Advanced options for price collision prevention and
                          donations while bidding.
                        </p>

                        {/* Price Collision Prevention */}
                        {bidType === "ETH" && (
                          <div className="space-y-2">
                            <label className="text-sm text-text-secondary font-medium">
                              Price Collision Prevention (+{priceBuffer}%)
                            </label>
                            <div className="flex items-center space-x-4">
                              <input
                                type="range"
                                min="0"
                                max="10"
                                value={priceBuffer}
                                onChange={(e) => setPriceBuffer(Number(e.target.value))}
                                className="flex-1"
                                disabled={isTransactionPending}
                              />
                              <span className="font-mono text-sm text-primary w-16">
                                {priceBuffer}%
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-text-muted">
                              <span>You&apos;ll pay:</span>
                              <span className="font-mono text-primary">
                                {discountedEthPrice.toFixed(6)} ETH
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary">
                              Adds a buffer to prevent your bid from failing if
                              someone bids simultaneously
                            </p>
                          </div>
                        )}

                        {/* Donation Type Selection */}
                        <div>
                          <label className="text-sm text-text-secondary font-medium mb-2 block">
                            Donation Type (Optional)
                          </label>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => setDonationType("nft")}
                              disabled={isTransactionPending}
                              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                donationType === "nft"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-background-surface text-text-secondary hover:text-primary"
                              }`}
                            >
                              Donate NFT
                            </button>
                            <button
                              type="button"
                              onClick={() => setDonationType("token")}
                              disabled={isTransactionPending}
                              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                                donationType === "token"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-background-surface text-text-secondary hover:text-primary"
                              }`}
                            >
                              Donate ERC20
                            </button>
                          </div>
                          <p className="text-xs text-text-muted mt-2">
                            Leave fields empty to skip donation
                          </p>
                        </div>

                        {/* NFT Donation Fields */}
                        {donationType === "nft" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-sm text-text-secondary">
                                NFT Contract Address
                              </label>
                              <input
                                type="text"
                                value={donationNftAddress}
                                onChange={(e) => setDonationNftAddress(e.target.value)}
                                placeholder="0x..."
                                disabled={isTransactionPending}
                                className="w-full px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-text-secondary">
                                NFT Token ID
                              </label>
                              <input
                                type="text"
                                value={donationNftTokenId}
                                onChange={(e) => setDonationNftTokenId(e.target.value)}
                                placeholder="0"
                                disabled={isTransactionPending}
                                className="w-full px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {/* ERC20 Token Donation Fields */}
                        {donationType === "token" && (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-sm text-text-secondary">
                                Token Contract Address
                              </label>
                              <input
                                type="text"
                                value={donationTokenAddress}
                                onChange={(e) => setDonationTokenAddress(e.target.value)}
                                placeholder="0x..."
                                disabled={isTransactionPending}
                                className="w-full px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm text-text-secondary">
                                Token Amount
                              </label>
                              <input
                                type="text"
                                value={donationTokenAmount}
                                onChange={(e) => setDonationTokenAmount(e.target.value)}
                                placeholder="0.0"
                                disabled={isTransactionPending}
                                className="w-full px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                              />
                              <p className="text-xs text-text-muted">
                                Enter the amount in token&apos;s base unit
                                (e.g., 1.5 for 1.5 tokens)
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Round Activation Notice */}
                  {!hasRoundData ? (
                    <div className="p-6 rounded-lg bg-background-elevated/50 border border-text-muted/10 mb-4">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                        <p className="text-sm text-text-secondary">
                          Loading round activation data...
                        </p>
                      </div>
                    </div>
                  ) : !isRoundActive && timeUntilRoundStarts > 0 ? (
                    <div className="p-6 rounded-lg bg-status-info/10 border border-status-info/20 mb-4">
                      <div className="text-center space-y-4">
                        <p className="text-sm font-semibold text-status-info">
                          The current bidding round is not active yet.
                        </p>
                        <div className="flex justify-center">
                          <CountdownTimer targetSeconds={timeUntilRoundStarts} size="lg" />
                        </div>
                        <p className="text-xs text-text-muted">
                          Bidding will open when the countdown reaches zero
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Submit Button */}
                  {!isConnected ? (
                    <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
                      <p className="text-sm text-text-secondary text-center">
                        <AlertCircle className="inline mr-2" size={16} />
                        Please connect your wallet to place a bid
                      </p>
                    </div>
                  ) : isTransactionPending ? (
                    <Button size="lg" className="w-full" disabled>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Processing Transaction...
                    </Button>
                  ) : !hasRoundData ? (
                    <Button size="lg" className="w-full" disabled>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Loading Round Data...
                    </Button>
                  ) : !isRoundActive ? (
                    <Button size="lg" className="w-full" disabled>
                      <Timer className="mr-2" size={20} />
                      Round Not Active - Wait for Countdown
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={bidType === "ETH" ? handleEthBid : handleCstBid}
                    >
                      <Trophy className="mr-2" size={20} />
                      Place {bidType} Bid
                      {bidType === "ETH" &&
                        ` (${discountedEthPrice.toFixed(6)} ETH)`}
                      {bidType === "CST" && cstBidPrice === 0 && " (FREE)"}
                      {bidType === "CST" &&
                        cstBidPrice > 0 &&
                        ` (${cstBidPrice.toFixed(2)} CST)`}
                    </Button>
                  )}

                  {/* Reward Info */}
                  <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
                    <p className="text-sm text-text-secondary text-center">
                      You&apos;ll earn{" "}
                      <span className="text-status-success font-semibold">
                        {cstRewardAmount} CST
                      </span>{" "}
                      tokens for placing this bid
                    </p>
                  </div>

                  {/* Transaction Status */}
                  {transactionHash && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-text-secondary">
                        Transaction:{" "}
                        <a
                          href={explorer.tx(transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono"
                        >
                          {transactionHash.slice(0, 10)}...
                          {transactionHash.slice(-8)}
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Stats and Info */}
            <div className="space-y-6">
              {/* Price Stats */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Bid Prices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
                      ETH Bid
                    </p>
                    <p className="font-mono text-2xl font-semibold text-primary">
                      {ethBidPrice.toFixed(6)} ETH
                    </p>
                    {useRandomWalkNft && (
                      <p className="text-xs text-status-success mt-1">
                        w/ RandomWalk: {(ethBidPrice * 0.5).toFixed(6)} ETH
                      </p>
                    )}
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      cstBidPrice === 0
                        ? "bg-status-success/5 border border-status-success/10"
                        : "bg-status-info/5 border border-status-info/10"
                    }`}
                  >
                    <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
                      CST Bid
                    </p>
                    <p
                      className={`font-mono text-2xl font-semibold ${
                        numBids === 0
                          ? "text-status-warning"
                          : cstBidPrice === 0
                          ? "text-status-success"
                          : "text-status-info"
                      }`}
                    >
                      {numBids === 0
                        ? "ETH first"
                        : cstBidPrice === 0
                        ? "FREE"
                        : `${cstBidPrice.toFixed(2)} CST`}
                    </p>
                    {numBids === 0 && (
                      <p className="text-xs text-status-warning mt-1">First bid must be ETH</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Prize Breakdown */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Prize Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      label: "Main Prize",
                      value: `${(
                        currentRound.prizePool *
                        ((dashboardData?.PrizePercentage || 0) / 100)
                      ).toFixed(4)} ETH`,
                      percentage: `${dashboardData?.PrizePercentage || 0}%`,
                      subtitle: "+ 1 NFT",
                    },
                    {
                      label: "Endurance Champion",
                      value: `${currentRound.totalBids * 10} CST`,
                      percentage: "",
                      subtitle: "+ 1 NFT",
                    },
                    {
                      label: "Last CST Bidder",
                      value: `${currentRound.totalBids * 10} CST`,
                      percentage: "",
                      subtitle: "+ 1 NFT (if CST bids placed)",
                    },
                    {
                      label: "Chrono-Warrior",
                      value: `${(
                        currentRound.prizePool *
                        ((dashboardData?.ChronoWarriorPercentage || 0) / 100)
                      ).toFixed(4)} ETH`,
                      percentage: `${dashboardData?.ChronoWarriorPercentage || 0}%`,
                      subtitle: "",
                    },
                    {
                      label: `Raffle (${dashboardData?.NumRaffleEthWinnersBidding || 0} winners)`,
                      value: `${(
                        currentRound.prizePool *
                        ((dashboardData?.RafflePercentage || 0) / 100)
                      ).toFixed(4)} ETH`,
                      percentage: `${dashboardData?.RafflePercentage || 0}%`,
                      subtitle: "Split among winners",
                    },
                    {
                      label: "Raffle NFTs",
                      value: `${
                        (dashboardData?.NumRaffleNFTWinnersBidding || 0) +
                        (dashboardData?.NumRaffleNFTWinnersStakingRWalk || 0)
                      } NFTs`,
                      percentage: "",
                      subtitle: `${dashboardData?.NumRaffleNFTWinnersBidding || 0} to bidders, ${dashboardData?.NumRaffleNFTWinnersStakingRWalk || 0} to stakers`,
                    },
                    {
                      label: "NFT Stakers",
                      value: `${(
                        currentRound.prizePool *
                        ((dashboardData?.StakingPercentage || 0) / 100)
                      ).toFixed(4)} ETH`,
                      percentage: `${dashboardData?.StakingPercentage || 0}%`,
                      subtitle: "Proportional distribution",
                    },
                    {
                      label: "Charity",
                      value: `${(
                        currentRound.prizePool *
                        ((dashboardData?.CharityPercentage || 0) / 100)
                      ).toFixed(4)} ETH`,
                      percentage: `${dashboardData?.CharityPercentage || 0}%`,
                      subtitle: "",
                    },
                  ].map((prize) => (
                    <div
                      key={prize.label}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1">
                        <div className="text-text-secondary">{prize.label}</div>
                        {prize.subtitle && (
                          <div className="text-xs text-text-muted mt-0.5">
                            {prize.subtitle}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-primary font-semibold">
                          {prize.value}
                        </div>
                        {prize.percentage && (
                          <div className="text-xs text-text-muted">
                            {prize.percentage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Help Card */}
              {showHelpCard && (
                <Card glass className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 relative">
                    <button
                      onClick={() => setShowHelpCard(false)}
                      className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                    <div className="flex items-start space-x-3 pr-6">
                      <AlertCircle
                        size={20}
                        className="text-primary flex-shrink-0 mt-0.5"
                      />
                      <div className="text-sm text-text-secondary">
                        <p className="font-medium text-text-primary mb-1">
                          New to the game?
                        </p>
                        <p>
                          Read our{" "}
                          <a
                            href="/game/how-it-works"
                            className="text-primary hover:underline"
                          >
                            comprehensive guide
                          </a>{" "}
                          to understand bidding strategies and prize mechanics.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
