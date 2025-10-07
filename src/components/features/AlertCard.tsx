'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

interface AlertCardProps {
	severity?: 'info' | 'success' | 'warning' | 'error';
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	dismissible?: boolean;
	onDismiss?: () => void;
	className?: string;
}

const severityConfig = {
	info: {
		icon: Info,
		bgClass: 'bg-status-info/10 border-status-info/20',
		iconClass: 'text-status-info',
		glowClass: 'shadow-[0_0_20px_rgba(71,85,105,0.3)]'
	},
	success: {
		icon: CheckCircle,
		bgClass: 'bg-status-success/10 border-status-success/20',
		iconClass: 'text-status-success',
		glowClass: 'shadow-[0_0_20px_rgba(45,134,89,0.3)]'
	},
	warning: {
		icon: AlertTriangle,
		bgClass: 'bg-primary/10 border-primary/20',
		iconClass: 'text-primary',
		glowClass: 'shadow-[0_0_20px_rgba(212,175,55,0.3)]'
	},
	error: {
		icon: AlertCircle,
		bgClass: 'bg-status-error/10 border-status-error/20',
		iconClass: 'text-status-error',
		glowClass: 'shadow-[0_0_20px_rgba(153,27,27,0.3)]'
	}
};

export function AlertCard({
	severity = 'info',
	title,
	description,
	action,
	dismissible = false,
	onDismiss,
	className
}: AlertCardProps) {
	const config = severityConfig[severity];
	const Icon = config.icon;

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className={className}
		>
			<Card glass className={cn('p-6 border', config.bgClass, config.glowClass, 'relative')}>
				<div className="flex items-start space-x-4">
					{/* Icon */}
					<div className={cn('flex-shrink-0 p-3 rounded-lg', config.bgClass)}>
						<Icon size={24} className={config.iconClass} />
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">{title}</h3>
						<p className="text-sm text-text-secondary leading-relaxed">{description}</p>

						{/* Action Button */}
						{action && (
							<div className="mt-4">
								<Button size="md" onClick={action.onClick}>
									{action.label}
								</Button>
							</div>
						)}
					</div>

					{/* Dismiss Button */}
					{dismissible && (
						<button
							onClick={onDismiss}
							className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors"
							aria-label="Dismiss"
						>
							<X size={20} />
						</button>
					)}
				</div>
			</Card>
		</motion.div>
	);
}
