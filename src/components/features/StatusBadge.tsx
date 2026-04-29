import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
	status: 'active' | 'inactive' | 'anchored' | 'released' | 'claimed' | 'unclaimed' | 'pending' | 'completed';
	className?: string;
}

const statusConfig = {
	active: { variant: 'success' as const, label: 'Active', dot: true },
	inactive: { variant: 'outline' as const, label: 'Inactive', dot: false },
	anchored: { variant: 'info' as const, label: 'Anchored', dot: true },
	released: { variant: 'outline' as const, label: 'Released', dot: false },
	claimed: { variant: 'success' as const, label: 'Claimed', dot: false },
	unclaimed: { variant: 'warning' as const, label: 'Unclaimed', dot: true },
	pending: { variant: 'warning' as const, label: 'Pending', dot: true },
	completed: { variant: 'success' as const, label: 'Completed', dot: false }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status] ?? statusConfig.inactive;

	return (
		<Badge variant={config.variant} className={cn('inline-flex items-center space-x-1.5', className)}>
			{config.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
			<span>{config.label}</span>
		</Badge>
	);
}
