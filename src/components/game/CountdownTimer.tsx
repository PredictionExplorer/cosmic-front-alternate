'use client';

import { useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
	targetSeconds: number;
	onComplete?: () => void;
	size?: 'sm' | 'md' | 'lg';
	showIcon?: boolean;
}

export function CountdownTimer({ targetSeconds, onComplete, size = 'md', showIcon = true }: CountdownTimerProps) {
	const [timeLeft, setTimeLeft] = useState(targetSeconds);

	useEffect(() => {
		setTimeLeft(targetSeconds);
	}, [targetSeconds]);

	useEffect(() => {
		if (timeLeft <= 0) {
			onComplete?.();
			return;
		}

		const timer = setInterval(() => {
			setTimeLeft(prev => {
				const next = prev - 1;
				if (next <= 0) {
					onComplete?.();
					return 0;
				}
				return next;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [timeLeft, onComplete]);

	const isUrgent = timeLeft < 300; // Less than 5 minutes
	const isCritical = timeLeft < 60; // Less than 1 minute

	const sizeClasses = {
		sm: 'text-lg md:text-xl',
		md: 'text-2xl md:text-3xl',
		lg: 'text-4xl md:text-5xl lg:text-6xl'
	};

	const iconSizes = {
		sm: 20,
		md: 24,
		lg: 32
	};

	return (
		<div className="flex items-center space-x-2">
			{showIcon && (
				<Clock
					size={iconSizes[size]}
					className={`${
						isCritical
							? 'text-status-error animate-pulse'
							: isUrgent
							? 'text-status-warning'
							: 'text-primary'
					}`}
				/>
			)}
			<div
				className={`font-mono font-semibold ${sizeClasses[size]} ${
					isCritical ? 'text-status-error animate-pulse' : isUrgent ? 'text-status-warning' : 'text-primary'
				}`}
			>
				{formatTime(timeLeft)}
			</div>
		</div>
	);
}

