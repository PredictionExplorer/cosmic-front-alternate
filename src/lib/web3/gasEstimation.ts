/**
 * Gas Estimation Utilities
 *
 * Pre-validates transactions using simulateContract to catch errors
 * before opening MetaMask. Provides better UX by showing errors early.
 */

import { simulateContract } from '@wagmi/core';
import type { Config } from '@wagmi/core';
import type { Abi, Address } from 'viem';
import { parseContractError } from './errorHandling';

/**
 * Estimate gas for a contract call
 * Returns true if estimation succeeds, false if it would revert
 * Throws with friendly error message if transaction would fail
 */
export async function estimateContractGas(
  config: Config,
  params: {
    address: Address;
    abi: unknown; // Accept any ABI format
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    account?: Address;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use simulateContract to validate the transaction (catches contract-level reverts)
    await simulateContract(config, {
      address: params.address,
      abi: params.abi as Abi,
      functionName: params.functionName,
      args: params.args,
      value: params.value,
      account: params.account,
    });

    return { success: true };
  } catch (error) {
    const message = (error as { message?: string })?.message ?? String(error);

    // Gas/fee errors are NOT contract logic errors — the simulation uses a stale
    // fee estimate, but MetaMask will set correct fees when the user confirms.
    // Let these through so MetaMask can handle gas pricing.
    const isFeeError =
      message.includes('max fee per gas less than block base fee') ||
      message.includes('maxFeePerGas') ||
      message.includes('baseFee') ||
      message.includes('intrinsic gas too low') ||
      message.includes('gas price too low');

    if (isFeeError) {
      console.warn('simulateContract: fee estimation mismatch — passing through to MetaMask:', message);
      return { success: true };
    }

    // Transaction would revert at contract level — extract and show a friendly error
    console.error('Gas estimation failed:', error);
    const friendlyError = parseContractError(error);
    console.log('Parsed error message:', friendlyError);
    
    if (friendlyError && friendlyError !== 'Transaction failed. Please try again.') {
      return { success: false, error: friendlyError };
    }
    
    return { 
      success: false, 
      error: friendlyError || 'Transaction validation failed. Please check requirements.'
    };
  }
}

/**
 * Wrapper for contract writes with automatic gas estimation
 * 
 * @example
 * const result = await validateAndExecute(
 *   wagmiConfig,
 *   {
 *     address: CONTRACTS.COSMIC_GAME,
 *     abi: CosmicGameABI,
 *     functionName: 'bidWithEth',
 *     args: [tokenId, message],
 *     value: bidAmount,
 *     account: userAddress
 *   },
 *   async () => {
 *     // Execute the actual write transaction
 *     await write.bidWithEth(tokenId, message, bidAmount);
 *   }
 * );
 * 
 * if (!result.success) {
 *   showError(result.error);
 *   return;
 * }
 */
export async function validateAndExecute(
  config: Config,
  estimationParams: {
    address: Address;
    abi: unknown; // Accept any ABI format
    functionName: string;
    args?: readonly unknown[];
    value?: bigint;
    account?: Address;
  },
  executeCallback: () => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  // First, estimate gas to validate the transaction
  const estimation = await estimateContractGas(config, estimationParams);

  if (!estimation.success) {
    return estimation; // Return error without executing
  }

  // Transaction should succeed, execute it
  try {
    await executeCallback();
    return { success: true };
  } catch (error) {
    // Execution failed even though estimation succeeded
    const friendlyError = parseContractError(error);
    return { success: false, error: friendlyError };
  }
}
