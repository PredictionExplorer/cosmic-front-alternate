"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CountdownTimer } from "@/components/game/CountdownTimer";
import { useCosmicGame } from "@/hooks/useCosmicGameContract";
import { useRandomWalkNFT } from "@/hooks/useRandomWalkNFT";
import { useApiData } from "@/contexts/ApiDataContext";
import { useNotification } from "@/contexts/NotificationContext";
import { formatWeiToEth } from "@/lib/web3/utils";
import { parseContractError } from "@/lib/web3/errorHandling";
import { api } from "@/services/api";

export default function PlayPage() {
  const { address, isConnected } = useAccount();
  const { read, write, isTransactionPending, transactionHash } =
    useCosmicGame();
  const { read: readRandomWalk } = useRandomWalkNFT();
  const { dashboardData, refresh: refreshDashboard } = useApiData();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();

  // UI State
  const [bidType, setBidType] = useState<"ETH" | "CST">("ETH");
  const [useRandomWalkNft, setUseRandomWalkNft] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<bigint | null>(null);
  const [bidMessage, setBidMessage] = useState("");
  const [maxCstPrice, setMaxCstPrice] = useState("");
  const [priceBuffer, setPriceBuffer] = useState(2); // % buffer for price collision prevention
  const [usedNfts, setUsedNfts] = useState<number[]>([]); // List of used NFT IDs
  const [lastActionType, setLastActionType] = useState<
    "bid" | "claimPrize" | null
  >(null); // Track last action
  const [lastBidMessage, setLastBidMessage] = useState<string>("");

  // Advanced Options State
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [donationType, setDonationType] = useState<"nft" | "token">("nft");
  const [donationNftAddress, setDonationNftAddress] = useState("");
  const [donationNftTokenId, setDonationNftTokenId] = useState("");
  const [donationTokenAddress, setDonationTokenAddress] = useState("");
  const [donationTokenAmount, setDonationTokenAmount] = useState("");

  // Get blockchain data
  const { data: roundNum } = read.useRoundNum();
  const { data: lastBidder } = read.useLastBidder();
  const { data: mainPrizeTime } = read.useMainPrizeTime();
  const { data: ethBidPriceRaw, refetch: refetchEthPrice } =
    read.useEthBidPrice();
  const { data: cstBidPriceRaw, refetch: refetchCstPrice } =
    read.useCstBidPrice();
  const { data: prizeAmount, refetch: refetchPrizeAmount } =
    read.useMainPrizeAmount();

  // Get user's Random Walk NFTs
  const { data: userNfts } = readRandomWalk.useWalletOfOwner(address);
  const ownedNfts = (userNfts as bigint[] | undefined) || [];

  // Fetch used NFTs from API
  useEffect(() => {
    const fetchUsedNfts = async () => {
      try {
        const response = await api.getUsedRWLKNfts();

        // Handle different possible response formats
        let normalizedList: number[] = [];
        if (Array.isArray(response)) {
          normalizedList = response.map((item) => {
            // If item is an object with RWalkTokenId property
            if (
              typeof item === "object" &&
              item !== null &&
              "RWalkTokenId" in item
            ) {
              return Number(item.RWalkTokenId);
            }
            // If item is already a number or can be converted to number
            return Number(item);
          });
        }

        setUsedNfts(normalizedList);
      } catch (error) {
        console.error("Failed to fetch used NFTs:", error);
      }
    };

    fetchUsedNfts();
  }, []);

  // Fetch last bid message from API
  useEffect(() => {
    const fetchLastBidMessage = async () => {
      if (!roundNum) return;

      try {
        const bids = await api.getBidListByRound(Number(roundNum), "desc");
        if (bids && bids.length > 0) {
          const lastBid = bids[0];
          setLastBidMessage(lastBid.Message || "");
        } else {
          setLastBidMessage("");
        }
      } catch (error) {
        console.error("Failed to fetch last bid message:", error);
        setLastBidMessage("");
      }
    };

    fetchLastBidMessage();
  }, [roundNum]);

  // Filter out used NFTs from owned NFTs
  const availableNfts = ownedNfts.filter((nftId) => {
    const nftIdNumber = Number(nftId);
    const isUsed = usedNfts.includes(nftIdNumber);
    return !isUsed;
  });

  // Clear selected NFT if it's no longer available
  useEffect(() => {
    if (
      selectedNftId !== null &&
      !availableNfts.some((id) => id === selectedNftId)
    ) {
      setSelectedNftId(null);
    }
  }, [availableNfts, selectedNftId]);

  // Calculate timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  useEffect(() => {
    if (mainPrizeTime) {
      const update = () => {
        const remaining = Number(mainPrizeTime) - Math.floor(Date.now() / 1000);
        setTimeRemaining(Math.max(0, remaining));
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [mainPrizeTime]);

  // Check if user can claim main prize
  const canClaimMainPrize =
    isConnected &&
    address &&
    lastBidder &&
    address.toLowerCase() === (lastBidder as string).toLowerCase() &&
    timeRemaining === 0;

  // Format prices
  const ethBidPrice = ethBidPriceRaw
    ? parseFloat(formatWeiToEth(ethBidPriceRaw as bigint, 6))
    : 0;
  const cstBidPrice = cstBidPriceRaw
    ? parseFloat(formatWeiToEth(cstBidPriceRaw as bigint, 2))
    : 0;

  // Calculate adjusted price with buffer
  const adjustedEthPrice = ethBidPrice * (1 + priceBuffer / 100);
  const discountedEthPrice = useRandomWalkNft
    ? adjustedEthPrice * 0.5
    : adjustedEthPrice;

  // Handle NFT selection with logging
  const handleNftSelection = (nftId: bigint) => {
    setSelectedNftId(nftId);
  };

  // Handle ETH bid
  const handleEthBid = async () => {
    if (!isConnected) {
      showWarning("Please connect your wallet first");
      return;
    }

    if (!ethBidPriceRaw) {
      showError("Unable to get bid price. Please try again.");
      return;
    }

    try {
      // Calculate value with buffer
      const valueInWei =
        (ethBidPriceRaw as bigint) +
        ((ethBidPriceRaw as bigint) * BigInt(priceBuffer)) / BigInt(100);
      const finalValue = useRandomWalkNft ? valueInWei / BigInt(2) : valueInWei;

      // Validate NFT selection if using Random Walk
      if (useRandomWalkNft && selectedNftId === null) {
        showWarning("Please select a Random Walk NFT to use");
        return;
      }

      // Determine NFT ID to send
      const nftIdToSend =
        useRandomWalkNft && selectedNftId !== null ? selectedNftId : BigInt(-1);

      // Track that this is a bid action
      setLastActionType("bid");

      // Submit bid with or without donation
      if (donationType === "nft" && donationNftAddress && donationNftTokenId) {
        // Bid with NFT donation
        await write.bidWithEthAndDonateNft(
          nftIdToSend,
          bidMessage,
          donationNftAddress as `0x${string}`,
          BigInt(donationNftTokenId),
          finalValue
        );
      } else if (
        donationType === "token" &&
        donationTokenAddress &&
        donationTokenAmount
      ) {
        // Bid with ERC20 token donation
        await write.bidWithEthAndDonateToken(
          nftIdToSend,
          bidMessage,
          donationTokenAddress as `0x${string}`,
          parseEther(donationTokenAmount),
          finalValue
        );
      } else {
        // Regular bid without donation
        await write.bidWithEth(nftIdToSend, bidMessage, finalValue);
      }

      showInfo("Transaction submitted! Waiting for confirmation...");
    } catch (error) {
      const friendlyError = parseContractError(error);
      showError(friendlyError);
    }
  };

  // Handle CST bid
  const handleCstBid = async () => {
    if (!isConnected) {
      showWarning("Please connect your wallet first");
      return;
    }

    if (cstBidPriceRaw === undefined) {
      showError("Unable to get CST bid price. Please try again.");
      return;
    }

    try {
      // Determine max limit based on current price
      let maxLimit: bigint;

      if (cstBidPriceRaw === BigInt(0)) {
        // Free bid - price is 0
        maxLimit = BigInt(0);
      } else if (maxCstPrice) {
        // User specified max price
        maxLimit = parseEther(maxCstPrice);
      } else {
        // Auto calculate: current price * 1.1 for slippage protection
        maxLimit = ((cstBidPriceRaw as bigint) * BigInt(110)) / BigInt(100);
      }

      // Track that this is a bid action
      setLastActionType("bid");

      // Submit bid with or without donation
      if (donationType === "nft" && donationNftAddress && donationNftTokenId) {
        // Bid with NFT donation
        await write.bidWithCstAndDonateNft(
          maxLimit,
          bidMessage,
          donationNftAddress as `0x${string}`,
          BigInt(donationNftTokenId)
        );
      } else if (
        donationType === "token" &&
        donationTokenAddress &&
        donationTokenAmount
      ) {
        // Bid with ERC20 token donation
        await write.bidWithCstAndDonateToken(
          maxLimit,
          bidMessage,
          donationTokenAddress as `0x${string}`,
          parseEther(donationTokenAmount)
        );
      } else {
        // Regular bid without donation
        await write.bidWithCst(maxLimit, bidMessage);
      }

      showInfo("Transaction submitted! Waiting for confirmation...");
    } catch (error) {
      const friendlyError = parseContractError(error);
      showError(friendlyError);
    }
  };

  // Handle Main Prize Claim
  const handleClaimMainPrize = async () => {
    if (!isConnected) {
      showWarning("Please connect your wallet first");
      return;
    }

    try {
      // Track that this is a claim prize action
      setLastActionType("claimPrize");

      await write.claimMainPrize();
      showInfo("Transaction submitted! Claiming main prize...");
    } catch (error) {
      const friendlyError = parseContractError(error);
      showError(friendlyError);
    }
  };

  // Watch for transaction success
  useEffect(() => {
    if (write.status.isSuccess) {
      // Capture action type before resetting
      const actionType = lastActionType;

      // Display appropriate success message based on the action performed
      if (actionType === "claimPrize") {
        showSuccess("🎉 Main Prize claimed successfully! Congratulations!");
      } else if (actionType === "bid") {
        showSuccess("🎉 Bid placed successfully! You earned 100 CST tokens.");
        setBidMessage("");
      }

      // Reset action type
      setLastActionType(null);

      // Refresh data after short delay
      setTimeout(async () => {
        refreshDashboard();

        // Refresh bid prices after bid is placed
        if (actionType === "bid") {
          refetchEthPrice();
          refetchCstPrice();
          refetchPrizeAmount();

          // Refresh last bid message
          try {
            const bids = await api.getBidListByRound(Number(roundNum), "desc");
            if (bids && bids.length > 0) {
              const lastBid = bids[0];
              setLastBidMessage(lastBid.Message || "");
            }
          } catch (error) {
            console.error("Failed to refresh last bid message:", error);
          }
        }

        // Refresh used NFTs list if RandomWalk NFT was used
        if (useRandomWalkNft && selectedNftId !== null) {
          try {
            const response = await api.getUsedRWLKNfts();
            // Normalize the response format
            let normalizedList: number[] = [];
            if (Array.isArray(response)) {
              normalizedList = response.map((item) => {
                if (
                  typeof item === "object" &&
                  item !== null &&
                  "RWalkTokenId" in item
                ) {
                  return Number(item.RWalkTokenId);
                }
                return Number(item);
              });
            }
            setUsedNfts(normalizedList);
            setSelectedNftId(null);
          } catch (error) {
            console.error("Failed to refresh used NFTs:", error);
          }
        }
      }, 2000);
    }
  }, [
    write.status.isSuccess,
    showSuccess,
    refreshDashboard,
    lastActionType,
    useRandomWalkNft,
    selectedNftId,
    refetchEthPrice,
    refetchCstPrice,
    refetchPrizeAmount,
    roundNum,
  ]);

  // Prepare display data
  const currentRound = {
    roundNumber: roundNum?.toString() || "0",
    prizePool: prizeAmount
      ? parseFloat(formatWeiToEth(prizeAmount as bigint, 4))
      : 0,
    totalBids: (dashboardData?.CurNumBids as number) || 0,
    lastBidder: (lastBidder as string) || "0x0",
    timeRemaining,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="section-padding bg-background-surface/50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Badge variant="success" className="mb-4">
              Round {currentRound.roundNumber} Active
            </Badge>
            <h1 className="heading-lg text-balance mb-6">
              Compete for
              <span className="text-gradient block mt-2">
                {currentRound.prizePool.toFixed(2)} ETH
              </span>
            </h1>
            <div className="flex justify-center">
              <CountdownTimer targetSeconds={timeRemaining} size="lg" />
            </div>
          </motion.div>
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
                  You Won the Main Prize!
                </h2>
                <Trophy size={32} className="text-primary animate-pulse" />
              </div>
              <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
                Congratulations! The countdown has ended and you are the last
                bidder. Claim your prize now to receive{" "}
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
                <Button
                  size="xl"
                  onClick={handleClaimMainPrize}
                  className="shadow-luxury-lg animate-pulse"
                >
                  <Trophy className="mr-2" size={24} />
                  Claim Main Prize
                </Button>
              )}
              <p className="text-xs text-text-muted mt-4">
                ⚠️ Important: You have 1 day to claim. After that, anyone can
                claim and receive your prize.
              </p>
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
                      disabled={isTransactionPending}
                      className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                        bidType === "ETH"
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:text-primary"
                      }`}
                    >
                      ETH Bid
                    </button>
                    <button
                      onClick={() => setBidType("CST")}
                      disabled={
                        isTransactionPending ||
                        !lastBidder ||
                        lastBidder ===
                          "0x0000000000000000000000000000000000000000"
                      }
                      className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
                        bidType === "CST"
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:text-primary"
                      }`}
                    >
                      CST Bid
                      {(!lastBidder ||
                        lastBidder ===
                          "0x0000000000000000000000000000000000000000") && (
                        <span className="text-xs block">(After first bid)</span>
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
                                        onClick={() =>
                                          handleNftSelection(nftId)
                                        }
                                        disabled={isTransactionPending}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                                          selectedNftId === nftId
                                            ? "border-primary bg-primary/10 shadow-lg"
                                            : "border-text-muted/20 bg-background-surface hover:border-primary/40"
                                        }`}
                                      >
                                        <div className="text-xs text-text-secondary">
                                          Token ID
                                        </div>
                                        <div className="font-mono text-lg font-semibold text-primary">
                                          #{nftId.toString()}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>

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
                          {cstBidPrice === 0 ? (
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
                          {cstBidPrice === 0
                            ? "🎉 Dutch auction ended - Bid for free!"
                            : "Price decreases to 0 over time"}
                        </p>
                      </div>

                      {/* Max Price Protection - Only show if price is not 0 */}
                      {cstBidPrice > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm text-text-secondary">
                            Maximum Price (Slippage Protection)
                          </label>
                          <input
                            type="number"
                            value={maxCstPrice}
                            onChange={(e) => setMaxCstPrice(e.target.value)}
                            placeholder={`Leave empty for auto (${(
                              cstBidPrice * 1.1
                            ).toFixed(2)} CST)`}
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
                            ✨ This is a{" "}
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
                      onChange={(e) => setBidMessage(e.target.value)}
                      maxLength={280}
                      rows={3}
                      disabled={isTransactionPending}
                      placeholder="Add a message with your bid..."
                      className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Maximum 280 characters</span>
                      <span>{bidMessage.length}/280</span>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAdvancedOptions(!showAdvancedOptions)
                      }
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
                                onChange={(e) =>
                                  setPriceBuffer(Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                  setDonationNftAddress(e.target.value)
                                }
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
                                onChange={(e) =>
                                  setDonationNftTokenId(e.target.value)
                                }
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
                                onChange={(e) =>
                                  setDonationTokenAddress(e.target.value)
                                }
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
                                onChange={(e) =>
                                  setDonationTokenAmount(e.target.value)
                                }
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
                        100 CST
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
                          href={`http://161.129.67.42:22945/tx/${transactionHash}`}
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

              {/* Current Round Info */}
              <Card glass>
                <CardHeader>
                  <CardTitle>Current Round Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        Round Number
                      </p>
                      <p className="font-mono text-xl text-primary">
                        {currentRound.roundNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary mb-1">
                        Total Bids
                      </p>
                      <p className="font-mono text-xl text-primary">
                        {currentRound.totalBids}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-text-secondary mb-1">
                        Last Bidder
                      </p>
                      <p className="font-mono text-sm text-text-primary break-all">
                        {currentRound.lastBidder}
                      </p>
                    </div>
                    {lastBidMessage && (
                      <div className="col-span-2 mt-2">
                        <p className="text-xs text-text-secondary mb-1">
                          Last Bidder&apos;s Message
                        </p>
                        <div className="p-3 rounded-lg bg-background-elevated border border-text-muted/10">
                          <p className="text-sm text-text-primary italic">
                            &quot;{lastBidMessage}&quot;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                        cstBidPrice === 0
                          ? "text-status-success"
                          : "text-status-info"
                      }`}
                    >
                      {cstBidPrice === 0
                        ? "FREE"
                        : `${cstBidPrice.toFixed(2)} CST`}
                    </p>
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
                      value: `${(currentRound.prizePool * 0.25).toFixed(
                        4
                      )} ETH`,
                      percentage: "25%",
                    },
                    {
                      label: "Chrono-Warrior",
                      value: `${(currentRound.prizePool * 0.08).toFixed(
                        4
                      )} ETH`,
                      percentage: "8%",
                    },
                    {
                      label: "Raffle (3 winners)",
                      value: `${(currentRound.prizePool * 0.04).toFixed(
                        4
                      )} ETH`,
                      percentage: "4%",
                    },
                    {
                      label: "Stakers",
                      value: `${(currentRound.prizePool * 0.06).toFixed(
                        4
                      )} ETH`,
                      percentage: "6%",
                    },
                    {
                      label: "Endurance (CST)",
                      value: `${currentRound.totalBids * 10} CST`,
                      percentage: "",
                    },
                  ].map((prize) => (
                    <div
                      key={prize.label}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-text-secondary">{prize.label}</span>
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
              <Card glass className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
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
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
