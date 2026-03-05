import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Smart ETH formatter:
 * - 0 or NaN          → "0"
 * - >= 1 ETH          → 2 decimal places  (e.g. 20.46, 9.61)
 * - < 1 ETH           → 3 significant digits from the first non-zero digit
 *                        (e.g. 0.000456 → "0.000456", 0.00100 → "0.001")
 * Never produces "0.00" for a non-zero value.
 */
export function formatEth(value: number | string): string {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	if (!isFinite(num) || num === 0) return '0';

	const abs = Math.abs(num);

	if (abs >= 1) {
		// 2 decimal places, with thousands separator for large values
		return num.toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	// For values < 1: find position of first significant digit then show 3 sig digits.
	// e.g. 0.000456 → exponent = -4 → decimalPlaces = 4 + 2 = 6 → "0.000456"
	const exponent = Math.floor(Math.log10(abs)); // e.g. -4 for 0.000456
	const decimalPlaces = Math.max(1, -exponent + 2);  // first digit pos + 2 more
	const fixedStr = num.toFixed(decimalPlaces);
	const fixed = parseFloat(fixedStr);
	// If rounding pushed it to >= 1, fall back to 2dp
	if (Math.abs(fixed) >= 1) return fixed.toFixed(2);
	// Use toFixed string directly to avoid scientific notation, then strip trailing zeros
	return fixedStr.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

/**
 * Convert Wei to Ether
 * @param weiValue - Value in Wei (as string or number)
 * @returns Value in Ether
 */
export function weiToEther(weiValue: string | number): number {
	const wei = typeof weiValue === 'string' ? parseFloat(weiValue) : weiValue;
	return wei / 1e18;
}

export function shortenAddress(address: string, chars = 4): string {
	if (!address) return '';
	return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatTime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (days > 0) {
		return `${days}d ${hours}h ${minutes}m ${secs}s`;
	}
	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`;
	}
	if (minutes > 0) {
		return `${minutes}m ${secs}s`;
	}
	return `${secs}s`;
}

export function formatDuration(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
	if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
	return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Safely extract timestamp from API response
 * Handles both nested (Tx.TimeStamp) and root-level TimeStamp
 * 
 * @param data - API response object that may contain timestamp
 * @returns ISO date string or current date as fallback
 */
export function safeTimestamp(data: unknown): string {
	try {
		// If data is nullish, return current date
		if (!data || typeof data !== 'object') {
			return new Date().toISOString();
		}

		const obj = data as Record<string, unknown>;
		
		// Try nested Tx.TimeStamp first (NFT data structure)
		if (obj.Tx && typeof obj.Tx === 'object') {
			const tx = obj.Tx as Record<string, unknown>;
			const timestamp = tx.TimeStamp as number;
			
			if (timestamp && !isNaN(timestamp) && timestamp > 0) {
				return new Date(timestamp * 1000).toISOString();
			}
			
			// Fallback to DateTime if available
			if (tx.DateTime && typeof tx.DateTime === 'string') {
				return tx.DateTime;
			}
		}
		
		// Try root-level TimeStamp (donated NFT structure)
		if (obj.TimeStamp) {
			const timestamp = obj.TimeStamp as number;
			if (timestamp && !isNaN(timestamp) && timestamp > 0) {
				return new Date(timestamp * 1000).toISOString();
			}
		}
		
		// Fallback to current date
		return new Date().toISOString();
	} catch (error) {
		console.warn('Error parsing timestamp:', error);
		return new Date().toISOString();
	}
}

/**
 * Format timestamp to localized date string
 * 
 * @param data - API response object or timestamp number
 * @returns Formatted date string
 */
export function formatTimestamp(data: unknown): string {
	const isoString = safeTimestamp(data);
	return new Date(isoString).toLocaleDateString();
}

