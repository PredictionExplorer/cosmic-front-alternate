/**
 * V1 / V2 Cosmic Game contract compatibility helpers.
 *
 * Ported from the blue frontend (utils/cosmicGameContractCompat.ts).
 * The merged JSON ABI (src/contracts/CosmicGame.json) contains both function
 * signatures for the six bid entry points. V2 adds a required
 * `bidCstRewardAmountMinLimit_` argument after the message. Call sites try the
 * V2 shape first on deployed chains and fall back to V1 when the node reports
 * an unrecognized selector.
 */

import type { Abi, AbiFunction } from 'viem';

import CosmicGameABI from '@/contracts/CosmicGame.json';
import { getDefaultChainId } from '@/lib/networkConfig';

const cosmicGameAbiFull = CosmicGameABI as Abi;

/** Default min CST reward accepted on V2 bid entrypoints (0 = accept any contract value). */
export const BID_CST_REWARD_AMOUNT_MIN_LIMIT_V2 = 0n;

export interface BidArgsCompatOptions {
  cstRewardAmountMinLimit?: bigint;
  preferV2First?: boolean;
}

export type CosmicGameBidFunctionName =
  | 'bidWithEth'
  | 'bidWithEthAndDonateNft'
  | 'bidWithEthAndDonateToken'
  | 'bidWithCst'
  | 'bidWithCstAndDonateNft'
  | 'bidWithCstAndDonateToken';

const UNRECOGNIZED_SELECTOR_MARKERS = [
  'function selector was not recognized',
  "there's no fallback function",
  'there is no fallback function',
  'method not found',
  'invalid opcode',
] as const;

function errorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err ?? '');
  const extended = err as Error & {
    shortMessage?: string;
    details?: string;
    metaMessages?: string[];
    reason?: string;
  };
  return [
    err.message,
    extended.shortMessage,
    extended.details,
    extended.reason,
    ...(extended.metaMessages ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

/** True when the chain/proxy has no matching function for the attempted selector. */
export function isUnrecognizedSelectorError(err: unknown): boolean {
  const text = errorText(err).toLowerCase();
  if (UNRECOGNIZED_SELECTOR_MARKERS.some((m) => text.includes(m))) return true;

  const walkable = err as Error & { cause?: unknown };
  if (walkable.cause) return isUnrecognizedSelectorError(walkable.cause);
  return false;
}

/**
 * Try readers in order; skip unrecognized-selector failures and rethrow other errors.
 */
export async function readCosmicGameWithFallback<T>(
  readers: Array<() => Promise<T | undefined>>,
): Promise<T | undefined> {
  let lastSelectorError: unknown;
  for (const read of readers) {
    try {
      return await read();
    } catch (err) {
      if (isUnrecognizedSelectorError(err)) {
        lastSelectorError = err;
        continue;
      }
      throw err;
    }
  }
  if (lastSelectorError) throw lastSelectorError;
  return undefined;
}

/** Deployed Arbitrum and local upgraded stacks are V2; try V2 args first to avoid simulating a doomed V1 call. */
export function preferV2BidArgsFirst(): boolean {
  return [42161, 421614, 31337].includes(getDefaultChainId());
}

/** Narrow ABI slice for a single bid overload (avoids duplicate-name encoding ambiguity). */
export function pickBidWriteAbi(
  functionName: CosmicGameBidFunctionName,
  callArgs: readonly unknown[],
): Abi {
  const match = cosmicGameAbiFull.find(
    (item): item is AbiFunction =>
      item.type === 'function' &&
      item.name === functionName &&
      (item.inputs?.length ?? 0) === callArgs.length,
  );
  return match ? [match] : cosmicGameAbiFull;
}

/** Insert V2 `bidCstRewardAmountMinLimit_` after the message argument. */
export function bidArgsForV2(
  functionName: CosmicGameBidFunctionName,
  v1Args: readonly unknown[],
  cstRewardAmountMinLimit: bigint = BID_CST_REWARD_AMOUNT_MIN_LIMIT_V2,
): readonly unknown[] {
  const minLimit = cstRewardAmountMinLimit;
  switch (functionName) {
    case 'bidWithEth':
    case 'bidWithCst':
      return [v1Args[0], v1Args[1], minLimit];
    case 'bidWithEthAndDonateNft':
    case 'bidWithEthAndDonateToken':
    case 'bidWithCstAndDonateNft':
    case 'bidWithCstAndDonateToken':
      return [v1Args[0], v1Args[1], minLimit, v1Args[2], v1Args[3]];
    default: {
      const _exhaustive: never = functionName;
      return _exhaustive;
    }
  }
}

/**
 * Run an async action with V1/V2 args, retrying the alternate shape on unrecognized selector.
 * On deployed chains (see preferV2BidArgsFirst) V2 is tried first.
 */
export async function withBidArgsV1ThenV2<T>(
  functionName: CosmicGameBidFunctionName,
  v1Args: readonly unknown[],
  run: (args: readonly unknown[]) => Promise<T>,
  options: BidArgsCompatOptions = {},
): Promise<T> {
  const v2Args = bidArgsForV2(functionName, v1Args, options.cstRewardAmountMinLimit);
  const shouldPreferV2 = options.preferV2First ?? preferV2BidArgsFirst();
  const attempts = shouldPreferV2 ? [v2Args, v1Args] : [v1Args, v2Args];

  let lastSelectorError: unknown;
  for (const args of attempts) {
    try {
      return await run(args);
    } catch (err) {
      if (!isUnrecognizedSelectorError(err)) {
        throw err;
      }
      lastSelectorError = err;
    }
  }
  throw lastSelectorError;
}
