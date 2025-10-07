'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
	label: string;
	value: string | number;
	icon?: LucideIcon;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
	delay?: number;
}

export function StatCard({ label, value, icon: Icon, trend, className, delay = 0 }: StatCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.5, delay }}
		>
			<Card glass hover className={cn('p-6', className)}>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<p className="text-sm font-medium text-text-secondary mb-2">{label}</p>
						<p className="font-mono text-3xl md:text-4xl font-semibold text-primary">{value}</p>
						{trend && (
							<div className="mt-2 flex items-center space-x-1">
								<span
									className={cn(
										'text-xs font-medium',
										trend.isPositive ? 'text-status-success' : 'text-status-error'
									)}
								>
									{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
								</span>
							</div>
						)}
					</div>
					{Icon && (
						<div className="rounded-lg bg-primary/10 p-3">
							<Icon size={24} className="text-primary" />
						</div>
					)}
				</div>
			</Card>
		</motion.div>
	);
}

