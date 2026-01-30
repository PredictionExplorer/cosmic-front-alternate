import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatEth(value: number | string): string {
	const num = typeof value === 'string' ? parseFloat(value) : value;
	return num.toLocaleString('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4
	});
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

