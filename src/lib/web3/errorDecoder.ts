/**
 * Contract Error Decoder
 * 
 * Properly decodes Solidity custom errors using the contract ABI
 */

import { decodeErrorResult } from 'viem';
import type { Abi, Hex } from 'viem';
import CosmicGameABI from '@/contracts/CosmicGame.json';
import PrizesWalletABI from '@/contracts/PrizesWallet.json';
import StakingWalletCSTABI from '@/contracts/StakingWalletCosmicSignatureNft.json';
import StakingWalletRWLKABI from '@/contracts/StakingWalletRandomWalkNft.json';

/**
 * Map of contract ABIs for error decoding
 */
const CONTRACT_ABIS: Record<string, Abi> = {
  CosmicGame: CosmicGameABI as Abi,
  PrizesWallet: PrizesWalletABI as Abi,
  StakingWalletCST: StakingWalletCSTABI as Abi,
  StakingWalletRWLK: StakingWalletRWLKABI as Abi,
};

/**
 * Decode contract error and extract user-friendly message
 */
export function decodeContractError(error: unknown): string | null {
  const errorObj = error as Record<string, unknown>;
  
  // Try to get error data (hex string)
  let errorData: Hex | undefined;
  
  if (errorObj?.data) {
    errorData = errorObj.data as Hex;
  } else if (errorObj?.cause && typeof errorObj.cause === 'object') {
    const cause = errorObj.cause as Record<string, unknown>;
    if (cause?.data) {
      errorData = cause.data as Hex;
    }
  } else if (errorObj?.details && typeof errorObj.details === 'string') {
    // Sometimes error data is in details
    const dataMatch = errorObj.details.match(/0x[0-9a-fA-F]+/);
    if (dataMatch) {
      errorData = dataMatch[0] as Hex;
    }
  }

  if (!errorData) {
    console.debug('No error data found for decoding');
    return null;
  }

  // Ensure errorData is a hex string
  const hexData = typeof errorData === 'string' ? errorData : String(errorData);
  
  if (!hexData.startsWith('0x')) {
    console.debug('Error data is not a hex string:', hexData);
    return null;
  }

  console.log('Found error data for decoding:', hexData);

  // Try to decode with each ABI
  for (const [contractName, abi] of Object.entries(CONTRACT_ABIS)) {
    try {
      const decoded = decodeErrorResult({
        abi,
        data: hexData as Hex,
      });

      if (decoded) {
        console.log(`Successfully decoded error with ${contractName} ABI:`, decoded);
        
        // Extract the error message (usually the first string argument)
        const args = decoded.args as readonly unknown[];
        
        if (Array.isArray(args) && args.length > 0) {
          console.log('Error args:', args);
          // First argument is usually the error message
          if (typeof args[0] === 'string' && args[0].length > 0) {
            console.log('Returning error message from args[0]:', args[0]);
            return args[0];
          }
        }

        // If no message in args, check if decoded has errorName property
        // and return a friendly version
        if (decoded.errorName) {
          // Convert camelCase to spaces and capitalize
          const friendlyName = decoded.errorName
            .replace(/([A-Z])/g, ' $1')
            .trim();
          console.log('Returning friendly error name:', friendlyName);
          return friendlyName;
        }

        return null;
      }
    } catch (e) {
      // This ABI doesn't have this error, try next one
      continue;
    }
  }

  console.log('Failed to decode error with any ABI');
  return null;
}

/**
 * Calculate UTF-8 byte length of a string
 * This matches how Solidity counts string length
 */
export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Validate bid message length (must be <= 280 bytes in UTF-8)
 */
export function validateBidMessageLength(message: string, maxBytes = 280): {
  isValid: boolean;
  byteLength: number;
  error?: string;
} {
  const byteLength = getByteLength(message);
  
  if (byteLength > maxBytes) {
    return {
      isValid: false,
      byteLength,
      error: `Message is too long (${byteLength} bytes). Maximum is ${maxBytes} bytes. Some Unicode characters use multiple bytes.`,
    };
  }

  return {
    isValid: true,
    byteLength,
  };
}
