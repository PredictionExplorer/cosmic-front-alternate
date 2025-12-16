"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Share2, CheckCircle2, ChevronLeft, ChevronRight, Edit2, X, Check, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { shortenAddress } from "@/lib/utils";
import { api, getAssetsUrl } from "@/services/api";
import { useCosmicSignatureNFT } from "@/hooks/useCosmicSignatureNFT";
import { useNotification } from "@/contexts/NotificationContext";

interface NFTData {
  RecordId: number;
  Tx: {
    EvtLogId: number;
    BlockNum: number;
    TxId: number;
    TxHash: string;
    TimeStamp: number;
    DateTime: string;
  };
  ContractAddr: string;
  TokenId: number;
  WinnerAid: number;
  WinnerAddr: string;
  CurOwnerAid: number;
  CurOwnerAddr: string;
  Seed: string;
  RoundNum: number;
  RecordType: number;
  TokenName: string;
  Staked: boolean;
  StakedOwnerAid: number;
  StakedOwnerAddr: string;
  StakeActionId: number;
  StakeTimeStamp: number;
  StakeDateTime: string;
  UnstakeActionId: number;
  WasUnstaked: boolean;
  ActualUnstakeTimeStamp: number;
  ActualUnstakeDateTime: string;
}

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { address: connectedAddress } = useAccount();
  const nftContract = useCosmicSignatureNFT();
  
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nft, setNft] = useState<NFTData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [maxTokenId, setMaxTokenId] = useState<number | null>(null);
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Transfer state
  const [transferAddress, setTransferAddress] = useState("");
  const [transferError, setTransferError] = useState("");
  
  // Name history state
  const [nameHistory, setNameHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch NFT info and max token ID in parallel
        const [tokenInfo, tokenList] = await Promise.all([
          api.getCSTInfo(parseInt(id)),
          api.getCSTList()
        ]);
        
        setNft(tokenInfo);

        // Find the highest token ID
        if (tokenList && tokenList.length > 0) {
          const maxId = Math.max(...tokenList.map((token: any) => token.TokenId));
          setMaxTokenId(maxId);
        }

        // Generate image and video URLs from seed
        const fileName = `0x${tokenInfo.Seed}`;
        setImageUrl(getAssetsUrl(`images/new/cosmicsignature/${fileName}.png`));
        setVideoUrl(getAssetsUrl(`images/new/cosmicsignature/${fileName}.mp4`));
        
        // Fetch name history
        fetchNameHistory();
      } catch (err) {
        console.error("Error fetching NFT data:", err);
        setError("Failed to load NFT data");
      } finally {
        setLoading(false);
      }
    };

    fetchNFTData();
  }, [id]);
  
  // Fetch name change history
  const fetchNameHistory = async () => {
    try {
      setLoadingHistory(true);
      const history = await api.getNameHistory(parseInt(id));
      setNameHistory(history);
    } catch (err) {
      console.error("Error fetching name history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Refetch NFT data when name change transaction is successful
  useEffect(() => {
    if (nftContract.status.isSuccess && isEditingName) {
      const refetchData = async () => {
        try {
          const tokenInfo = await api.getCSTInfo(parseInt(id));
          setNft(tokenInfo);
          setIsEditingName(false);
          setNewName("");
        } catch (err) {
          console.error("Failed to refetch NFT data:", err);
        }
      };
      refetchData();
    }
  }, [nftContract.status.isSuccess, id, isEditingName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-text-secondary">Loading NFT...</p>
          </Card>
        </Container>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container>
          <Card glass className="p-12 text-center">
            <h1 className="heading-sm mb-4">NFT Not Found</h1>
            <p className="text-text-secondary mb-6">
              {error || "This NFT doesn't exist or hasn't been minted yet."}
            </p>
            <Button asChild>
              <Link href="/gallery">
                <ArrowLeft className="mr-2" size={20} />
                Back to Gallery
              </Link>
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  const getPrizeType = (recordType: number, roundNum: number) => {
    switch (recordType) {
      case 1:
        return "Raffle Winner";
      case 2:
        return "Staking Winner";
      case 3:
        return `Round Winner (Round #${roundNum})`;
      case 4:
        return "Endurance Champion NFT Winner";
      default:
        return "Unknown";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleStartEdit = () => {
    setNewName(nft?.TokenName || "");
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewName("");
  };

  const handleSaveName = async () => {
    if (!nft || !newName.trim()) return;
    try {
      await nftContract.write.setName(BigInt(nft.TokenId), newName.trim());
      showSuccess("NFT name updated successfully!");
      // Refetch name history after successful update
      setTimeout(() => {
        fetchNameHistory();
      }, 2000);
    } catch (error: any) {
      showError(error.message || "Failed to update NFT name");
    }
  };
  
  // Handle transfer
  const handleTransfer = async () => {
    if (!nft || !transferAddress) return;
    
    // Validate address
    if (!isAddress(transferAddress)) {
      setTransferError("Invalid Ethereum address");
      return;
    }
    
    setTransferError("");
    
    try {
      await nftContract.write.transfer(
        connectedAddress as `0x${string}`,
        transferAddress as `0x${string}`,
        BigInt(nft.TokenId)
      );
      showSuccess("NFT transferred successfully!");
      setTransferAddress("");
      // Refetch NFT data after transfer
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      showError(error.message || "Failed to transfer NFT");
    }
  };

  // Check if connected user is the owner
  const isOwner = connectedAddress && nft && 
    connectedAddress.toLowerCase() === nft.CurOwnerAddr.toLowerCase();

  return (
    <div className="min-h-screen section-padding">
      <Container>
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <Button variant="ghost" asChild>
            <Link href="/gallery">
              <ArrowLeft className="mr-2" size={20} />
              Back to Gallery
            </Link>
          </Button>

          {/* Prev/Next Navigation */}
          <div className="flex items-center gap-2">
            {parseInt(id) > 0 ? (
              <Button
                variant="primary"
                asChild
                className="min-w-[100px]"
              >
                <Link href={`/gallery/${parseInt(id) - 1}`}>
                  <ChevronLeft size={20} className="mr-1" />
                  Prev
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                className="min-w-[100px]"
              >
                <ChevronLeft size={20} className="mr-1" />
                Prev
              </Button>
            )}
            {maxTokenId !== null && parseInt(id) >= maxTokenId ? (
              <Button
                variant="outline"
                disabled
                className="min-w-[100px]"
              >
                Next
                <ChevronRight size={20} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                asChild
                className="min-w-[100px]"
              >
                <Link href={`/gallery/${parseInt(id) + 1}`}>
                  Next
                  <ChevronRight size={20} className="ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: NFT Display */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card glass className="overflow-hidden">
              <div className="relative aspect-square bg-background-elevated">
                {showVideo && videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={nft.TokenName || `Cosmic Signature #${id}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>

              {videoUrl && (
                <div className="p-4 border-t border-text-muted/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideo(!showVideo)}
                    className="w-full"
                  >
                    {showVideo ? "Show Image" : "Show Video"}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Right: Metadata */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title */}
            <div>
              {isEditingName ? (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      maxLength={32}
                      placeholder="Enter NFT name (max 32 characters)"
                      className="flex-1 px-4 py-2 rounded-lg bg-background-surface border border-text-muted/20 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveName}
                      disabled={!newName.trim() || nftContract.status.isPending || nftContract.status.isConfirming}
                    >
                      <Check size={16} className="mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={nftContract.status.isPending || nftContract.status.isConfirming}
                    >
                      <X size={16} className="mr-1" />
                      Cancel
                    </Button>
                  </div>
                  {nftContract.status.isPending && (
                    <p className="text-xs text-status-warning">Waiting for wallet confirmation...</p>
                  )}
                  {nftContract.status.isConfirming && (
                    <p className="text-xs text-status-warning">Transaction confirming...</p>
                  )}
                  {nftContract.status.isSuccess && (
                    <p className="text-xs text-status-success">Name updated successfully!</p>
                  )}
                  {nftContract.status.error && (
                    <p className="text-xs text-status-error">Error: {nftContract.status.error.message}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="heading-sm">
                    {nft.TokenName || `Cosmic Signature #${id}`}
                  </h1>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleStartEdit}
                      className="hover:bg-primary/10"
                      title="Edit NFT name"
                    >
                      <Edit2 size={16} />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-text-secondary">
                Minted on {formatTimestamp(nft.Tx.TimeStamp)}
              </p>
            </div>

            {/* Details Card */}
            <Card glass>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Token ID</span>
                  <span className="font-mono text-primary font-semibold">
                    #{id}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Round</span>
                  <Badge variant="default">Round {nft.RoundNum}</Badge>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Prize Type</span>
                  <span className="text-sm text-text-primary">
                    {getPrizeType(nft.RecordType, nft.RoundNum)}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Seed</span>
                  <span className="font-mono text-sm text-text-primary text-right break-all max-w-[200px]">
                    {nft.Seed}
                  </span>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Winner</span>
                  <Link
                    href={`/account?address=${nft.WinnerAddr}`}
                    className="font-mono text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    {shortenAddress(nft.WinnerAddr, 6)}
                  </Link>
                </div>

                <div className="flex justify-between items-start pb-4 border-b border-text-muted/10">
                  <span className="text-text-secondary">Owner</span>
                  <Link
                    href={`/account?address=${nft.CurOwnerAddr}`}
                    className="font-mono text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    {shortenAddress(nft.CurOwnerAddr, 6)}
                  </Link>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Transaction</span>
                  <a
                    href={`https://arbiscan.io/tx/${nft.Tx.TxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="text-sm mr-1">View on Arbiscan</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Staking Status */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Staking Status
                </h3>
                <div className="space-y-2">
                  {!nft.Staked && !nft.WasUnstaked ? (
                    <p className="text-sm text-green-400">
                      ✓ This NFT is eligible for staking
                    </p>
                  ) : (
                    <p className="text-sm text-red-400">
                      ✗ This NFT has already been staked and cannot be staked
                      again
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transfer NFT (Owner Only) */}
            {isOwner && (
              <Card glass>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Send size={20} className="text-primary" />
                    Transfer NFT
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Transfer this NFT to another address. This action cannot be undone.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        value={transferAddress}
                        onChange={(e) => {
                          setTransferAddress(e.target.value);
                          setTransferError("");
                        }}
                        placeholder="0x..."
                        className="w-full px-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                        disabled={nftContract.status.isPending}
                      />
                      {transferError && (
                        <p className="text-xs text-status-error mt-1">{transferError}</p>
                      )}
                    </div>
                    <Button
                      onClick={handleTransfer}
                      disabled={!transferAddress || nftContract.status.isPending}
                      className="w-full"
                      size="lg"
                    >
                      {nftContract.status.isPending ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" size={20} />
                          Transferring...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2" size={20} />
                          Transfer NFT
                        </>
                      )}
                    </Button>
                    {nftContract.status.error && (
                      <p className="text-xs text-status-error">
                        Error: {nftContract.status.error.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {nft.Staked || nft.WasUnstaked ? (
                <Button
                  className="flex-1"
                  size="lg"
                  disabled
                  title="This NFT has already been staked and cannot be staked again"
                >
                  Stake NFT
                </Button>
              ) : (
                <Button asChild className="flex-1" size="lg">
                  <Link href="/stake">Stake NFT</Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Cosmic Signature #${id}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }
                }}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2" size={20} />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2" size={20} />
                    Share
                  </>
                )}
              </Button>
            </div>

            {/* Generation Info */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  About This NFT
                </h3>
                <div className="space-y-4 text-sm text-text-secondary">
                  <p>
                    This Cosmic Signature NFT was generated using a
                    deterministic algorithm with the seed value shown above. The
                    generation process is fully transparent and verifiable
                    on-chain.
                  </p>
                  <p>
                    Each NFT is unique based on its seed, which is derived from
                    blockchain data including block hashes, timestamps, and
                    Arbitrum-specific entropy sources.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      View Full Resolution Image
                      <ExternalLink className="ml-1" size={14} />
                    </a>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      View Video
                      <ExternalLink className="ml-1" size={14} />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provenance */}
            <Card glass>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                  Provenance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Minted
                      </p>
                      <p className="text-xs text-text-secondary">
                        {formatTimestamp(nft.Tx.TimeStamp)} • Round {nft.RoundNum}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-gold mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Original Winner
                      </p>
                      <Link
                        href={`/account?address=${nft.WinnerAddr}`}
                        className="text-xs text-text-secondary font-mono hover:text-primary transition-colors"
                      >
                        {nft.WinnerAddr}
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent-platinum mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-text-primary font-medium">
                        Current Owner
                      </p>
                      <Link
                        href={`/account?address=${nft.CurOwnerAddr}`}
                        className="text-xs text-text-secondary font-mono hover:text-primary transition-colors"
                      >
                        {nft.CurOwnerAddr}
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Name Change History */}
            {nameHistory.length > 0 && (
              <Card glass>
                <CardContent className="p-6">
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
                    Name Change History
                  </h3>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-text-muted/10">
                          <tr>
                            <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">
                              Date
                            </th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">
                              Name
                            </th>
                            <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">
                              Changed By
                            </th>
                            <th className="text-right py-3 px-2 text-sm font-medium text-text-secondary">
                              Transaction
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-text-muted/10">
                          {nameHistory.map((entry: any, index: number) => (
                            <tr key={index} className="hover:bg-background-elevated/50 transition-colors">
                              <td className="py-3 px-2 text-sm text-text-secondary">
                                {entry.Tx?.DateTime 
                                  ? new Date(entry.Tx.DateTime).toLocaleDateString()
                                  : formatTimestamp(entry.Tx?.TimeStamp || 0)}
                              </td>
                              <td className="py-3 px-2 text-sm text-text-primary font-medium">
                                {entry.TokenName || "(unnamed)"}
                              </td>
                              <td className="py-3 px-2">
                                <Link
                                  href={`/account?address=${entry.OwnerAddr}`}
                                  className="text-sm font-mono text-primary hover:text-primary/80 transition-colors"
                                >
                                  {shortenAddress(entry.OwnerAddr, 6)}
                                </Link>
                              </td>
                              <td className="py-3 px-2 text-right">
                                {entry.Tx?.TxHash && (
                                  <a
                                    href={`https://arbiscan.io/tx/${entry.Tx.TxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <span className="hidden sm:inline mr-1">View</span>
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
