'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { type Abi, formatEther, parseEther, parseUnits, erc20Abi, erc721Abi } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/lib/web3/config';
import { isDeployedAddress } from '@/lib/web3/contractAddresses';
import { useContractAddresses } from '@/hooks/useContractAddresses';
import { useNotification } from '@/contexts/NotificationContext';
import {
  isUserRejection,
  reportError,
  getContractErrorMessage,
  WALLET_TRANSACTION_CANCELLED_MESSAGE,
} from '@/lib/errorReporter';
import { parseContractError } from '@/lib/web3/errorHandling';
import { estimateContractGas } from '@/lib/web3/gasEstimation';
import { validateBidMessageLength } from '@/lib/web3/errorDecoder';
import { getBufferedEip1559Fees } from '@/lib/web3/transactionFees';
import {
  bidArgsForV2,
  isUnrecognizedSelectorError,
  pickBidWriteAbi,
  preferV2BidArgsFirst,
  type CosmicGameBidFunctionName,
} from '@/lib/web3/cosmicGameContractCompat';

/** EIP-1559 fees with +25% buffer vs floating Arbitrum base fee */
async function writeWithBufferedFees(args: {
  address: `0x${string}`;
  abi: Abi | unknown;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}) {
  const fees = await getBufferedEip1559Fees(wagmiConfig);
  return writeContract(wagmiConfig, {
    address: args.address,
    abi: args.abi as Abi,
    functionName: args.functionName,
    args: args.args,
    value: args.value,
    ...(fees ?? {}),
  });
}

type BidCallValidation =
  | { success: true; args: readonly unknown[]; abi: Abi }
  | { success: false; error?: string };

/**
 * Simulate a bid with V2 args first (falling back to V1 on unrecognized selector)
 * and return the argument shape + narrowed ABI slice that the contract accepts.
 * V2 appends `bidCstRewardAmountMinLimit_` (0 = accept any CST reward) after the message.
 */
async function validateBidCall(params: {
  address: `0x${string}`;
  functionName: CosmicGameBidFunctionName;
  v1Args: readonly unknown[];
  value?: bigint;
  account: `0x${string}`;
}): Promise<BidCallValidation> {
  const v2Args = bidArgsForV2(params.functionName, params.v1Args);
  const attempts = preferV2BidArgsFirst() ? [v2Args, params.v1Args] : [params.v1Args, v2Args];

  let lastError: string | undefined;
  for (const args of attempts) {
    const abi = pickBidWriteAbi(params.functionName, args);
    const estimation = await estimateContractGas(wagmiConfig, {
      address: params.address,
      abi,
      functionName: params.functionName,
      args,
      value: params.value,
      account: params.account,
    });
    if (estimation.success) {
      return { success: true, args, abi };
    }
    lastError = estimation.error;
    if (!isUnrecognizedSelectorError(estimation.rawError)) {
      return { success: false, error: estimation.error };
    }
  }
  return { success: false, error: lastError };
}

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
  prizesWallet: `0x${string}`,
  tokenAddress: string,
  amount: bigint,
  notifications: { showInfo: (m: string) => void; showSuccess: (m: string) => void; showError: (m: string) => void },
): Promise<boolean> {
  try {
    const allowance = await readContract(wagmiConfig, {
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, prizesWallet],
    });

    if (allowance >= amount) {
      notifications.showInfo('Token is already approved!');
      return true;
    }

    if (allowance > BigInt(0)) {
      notifications.showInfo('Step 1/2: Resetting token allowance... Please confirm the transaction in your wallet.');
      const resetHash = await writeWithBufferedFees({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [prizesWallet, BigInt(0)],
      });
      notifications.showInfo('Reset transaction submitted. Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash: resetHash });
      notifications.showSuccess('Allowance reset confirmed!');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const stepText = allowance > BigInt(0) ? 'Step 2/2: Setting' : 'Requesting';
    notifications.showInfo(`${stepText} token approval... Please confirm the transaction in your wallet.`);

    const hash = await writeWithBufferedFees({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [prizesWallet, amount],
    });
    notifications.showInfo('Approval transaction submitted. Waiting for confirmation...');
    await waitForTransactionReceipt(wagmiConfig, { hash });
    notifications.showSuccess('Token approval confirmed! Proceeding with bid...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    if (isUserRejection(error)) {
      return false;
    }
    const friendlyError = parseContractError(error);
    notifications.showError(`Token approval failed: ${friendlyError}`);
    return false;
  }
}

async function checkAndApproveNFT(
  ownerAddress: `0x${string}`,
  prizesWallet: `0x${string}`,
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

    if (approvedAddress?.toLowerCase() === prizesWallet.toLowerCase()) {
      notifications.showInfo('NFT is already approved!');
      return true;
    }

    const isApprovedForAll = await readContract(wagmiConfig, {
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'isApprovedForAll',
      args: [ownerAddress, prizesWallet],
    });

    if (isApprovedForAll) {
      notifications.showInfo('NFT is already approved!');
      return true;
    }

    notifications.showInfo('Requesting NFT approval... Please confirm the transaction in your wallet.');
    const hash = await writeWithBufferedFees({
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'approve',
      args: [prizesWallet, BigInt(tokenId)],
    });
    notifications.showInfo('Approval transaction submitted. Waiting for confirmation...');
    await waitForTransactionReceipt(wagmiConfig, { hash });
    notifications.showSuccess('NFT approval confirmed! Proceeding with bid...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    if (isUserRejection(error)) {
      return false;
    }
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
  const contracts = useContractAddresses();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifications = useMemo(
    () => ({ showInfo, showSuccess, showError }),
    [showInfo, showSuccess, showError],
  );

  const placeEthBid = useCallback(async (params: PlaceEthBidParams): Promise<boolean> => {
    const { bidMessage, ethBidPrice, priceBuffer, useRandomWalkNft: useRwNft, selectedNftId, donation } = params;

    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }
    if (!contracts) {
      showError('Game configuration is still loading. Please wait a moment and try again.');
      return false;
    }
    if (!isDeployedAddress(contracts.COSMIC_GAME)) {
      showError('Contract not deployed on this network. Please switch to the correct network.');
      return false;
    }
    const { COSMIC_GAME, PRIZES_WALLET } = contracts;

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
        const approved = await checkAndApproveNFT(address, PRIZES_WALLET, donation.address, donation.tokenId, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const validation = await validateBidCall({
          address: COSMIC_GAME,
          functionName: 'bidWithEthAndDonateNft',
          v1Args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
          value: finalValue,
          account: address,
        });
        if (!validation.success) {
          showError(validation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeWithBufferedFees({
          address: COSMIC_GAME,
          abi: validation.abi,
          functionName: 'bidWithEthAndDonateNft',
          args: validation.args,
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
        const approved = await checkAndApproveERC20(address, PRIZES_WALLET, donation.address, tokenAmount, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const validation = await validateBidCall({
          address: COSMIC_GAME,
          functionName: 'bidWithEthAndDonateToken',
          v1Args: [nftIdToSend, bidMessage, donation.address as `0x${string}`, tokenAmount],
          value: finalValue,
          account: address,
        });
        if (!validation.success) {
          showError(validation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeWithBufferedFees({
          address: COSMIC_GAME,
          abi: validation.abi,
          functionName: 'bidWithEthAndDonateToken',
          args: validation.args,
          value: finalValue,
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      // Regular bid (no donation)
      const validation = await validateBidCall({
        address: COSMIC_GAME,
        functionName: 'bidWithEth',
        v1Args: [nftIdToSend, bidMessage],
        value: finalValue,
        account: address,
      });
      if (!validation.success) {
        showError(validation.error || 'Transaction validation failed');
        return false;
      }

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeWithBufferedFees({
        address: COSMIC_GAME,
        abi: validation.abi,
        functionName: 'bidWithEth',
        args: validation.args,
        value: finalValue,
      });
      showInfo('Transaction submitted! Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Bid placed successfully!');
      return true;
    } catch (err) {
      if (isUserRejection(err)) {
        showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        return false;
      }
      reportError(err, 'placeEthBid');
      const valueWei =
        params.ethBidPrice +
        (params.ethBidPrice * BigInt(params.priceBuffer || 0)) / 100n;
      const displayedEthPrice = parseFloat(formatEther(valueWei));
      const friendlyError =
        getContractErrorMessage(err, displayedEthPrice) ||
        parseContractError(err);
      setError(friendlyError);
      showError(friendlyError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, contracts, showWarning, showError, showInfo, showSuccess, notifications]);

  const placeCstBid = useCallback(async (params: PlaceCstBidParams): Promise<boolean> => {
    const { bidMessage, cstBidPrice, maxCstPrice, donation } = params;

    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }
    if (!contracts) {
      showError('Game configuration is still loading. Please wait a moment and try again.');
      return false;
    }
    if (!isDeployedAddress(contracts.COSMIC_GAME)) {
      showError('Contract not deployed on this network. Please switch to the correct network.');
      return false;
    }
    const { COSMIC_GAME, PRIZES_WALLET } = contracts;

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
        const approved = await checkAndApproveNFT(address, PRIZES_WALLET, donation.address, donation.tokenId, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const validation = await validateBidCall({
          address: COSMIC_GAME,
          functionName: 'bidWithCstAndDonateNft',
          v1Args: [maxLimit, bidMessage, donation.address as `0x${string}`, BigInt(donation.tokenId)],
          account: address,
        });
        if (!validation.success) {
          showError(validation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeWithBufferedFees({
          address: COSMIC_GAME,
          abi: validation.abi,
          functionName: 'bidWithCstAndDonateNft',
          args: validation.args,
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      if (donation?.type === 'token') {
        const tokenAmount = await parseTokenAmount(donation.address, donation.amount);

        showInfo('Step 1/2: Checking ERC20 token approval...');
        const approved = await checkAndApproveERC20(address, PRIZES_WALLET, donation.address, tokenAmount, notifications);
        if (!approved) return false;

        showInfo('Step 2/2: Validating and submitting bid transaction...');
        const validation = await validateBidCall({
          address: COSMIC_GAME,
          functionName: 'bidWithCstAndDonateToken',
          v1Args: [maxLimit, bidMessage, donation.address as `0x${string}`, tokenAmount],
          account: address,
        });
        if (!validation.success) {
          showError(validation.error || 'Transaction validation failed');
          return false;
        }

        showInfo('Please confirm the transaction in your wallet...');
        const hash = await writeWithBufferedFees({
          address: COSMIC_GAME,
          abi: validation.abi,
          functionName: 'bidWithCstAndDonateToken',
          args: validation.args,
        });
        showInfo('Transaction submitted! Waiting for confirmation...');
        await waitForTransactionReceipt(wagmiConfig, { hash });
        showSuccess('Bid placed successfully!');
        return true;
      }

      // Regular CST bid
      const validation = await validateBidCall({
        address: COSMIC_GAME,
        functionName: 'bidWithCst',
        v1Args: [maxLimit, bidMessage],
        account: address,
      });
      if (!validation.success) {
        showError(validation.error || 'Transaction validation failed');
        return false;
      }

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeWithBufferedFees({
        address: COSMIC_GAME,
        abi: validation.abi,
        functionName: 'bidWithCst',
        args: validation.args,
      });
      showInfo('Transaction submitted! Waiting for confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Bid placed successfully!');
      return true;
    } catch (err) {
      if (isUserRejection(err)) {
        showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        return false;
      }
      reportError(err, 'placeCstBid');
      const friendlyError =
        getContractErrorMessage(err) || parseContractError(err);
      setError(friendlyError);
      showError(friendlyError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, contracts, showWarning, showError, showInfo, showSuccess, notifications]);

  return { placeEthBid, placeCstBid, isSubmitting, error };
}
