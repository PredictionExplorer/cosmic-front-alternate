/**
 * EIP-1559 fee buffers for Arbitrum / L2 floating base fees.
 *
 * L2s often return maxPriorityFeePerGas = 0; we must NOT bail out in that case or
 * viem/MetaMask falls back to a stale maxFeePerGas (e.g. 20_000_000 wei) below the
 * next block's base fee.
 */

import type { Config } from "@wagmi/core";
import { estimateFeesPerGas, getBlock } from "@wagmi/core";

/** +25% headroom (ceil) — Arbitrum base fee can move between estimate and send */
const BUFFER_NUM = 125n;
const BUFFER_DEN = 100n;

export function bumpFeeWei(wei: bigint): bigint {
  if (wei <= 0n) return wei;
  return (wei * BUFFER_NUM + BUFFER_DEN - 1n) / BUFFER_DEN;
}

/** Apply same buffer to gas limit (ceil). */
export function bumpGasLimit(gas: bigint): bigint {
  return bumpFeeWei(gas);
}

/**
 * Returns maxFeePerGas / maxPriorityFeePerGas with +25% buffer and a floor from
 * latest block base fee + priority (so maxFeePerGas is always above base fee).
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

    const estMax = fees.maxFeePerGas ?? 0n;
    const estPriorityRaw = fees.maxPriorityFeePerGas ?? 0n;

    // L2s often report 0 priority; use 1 wei so we never drop fee params entirely
    const maxPriority =
      estPriorityRaw > 0n ? bumpFeeWei(estPriorityRaw) : 1n;

    let maxFee = estMax > 0n ? bumpFeeWei(estMax) : 0n;

    if (baseFee > 0n) {
      // Must satisfy maxFeePerGas >= baseFee + priority (post-buffer)
      const minFromBaseAndTip = bumpFeeWei(baseFee) + maxPriority;
      if (maxFee < minFromBaseAndTip) {
        maxFee = minFromBaseAndTip;
      }
      // Extra safety: bump combined (base + raw tip) once
      const combined = baseFee + (estPriorityRaw > 0n ? estPriorityRaw : 0n);
      const minFromCombined = bumpFeeWei(combined);
      if (maxFee < minFromCombined) {
        maxFee = minFromCombined;
      }
    }

    if (maxFee === 0n) {
      return undefined;
    }

    return { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPriority };
  } catch {
    return undefined;
  }
}
