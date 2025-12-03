/**
 * Web3 Utility Functions
 *
 * Helper functions for blockchain interactions, formatting, and validation.
 */

import { formatEther, isAddress } from 'viem';

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

