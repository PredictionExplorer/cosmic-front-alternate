import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
	label: string;
	href?: string;
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[];
	className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
	return (
		<nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2', className)}>
			{items.map((item, index) => {
				const isLast = index === items.length - 1;

				return (
					<div key={index} className="flex items-center space-x-2">
						{item.href && !isLast ? (
							<Link
								href={item.href}
								className="text-sm text-text-secondary hover:text-primary transition-colors"
							>
								{item.label}
							</Link>
						) : (
							<span
								className={cn(
									'text-sm',
									isLast ? 'text-text-primary font-medium' : 'text-text-secondary'
								)}
							>
								{item.label}
							</span>
						)}

						{!isLast && <ChevronRight size={14} className="text-text-muted" />}
					</div>
				);
			})}
		</nav>
	);
}
