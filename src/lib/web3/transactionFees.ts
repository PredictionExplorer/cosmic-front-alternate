/**
 * EIP-1559 fee buffers for Arbitrum / L2 floating base fees.
 *
 * Adds ~10% headroom on estimated fees and enforces maxFeePerGas ≥ buffered
 * base fee so txs are not rejected when base fee ticks up between estimate and send.
 */

import type { Config } from "@wagmi/core";
import { estimateFeesPerGas, getBlock } from "@wagmi/core";

/** Multiply by 110 / 100 (10% increase), round up */
const BUFFER_NUM = 110n;
const BUFFER_DEN = 100n;

export function bumpFeeWei(wei: bigint): bigint {
  if (wei <= 0n) return wei;
  return (wei * BUFFER_NUM + BUFFER_DEN - 1n) / BUFFER_DEN;
}

/** Apply 10% buffer to an explicit gas limit (ceil). */
export function bumpGasLimit(gas: bigint): bigint {
  return bumpFeeWei(gas);
}

/**
 * Returns maxFeePerGas / maxPriorityFeePerGas with +10% buffer vs `estimateFeesPerGas`,
 * and ensures maxFeePerGas is above the latest block base fee (also +10%) plus priority.
 */
export async function getBufferedEip1559Fees(
  config: Config,
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } | undefined> {
  try {
    const [fees, block] = await Promise.all([
      estimateFeesPerGas(config),
      getBlock(config, { blockTag: "latest" }),
    ]);

    const baseFee = block.baseFeePerGas ?? 0n;

    let maxFee =
      fees.maxFeePerGas != null ? bumpFeeWei(fees.maxFeePerGas) : 0n;
    const maxPriority =
      fees.maxPriorityFeePerGas != null
        ? bumpFeeWei(fees.maxPriorityFeePerGas)
        : 0n;

    if (baseFee > 0n) {
      const minMaxFee = bumpFeeWei(baseFee) + maxPriority;
      if (maxFee < minMaxFee) {
        maxFee = minMaxFee;
      }
    }

    if (maxFee === 0n || maxPriority === 0n) {
      return undefined;
    }

    return { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority };
  } catch {
    return undefined;
  }
}
