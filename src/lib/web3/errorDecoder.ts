/**
 * Contract Error Decoder
 * 
 * Properly decodes Solidity custom errors using the contract ABI
 */

import { decodeErrorResult, formatEther, parseAbi } from 'viem';
import type { Abi, Address, Hex } from 'viem';
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

/** OZ IERC20 errors bubbled from CST `transferFrom` during `bidWithCst` — not listed on CosmicGame ABI, so viem otherwise reports "unknown signature". */
const IERC20_ERRORS_ABI = parseAbi([
  'error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)',
  'error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)',
]) as Abi;

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

        // If no message in args, map known game error names (avoid breaking acronyms like ERC20)
        if (decoded.errorName) {
          const byName: Record<string, string> = {
            RoundIsInactive: 'The current cycle has not started yet',
            InsufficientReceivedBidAmount:
              'Insufficient amount sent for gesture. Price may have increased.',
            TooLongBidMessage: 'Gesture message is too long (max 280 characters)',
          };
          if (byName[decoded.errorName]) {
            return byName[decoded.errorName];
          }
          const friendlyName = decoded.errorName.replace(/([A-Z])/g, ' $1').trim();
          console.log('Returning friendly error name:', friendlyName);
          return friendlyName;
        }

        return null;
      }
    } catch {
      // This ABI doesn't have this error, try next one
      continue;
    }
  }

  try {
    const decoded = decodeErrorResult({
      abi: IERC20_ERRORS_ABI,
      data: hexData as Hex,
    });
    if (decoded.errorName === 'ERC20InsufficientBalance') {
      const [, balance, needed] = decoded.args as readonly [Address, bigint, bigint];
      return `Insufficient CST for this gesture (you have ${formatEther(balance)} CST; at least ${formatEther(needed)} CST required).`;
    }
    if (decoded.errorName === 'ERC20InsufficientAllowance') {
      const [, allowance, needed] = decoded.args as readonly [Address, bigint, bigint];
      return `Insufficient CST allowance for the game contract (allowance ${formatEther(allowance)} CST, need ${formatEther(needed)} CST). Approve CST spending on Cosmic Game and try again.`;
    }
  } catch {
    // not an OZ ERC20 error
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
