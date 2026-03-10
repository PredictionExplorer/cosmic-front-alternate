'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, parseUnits, erc20Abi, erc721Abi } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/lib/web3/config';
import { CONTRACTS, isDeployedAddress } from '@/lib/web3/contracts';
import { useNotification } from '@/contexts/NotificationContext';
import { parseContractError } from '@/lib/web3/errorHandling';
import { estimateContractGas } from '@/lib/web3/gasEstimation';
import { validateBidMessageLength } from '@/lib/web3/errorDecoder';
import CosmicGameABI from '@/contracts/CosmicGame.json';

interface DonationNft {
  type: 'nft';
  address: string;
  tokenId: string;
}

interface DonationToken {
  type: 'token';
  address: string;
  amount: string;
}

type Donation = DonationNft | DonationToken | null;

interface PlaceEthBidParams {
  bidMessage: string;
  ethBidPrice: bigint;
  priceBuffer: number;
  useRandomWalkNft: boolean;
  selectedNftId: bigint | null;
  donation: Donation;
}

interface PlaceCstBidParams {
  bidMessage: string;
  cstBidPrice: bigint;
  maxCstPrice: string;
  donation: Donation;
}

interface PlaceBidResult {
  placeEthBid: (params: PlaceEthBidParams) => Promise<boolean>;
  placeCstBid: (params: PlaceCstBidParams) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

async function parseTokenAmount(tokenAddress: string, amount: string): Promise<bigint> {
  try {
    const decimals = await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    return parseUnits(amount, decimals);
  } catch {
    console.warn('Failed to read token decimals, defaulting to 18');
    return parseEther(amount);
  }
}

async function checkAndApproveERC20(
  ownerAddress: `0x${string}`,
  tokenAddress: string,
  amount: bigint,
  notifications: { showInfo: (m: string) => void; showSuccess: (m: string) => void; showError: (m: string) => void },
): Promise<boolean> {
  try {
    const allowance = await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, CONTRACTS.PRIZES_WALLET],
    });

    if (allowance >= amount) {
      notifications.showInfo('Token is already approved!');
      return true;
    }

    if (allowance > BigInt(0)) {
      notifications.showInfo('Step 1/2: Resetting token allowance... Please confirm the transaction in your wallet.');
      const resetHash = await writeContract(wagmiConfig, {
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [CONTRACTS.PRIZES_WALLET, BigInt(0)],
      });
      notifications.showInfo('Reset transaction submitted. Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash: resetHash });
      notifications.showSuccess('Allowance reset confirmed!');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const stepText = allowance > BigInt(0) ? 'Step 2/2: Setting' : 'Requesting';
    notifications.showInfo(`${stepText} token approval... Please confirm the transaction in your wallet.`);

    const hash = await writeContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [CONTRACTS.PRIZES_WALLET, amount],
    });
    notifications.showInfo('Approval transaction submitted. Waiting for confirmation...');
    await waitForTransactionReceipt(wagmiConfig, { hash });
    notifications.showSuccess('Token approval confirmed! Proceeding with bid...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    const friendlyError = parseContractError(error);
    notifications.showError(`Token approval failed: ${friendlyError}`);
    return false;
  }
}

async function checkAndApproveNFT(
  ownerAddress: `0x${string}`,
  nftAddress: string,
  tokenId: string,
  notifications: { showInfo: (m: string) => void; showSuccess: (m: string) => void; showError: (m: string) => void },
): Promise<boolean> {
  try {
    const approvedAddress = await readContract(wagmiConfig, {
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'getApproved',
      args: [BigInt(tokenId)],
    });

    if (approvedAddress?.toLowerCase() === CONTRACTS.PRIZES_WALLET.toLowerCase()) {
      notifications.showInfo('NFT is already approved!');
      return true;
    }

    const isApprovedForAll = await readContract(wagmiConfig, {
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'isApprovedForAll',
      args: [ownerAddress, CONTRACTS.PRIZES_WALLET],
    });

    if (isApprovedForAll) {
      notifications.showInfo('NFT is already approved!');
      return true;
    }

    notifications.showInfo('Requesting NFT approval... Please confirm the transaction in your wallet.');
    const hash = await writeContract(wagmiConfig, {
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'approve',
      args: [CONTRACTS.PRIZES_WALLET, BigInt(tokenId)],
    });
    notifications.showInfo('Approval transaction submitted. Waiting for confirmation...');
    await waitForTransactionReceipt(wagmiConfig, { hash });
    notifications.showSuccess('NFT approval confirmed! Proceeding with bid...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    const friendlyError = parseContractError(error);
    notifications.showError(`NFT approval failed: ${friendlyError}`);
    return false;
  }
}

async function verifyNftOwnership(
  ownerAddress: `0x${string}`,
  nftAddress: string,
  tokenId: string,
  notifications: { showError: (m: string) => void },
): Promise<boolean> {
  try {
    const nftOwner = await readContract(wagmiConfig, {
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });
    if (nftOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
      notifications.showError(`You don't own NFT #${tokenId} from this contract.`);
      return false;
    }
    return true;
  } catch {
    notifications.showError(`Unable to verify ownership of NFT #${tokenId}. It may not exist.`);
    return false;
  }
}

export function usePlaceBid(): PlaceBidResult {
  const { address, isConnected } = useAccount();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifications = { showInfo, showSuccess, showError };

  const placeEthBid = useCallback(async (params: PlaceEthBidParams): Promise<boolean> => {
    const { bidMessage, ethBidPrice, priceBuffer, useRandomWalkNft: useRwNft, selectedNftId, donation } = params;

    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }
    if (!isDeployedAddress(CONTRACTS.COSMIC_GAME)) {
      showError('Contract not deployed on this network. Please switch to the correct network.');
      return false;
    }

    const messageValidation = validateBidMessageLength(bidMessage);
    if (!messageValidation.isValid) {
      showError(messageValidation.error || 'Bid message is too long');
      return false;
    }

    if (useRwNft && selectedNftId === null) {
      showWarning('Please select a Random Walk NFT to use');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const valueInWei = ethBidPrice + (ethBidPrice * BigInt(priceBuffer)) / BigInt(100);
      const finalValue = useRwNft ? (valueInWei + BigInt(1)) / BigInt(2) : valueInWei;
      const nftIdToSend = useRwNft && selectedNftId !== null ? selectedNftId : BigInt(-1);

      if (donation?.type === 'nft') {
        const owned = await verifyNftOwnership(address, donation.address, donation.tokenId, notifications);
        if (!owned) return false;

        showInfo('Step 1/2: Checking NFT approval...');
        const approved = await checkAndApproveNFT(address, donation.address, donation.tokenId, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const estimation = await estimateContractGas(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithEthAndDonateNft',
          args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
          value: finalValue,
          account: address,
        });
        if (!estimation.success) {
          showError(estimation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeContract(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithEthAndDonateNft',
          args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
          value: finalValue,
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      if (donation?.type === 'token') {
        const tokenAmount = await parseTokenAmount(donation.address, donation.amount);

        showInfo('Step 1/2: Checking ERC20 token approval...');
        const approved = await checkAndApproveERC20(address, donation.address, tokenAmount, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const estimation = await estimateContractGas(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithEthAndDonateToken',
          args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, tokenAmount],
          value: finalValue,
          account: address,
        });
        if (!estimation.success) {
          showError(estimation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeContract(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithEthAndDonateToken',
          args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, tokenAmount],
          value: finalValue,
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      // Regular bid (no donation)
      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
        abi: CosmicGameABI,
        functionName: 'bidWithEth',
        args: [nftIdToSend, bidMessage],
        value: finalValue,
        account: address,
      });
      if (!estimation.success) {
        showError(estimation.error || 'Transaction validation failed');
        return false;
      }

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeContract(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
        abi: CosmicGameABI,
        functionName: 'bidWithEth',
        args: [nftIdToSend, bidMessage],
        value: finalValue,
      });
      showInfo('Transaction submitted! Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Bid placed successfully!');
      return true;
    } catch (err) {
      console.error('ETH Bid error:', err);
      const friendlyError = parseContractError(err);
      setError(friendlyError);
      showError(friendlyError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, showWarning, showError, showInfo, showSuccess, notifications]);

  const placeCstBid = useCallback(async (params: PlaceCstBidParams): Promise<boolean> => {
    const { bidMessage, cstBidPrice, maxCstPrice, donation } = params;

    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }
    if (!isDeployedAddress(CONTRACTS.COSMIC_GAME)) {
      showError('Contract not deployed on this network. Please switch to the correct network.');
      return false;
    }

    const messageValidation = validateBidMessageLength(bidMessage);
    if (!messageValidation.isValid) {
      showError(messageValidation.error || 'Bid message is too long');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let maxLimit: bigint;
      if (cstBidPrice === BigInt(0)) {
        maxLimit = BigInt(0);
      } else if (maxCstPrice) {
        maxLimit = parseEther(maxCstPrice);
      } else {
        maxLimit = (cstBidPrice * BigInt(110)) / BigInt(100);
      }

      if (donation?.type === 'nft') {
        const owned = await verifyNftOwnership(address, donation.address, donation.tokenId, notifications);
        if (!owned) return false;

        showInfo('Step 1/2: Checking NFT approval...');
        const approved = await checkAndApproveNFT(address, donation.address, donation.tokenId, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const estimation = await estimateContractGas(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithCstAndDonateNft',
          args: [maxLimit, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
          account: address,
        });
        if (!estimation.success) {
          showError(estimation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeContract(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithCstAndDonateNft',
          args: [maxLimit, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      if (donation?.type === 'token') {
        const tokenAmount = await parseTokenAmount(donation.address, donation.amount);

        showInfo('Step 1/2: Checking ERC20 token approval...');
        const approved = await checkAndApproveERC20(address, donation.address, tokenAmount, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const estimation = await estimateContractGas(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithCstAndDonateToken',
          args: [maxLimit, bidMessage, donation.address as `0x${string}`, tokenAmount],
          account: address,
        });
        if (!estimation.success) {
          showError(estimation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeContract(wagmiConfig, {
          address: CONTRACTS.COSMIC_GAME,
          abi: CosmicGameABI,
          functionName: 'bidWithCstAndDonateToken',
          args: [maxLimit, bidMessage, donation.address as `0x${string}`, tokenAmount],
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      // Regular CST bid
      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
        abi: CosmicGameABI,
        functionName: 'bidWithCst',
        args: [maxLimit, bidMessage],
        account: address,
      });
      if (!estimation.success) {
        showError(estimation.error || 'Transaction validation failed');
        return false;
      }

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeContract(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
        abi: CosmicGameABI,
        functionName: 'bidWithCst',
        args: [maxLimit, bidMessage],
      });
      showInfo('Transaction submitted! Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Bid placed successfully!');
      return true;
    } catch (err) {
      console.error('CST Bid error:', err);
      const friendlyError = parseContractError(err);
      setError(friendlyError);
      showError(friendlyError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, showWarning, showError, showInfo, showSuccess, notifications]);

  return { placeEthBid, placeCstBid, isSubmitting, error };
}
