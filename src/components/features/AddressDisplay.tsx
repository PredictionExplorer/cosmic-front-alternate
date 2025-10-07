'use client';

import { Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { cn, shortenAddress } from '@/lib/utils';

interface AddressDisplayProps {
	address: string;
	showCopy?: boolean;
	showLink?: boolean;
	shorten?: boolean;
	chars?: number;
	label?: string;
	className?: string;
}

export function AddressDisplay({
	address,
	showCopy = true,
	showLink = true,
	shorten = true,
	chars = 6,
	label,
	className
}: AddressDisplayProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const displayAddress = shorten ? shortenAddress(address, chars) : address;
	const explorerUrl = `https://arbiscan.io/address/${address}`;

	return (
		<div className={cn('inline-flex items-center space-x-2', className)}>
			{label && <span className="text-sm text-text-secondary mr-1">{label}:</span>}

			<code className="font-mono text-sm text-text-primary bg-background-elevated px-3 py-1 rounded">
				{displayAddress}
			</code>

			<div className="flex items-center space-x-1">
				{showCopy && (
					<button
						onClick={handleCopy}
						className="p-1.5 rounded hover:bg-background-elevated transition-colors group"
						aria-label="Copy address"
						title="Copy address"
					>
						{copied ? (
							<Check size={14} className="text-status-success" />
						) : (
							<Copy size={14} className="text-text-muted group-hover:text-primary transition-colors" />
						)}
					</button>
				)}

				{showLink && (
					<a
						href={explorerUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="p-1.5 rounded hover:bg-background-elevated transition-colors group"
						aria-label="View on Arbiscan"
						title="View on Arbiscan"
					>
						<ExternalLink
							size={14}
							className="text-text-muted group-hover:text-primary transition-colors"
						/>
					</a>
				)}
			</div>
		</div>
	);
}
