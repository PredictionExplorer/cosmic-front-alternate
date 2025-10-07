import { Badge } from '../ui/Badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
	status: 'active' | 'inactive' | 'staked' | 'unstaked' | 'claimed' | 'unclaimed' | 'pending' | 'completed';
	className?: string;
}

const statusConfig = {
	active: { variant: 'success' as const, label: 'Active', dot: true },
	inactive: { variant: 'outline' as const, label: 'Inactive', dot: false },
	staked: { variant: 'info' as const, label: 'Staked', dot: true },
	unstaked: { variant: 'outline' as const, label: 'Unstaked', dot: false },
	claimed: { variant: 'success' as const, label: 'Claimed', dot: false },
	unclaimed: { variant: 'warning' as const, label: 'Unclaimed', dot: true },
	pending: { variant: 'warning' as const, label: 'Pending', dot: true },
	completed: { variant: 'success' as const, label: 'Completed', dot: false }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status];

	return (
		<Badge variant={config.variant} className={cn('inline-flex items-center space-x-1.5', className)}>
			{config.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
			<span>{config.label}</span>
		</Badge>
	);
}
