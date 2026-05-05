'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { wagmiConfig } from '@/lib/web3/config';
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
import { getBufferedEip1559Fees } from '@/lib/web3/transactionFees';
import CosmicGameABI from '@/contracts/CosmicGame.json';

interface ClaimPrizeResult {
  claimMainPrize: () => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function useClaimPrize(): ClaimPrizeResult {
  const { address, isConnected } = useAccount();
  const contracts = useContractAddresses();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimMainPrize = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }
    if (!contracts?.COSMIC_GAME) {
      showError('Game configuration is still loading. Please wait a moment and try again.');
      return false;
    }
    const gameAddr = contracts.COSMIC_GAME;

    setIsSubmitting(true);
    setError(null);

    try {
      showInfo('Validating claim eligibility...');
      const estimation = await estimateContractGas(wagmiConfig, {
        address: gameAddr,
        abi: CosmicGameABI,
        functionName: 'claimMainPrize',
        args: [],
        account: address,
      });

      if (!estimation.success) {
        const errorMsg = estimation.error || '';
        const isTimingError =
          errorMsg.toLowerCase().includes('time') ||
          errorMsg.toLowerCase().includes('elapsed') ||
          errorMsg.toLowerCase().includes('early') ||
          errorMsg.toLowerCase().includes('earlyclaim') ||
          errorMsg.toLowerCase().includes('not yet');
        const isInfraError =
          errorMsg.toLowerCase().includes('rpc') ||
          errorMsg.toLowerCase().includes('network') ||
          errorMsg.toLowerCase().includes('fetch') ||
          errorMsg.toLowerCase().includes('timeout') ||
          errorMsg.toLowerCase().includes('blocked');

        if (isTimingError) {
          showError("The blockchain timer hasn't fully expired yet. Please wait a few more seconds and try again.");
          return false;
        }
        if (!isInfraError) {
          showError(errorMsg || 'Cannot claim prize at this time');
          return false;
        }
        // Infrastructure issue — proceed to wallet
        console.warn('[claimMainPrize] Simulation blocked by infra error, proceeding to wallet:', errorMsg);
      }

      const feeParams = (await getBufferedEip1559Fees(wagmiConfig)) ?? {};

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeContract(wagmiConfig, {
        address: gameAddr,
        abi: CosmicGameABI,
        functionName: 'claimMainPrize',
        ...feeParams,
      });

      showInfo('Transaction submitted! Waiting for blockchain confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Main Prize claimed successfully! Congratulations!');
      return true;
    } catch (err) {
      if (isUserRejection(err)) {
        showInfo(WALLET_TRANSACTION_CANCELLED_MESSAGE);
        return false;
      }
      reportError(err, 'claimMainPrize');
      const friendlyError =
        getContractErrorMessage(err) || parseContractError(err);
      setError(friendlyError);
      showError(friendlyError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, contracts, showWarning, showError, showInfo, showSuccess]);

  return { claimMainPrize, isSubmitting, error };
}
