'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, estimateFeesPerGas } from '@wagmi/core';
import { wagmiConfig } from '@/lib/web3/config';
import { CONTRACTS } from '@/lib/web3/contracts';
import { useNotification } from '@/contexts/NotificationContext';
import { parseContractError } from '@/lib/web3/errorHandling';
import { estimateContractGas } from '@/lib/web3/gasEstimation';
import CosmicGameABI from '@/contracts/CosmicGame.json';

interface ClaimPrizeResult {
  claimMainPrize: () => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
}

export function useClaimPrize(): ClaimPrizeResult {
  const { address, isConnected } = useAccount();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimMainPrize = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address) {
      showWarning('Please connect your wallet first');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      showInfo('Validating claim eligibility...');
      const estimation = await estimateContractGas(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
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

      let feeParams: { maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint } = {};
      try {
        const fees = await estimateFeesPerGas(wagmiConfig);
        if (fees.maxFeePerGas && fees.maxPriorityFeePerGas) {
          feeParams = {
            maxFeePerGas: (fees.maxFeePerGas * 3n) / 2n,
            maxPriorityFeePerGas: (fees.maxPriorityFeePerGas * 3n) / 2n,
          };
        }
      } catch {
        // Fee estimation failed — fall back to wallet defaults
      }

      showInfo('Please confirm the transaction in your wallet...');
      const hash = await writeContract(wagmiConfig, {
        address: CONTRACTS.COSMIC_GAME,
        abi: CosmicGameABI,
        functionName: 'claimMainPrize',
        ...feeParams,
      });

      showInfo('Transaction submitted! Waiting for blockchain confirmation...');
      await waitForTransactionReceipt(wagmiConfig, { hash });
      showSuccess('Main Prize claimed successfully! Congratulations!');
      return true;
    } catch (err) {
      console.error('[claimMainPrize] Error:', err);
      const friendlyError = parseContractError(err);
      if (friendlyError && !friendlyError.includes('Transaction was rejected')) {
        setError(friendlyError);
        showError(friendlyError);
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [isConnected, address, showWarning, showError, showInfo, showSuccess]);

  return { claimMainPrize, isSubmitting, error };
}
