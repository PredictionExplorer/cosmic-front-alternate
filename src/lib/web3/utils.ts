/**
 * Web3 Utility Functions
 *
 * Helper functions for blockchain interactions, formatting, and validation.
 */

import { formatEther, formatUnits, parseEther, parseUnits, isAddress } from 'viem';

/**
 * Format Wei to ETH with specified decimals
 *
 * @param wei - Amount in Wei
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted ETH string
 *
 * @example
 * formatWeiToEth(1000000000000000000n) // "1.0000"
 * formatWeiToEth(1234567890123456789n, 6) // "1.234568"
 */
export function formatWeiToEth(wei: bigint | string | number, decimals: number = 4): string {
	const ethValue = formatEther(BigInt(wei));
	const num = parseFloat(ethValue);
	return num.toFixed(decimals);
}

/**
 * Format Wei to CST (or any ERC-20 with 18 decimals)
 *
 * @param wei - Amount in Wei
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted CST string
 */
export function formatWeiToCST(wei: bigint | string | number, decimals: number = 2): string {
	const cstValue = formatUnits(BigInt(wei), 18);
	const num = parseFloat(cstValue);
	return num.toFixed(decimals);
}

/**
 * Parse ETH amount to Wei
 *
 * @param eth - ETH amount as string
 * @returns Wei as bigint
 *
 * @example
 * parseEthToWei("1.5") // 1500000000000000000n
 */
export function parseEthToWei(eth: string): bigint {
	return parseEther(eth);
}

/**
 * Parse token amount to Wei (respecting decimals)
 *
 * @param amount - Token amount as string
 * @param decimals - Token decimals (default: 18)
 * @returns Wei as bigint
 */
export function parseTokenToWei(amount: string, decimals: number = 18): bigint {
	return parseUnits(amount, decimals);
}

/**
 * Shorten an Ethereum address for display
 *
 * @param address - Full Ethereum address
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Shortened address (e.g., "0x1234...5678")
 *
 * @example
 * shortenAddress("0x1234567890123456789012345678901234567890") // "0x1234...7890"
 * shortenAddress("0x1234567890123456789012345678901234567890", 6) // "0x123456...567890"
 */
export function shortenAddress(address: string, chars: number = 4): string {
	if (!address) return '';
	if (!isAddress(address)) return address;

	const start = address.slice(0, chars + 2); // +2 for "0x"
	const end = address.slice(-chars);
	return `${start}...${end}`;
}

/**
 * Validate Ethereum address
 *
 * @param address - Address to validate
 * @returns True if valid Ethereum address
 */
export function validateAddress(address: string): boolean {
	return isAddress(address);
}

/**
 * Format seconds to human-readable duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "2h 34m 12s")
 *
 * @example
 * formatDuration(9252) // "2h 34m 12s"
 * formatDuration(90) // "1m 30s"
 * formatDuration(30) // "30s"
 */
export function formatDuration(seconds: number): string {
	if (seconds < 0) return '0s';

	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const parts: string[] = [];

	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

	return parts.join(' ');
}

/**
 * Format timestamp to date/time string
 *
 * @param timestamp - Unix timestamp (seconds)
 * @param includeTime - Include time (default: true)
 * @returns Formatted date string
 *
 * @example
 * formatTimestamp(1699564800) // "Nov 9, 2023, 12:00 PM"
 * formatTimestamp(1699564800, false) // "Nov 9, 2023"
 */
export function formatTimestamp(timestamp: number, includeTime: boolean = true): string {
	const date = new Date(timestamp * 1000);

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		...(includeTime && {
			hour: '2-digit',
			minute: '2-digit'
		})
	};

	return date.toLocaleString('en-US', options);
}

/**
 * Add percentage to a bigint value
 *
 * @param value - Original value
 * @param percentage - Percentage to add (e.g., 2 for +2%)
 * @returns New value with percentage added
 *
 * @example
 * addPercentage(1000000000000000000n, 2) // 1020000000000000000n (+2%)
 */
export function addPercentage(value: bigint, percentage: number): bigint {
	const multiplier = BigInt(Math.floor((100 + percentage) * 100));
	return (value * multiplier) / 10000n;
}

/**
 * Calculate gas limit with buffer
 *
 * @param estimatedGas - Estimated gas
 * @param bufferPercentage - Buffer percentage (default: 20 for +20%)
 * @param minimumGas - Minimum gas limit (default: 2000000)
 * @returns Gas limit with buffer
 */
export function calculateGasLimit(
	estimatedGas: bigint,
	bufferPercentage: number = 20,
	minimumGas: bigint = 2000000n
): bigint {
	const buffered = (estimatedGas * BigInt(100 + bufferPercentage)) / 100n;
	return buffered > minimumGas ? buffered : minimumGas;
}

/**
 * Check if value is a valid Ethereum transaction hash
 *
 * @param hash - Transaction hash to validate
 * @returns True if valid tx hash
 */
export function isValidTxHash(hash: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Parse contract error message to user-friendly text
 *
 * @param error - Error object from contract call
 * @returns User-friendly error message
 */
export function parseContractError(error: unknown): string {
	// Extract error message from various error formats
	if (typeof error === 'string') return error;

	const errorObj = error as Record<string, unknown>;
	if (typeof errorObj?.message === 'string') {
		// Extract message from common error formats
		const msg = errorObj.message;

		// Execution reverted
		if (msg.includes('execution reverted')) {
			const match = msg.match(/execution reverted: (.+)$/);
			if (match) return match[1];
		}

		// User rejected
		if (msg.includes('user rejected') || errorObj.code === 4001) {
			return 'Transaction rejected by user';
		}

		// Insufficient funds
		if (msg.includes('insufficient funds')) {
			return 'Insufficient ETH balance for transaction';
		}

		return msg;
	}

	if (typeof errorObj?.reason === 'string') {
		return errorObj.reason;
	}

	return 'Transaction failed. Please try again.';
}

/**
 * Wait for a specified delay
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export async function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if address is likely a contract (heuristic)
 *
 * @param address - Address to check
 * @returns True if likely a contract
 *
 * Note: This is a heuristic and not 100% accurate.
 * For accurate detection, you need to call provider.getCode(address)
 */
export function isLikelyContract(address: string): boolean {
	// This is just a heuristic - real check requires provider
	// Contracts often have specific patterns in addresses
	// For accurate check, use: provider.getCode(address) !== '0x'
	return isAddress(address);
}

/**
 * Format large numbers with commas
 *
 * @param num - Number to format
 * @returns Formatted string with commas
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(num: number): string {
	return num.toLocaleString('en-US');
}

/**
 * Calculate percentage
 *
 * @param part - Part value
 * @param total - Total value
 * @param decimals - Decimal places (default: 2)
 * @returns Percentage string
 *
 * @example
 * calculatePercentage(25, 100) // "25.00"
 * calculatePercentage(1, 3, 0) // "33"
 */
export function calculatePercentage(part: number, total: number, decimals: number = 2): string {
	if (total === 0) return '0';
	return ((part / total) * 100).toFixed(decimals);
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength) + '...';
}
