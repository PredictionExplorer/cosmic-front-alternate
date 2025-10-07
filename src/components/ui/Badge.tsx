'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors', {
	variants: {
		variant: {
			default: 'bg-primary/10 text-primary border border-primary/20',
			success: 'bg-status-success/10 text-status-success border border-status-success/20',
			warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
			error: 'bg-status-error/10 text-status-error border border-status-error/20',
			info: 'bg-status-info/10 text-status-info border border-status-info/20',
			outline: 'border border-text-secondary/30 text-text-secondary'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
	return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});

Badge.displayName = 'Badge';

export { Badge, badgeVariants };

