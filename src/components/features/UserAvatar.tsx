'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
	address: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	className?: string;
}

// Generate deterministic color from address
function addressToColor(address: string): { primary: string; secondary: string } {
	const hash = address.toLowerCase().slice(2, 10);
	const num = parseInt(hash, 16);

	// Use luxury color palette
	const colors = [
		{ primary: '#D4AF37', secondary: '#C5A028' }, // Gold
		{ primary: '#E5E4E2', secondary: '#C0C0C0' }, // Platinum
		{ primary: '#2D8659', secondary: '#1e5d3f' }, // Emerald
		{ primary: '#475569', secondary: '#334155' }, // Slate
		{ primary: '#D97706', secondary: '#b45309' }, // Amber
		{ primary: '#991B1B', secondary: '#7f1d1d' } // Burgundy
	];

	return colors[num % colors.length];
}

// Generate geometric pattern
function addressToPattern(address: string): string {
	const hash = address.toLowerCase().slice(2);
	const pattern: number[] = [];

	for (let i = 0; i < 25; i++) {
		const val = parseInt(hash[i % hash.length], 16);
		pattern.push(val);
	}

	return pattern.join(',');
}

export function UserAvatar({ address, size = 'md', className }: UserAvatarProps) {
	const { primary, secondary } = useMemo(() => addressToColor(address), [address]);
	const pattern = useMemo(() => addressToPattern(address), [address]);

	const sizeClasses = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-12 h-12',
		xl: 'w-16 h-16'
	};

	const gridSize = {
		sm: 4,
		md: 5,
		lg: 5,
		xl: 6
	}[size];

	const cellSize = {
		sm: 8,
		md: 10,
		lg: 12,
		xl: 16
	}[size];

	return (
		<div
			className={cn(
				'rounded-full overflow-hidden border-2 border-text-muted/20 flex-shrink-0',
				sizeClasses[size],
				className
			)}
		>
			<svg width="100%" height="100%" viewBox={`0 0 ${gridSize * 10} ${gridSize * 10}`}>
				<defs>
					<linearGradient id={`grad-${address}`} x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stopColor={primary} />
						<stop offset="100%" stopColor={secondary} />
					</linearGradient>
				</defs>

				{/* Background */}
				<rect width="100%" height="100%" fill="#0A0A0B" />

				{/* Pattern */}
				{pattern.split(',').map((val, i) => {
					if (parseInt(val) > 7) {
						const x = (i % gridSize) * 10;
						const y = Math.floor(i / gridSize) * 10;
						return (
							<rect
								key={i}
								x={x}
								y={y}
								width={10}
								height={10}
								fill={`url(#grad-${address})`}
								opacity={0.8}
							/>
						);
					}
					return null;
				})}
			</svg>
		</div>
	);
}
