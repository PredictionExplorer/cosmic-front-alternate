/**
 * Centralized error reporter and Ethereum/contract error helpers.
 *
 * All error-handling paths should call reportError so there is one place to
 * wire up Sentry (or other error-tracking). Also provides isUserRejection,
 * getEthErrorMessage, and getContractErrorMessage for consistent UX.
 */

import * as Sentry from "@sentry/nextjs";
import { formatEther } from "viem";

export interface EthProviderError {
  code?: number;
  data?: { message?: string };
}

/** Type-guard for wallet/provider errors that carry a `.data` bag. */
export function isEthProviderError(err: unknown): err is EthProviderError {
  return typeof err === "object" && err !== null && "data" in err;
}

/** Returns true when the user explicitly rejected a wallet transaction (code 4001). */
export function isUserRejection(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 4001
  );
}

/**
 * Extracts a user-friendly message from an Ethereum provider error,
 * falling back to a default when none is available.
 */
export function getEthErrorMessage(
  err: unknown,
  fallback = "An error occurred",
): string {
  if (isEthProviderError(err) && err.data?.message) {
    return err.data.message;
  }
  return fallback;
}

/** Detects viem's ContractFunctionExecutionError (on-chain revert) by error name. */
export function isContractRevertError(err: unknown): boolean {
  return (
    err instanceof Error && err.name === "ContractFunctionExecutionError"
  );
}

const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  InsufficientReceivedBidAmount:
    "The current bid price is greater than the amount you transferred.",
  UsedRandomWalkNft: "This RandomWalk NFT has already been used for a bid.",
  CallerIsNotNftOwner: "You are not the owner of this NFT.",
  RoundIsInactive: "The current round is not active.",
  TooLongBidMessage: "Your bid message is too long.",
  WrongBidType: "Wrong bid type selected.",
  FundTransferFailed: "Fund transfer failed.",
  MainPrizeEarlyClaim:
    "Not enough time has elapsed to claim the prize.",
  MainPrizeClaimDenied:
    "Only the last bidder is permitted to claim the main prize.",
  NoBidsPlacedInCurrentRound:
    "There have been no bids in the current round yet.",
};

/**
 * Extracts the custom error name from a viem ContractFunctionRevertedError
 * nested inside a ContractFunctionExecutionError.
 */
function extractContractErrorName(err: unknown): string | null {
  if (!(err instanceof Error)) return null;

  const walkable = err as Error & {
    cause?: unknown;
    walk?: (fn: (e: Error) => boolean) => Error;
  };

  if (typeof walkable.walk === "function") {
    const inner = walkable.walk(
      (e: Error) => e.name === "ContractFunctionRevertedError",
    );
    if (inner && "data" in inner) {
      const data = (inner as Error & {
        data?: { errorName?: string; args?: unknown[] };
      }).data;
      if (data?.errorName) return data.errorName;
    }
  }

  if (walkable.cause instanceof Error) {
    return extractContractErrorName(walkable.cause);
  }

  return null;
}

/**
 * Returns a user-friendly error message for contract revert failures.
 * Decodes known contract custom errors and detects bid-price-rose scenarios.
 *
 * @param err - The caught error
 * @param displayedEthPrice - The ETH price (in ETH, not wei) shown to the user
 *   before submitting; used to compute the price-rose delta for
 *   InsufficientReceivedBidAmount.
 * @returns A friendly message string, or null to fall back to generic handling.
 */
export function getContractErrorMessage(
  err: unknown,
  displayedEthPrice?: number,
): string | null {
  const errorName = extractContractErrorName(err);
  if (!errorName) return null;

  if (
    errorName === "InsufficientReceivedBidAmount" &&
    displayedEthPrice !== undefined
  ) {
    const walkable = err as Error & {
      walk?: (fn: (e: Error) => boolean) => Error;
    };
    if (typeof walkable.walk === "function") {
      const inner = walkable.walk(
        (e: Error) => e.name === "ContractFunctionRevertedError",
      );
      if (inner && "data" in inner) {
        const data = (inner as Error & {
          data?: { args?: readonly unknown[] };
        }).data;
        const requiredWei = data?.args?.[1];
        if (typeof requiredWei === "bigint") {
          const requiredEth = parseFloat(formatEther(requiredWei));
          const delta = requiredEth - displayedEthPrice;
          if (delta > 0) {
            return (
              `Bid price rose by ${delta.toFixed(6)} ETH while your transaction was in transit. ` +
              `The new required price is ${requiredEth.toFixed(6)} ETH. Please try again.`
            );
          }
        }
      }
    }
  }

  return CUSTOM_ERROR_MESSAGES[errorName] ?? null;
}

/**
 * Reports an error to Sentry (if configured) and logs it to the console.
 * Use this instead of bare console.error throughout the codebase.
 */
export function reportError(error: unknown, context?: string): void {
  const summarizedError = summarizeErrorForConsole(error);
  if (context) {
    console.error(`[${context}] ${summarizedError}`);
  } else {
    console.error(summarizedError);
  }

  if (error instanceof Error) {
    Sentry.captureException(
      error,
      context ? { tags: { context } } : undefined,
    );
  } else {
    Sentry.captureMessage(String(error), {
      level: "error",
      ...(context ? { tags: { context } } : {}),
    });
  }
}

/**
 * Keeps console output concise in dev: do not log full viem error objects,
 * because they can include ABI/call metadata and flood Turbopack logs.
 */
function summarizeErrorForConsole(error: unknown): string {
  if (error instanceof Error) {
    const shortMessage = (
      error as Error & {
        shortMessage?: string;
        details?: string;
        cause?: unknown;
      }
    ).shortMessage;
    if (shortMessage && shortMessage.trim().length > 0) {
      return shortMessage;
    }

    const message = error.message?.trim();
    if (message) {
      return message;
    }

    const details = (
      error as Error & {
        details?: string;
      }
    ).details;
    if (details && details.trim().length > 0) {
      return details;
    }

    if (
      (error as Error & { cause?: unknown }).cause instanceof Error &&
      (error as Error & { cause: Error }).cause.message.trim().length > 0
    ) {
      return (error as Error & { cause: Error }).cause.message;
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "An unexpected error occurred.";
}
