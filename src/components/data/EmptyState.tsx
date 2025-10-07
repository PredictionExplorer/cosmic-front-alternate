import { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
	className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
	return (
		<Card glass className={cn('p-12 text-center', className)}>
			{Icon && (
				<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background-elevated mb-6">
					<Icon size={32} className="text-text-muted" />
				</div>
			)}

			<h3 className="font-serif text-2xl font-semibold text-text-primary mb-3">{title}</h3>

			<p className="text-text-secondary max-w-md mx-auto mb-6">{description}</p>

			{action && (
				<Button size="lg" variant="outline" onClick={action.onClick} asChild={!!action.href}>
					{action.href ? <a href={action.href}>{action.label}</a> : action.label}
				</Button>
			)}
		</Card>
	);
}
