import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionLinkProps {
	hash: string;
	label?: string;
	short?: boolean;
	className?: string;
}

export function TransactionLink({ hash, label, short = true, className }: TransactionLinkProps) {
	const displayHash = short ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
	const explorerUrl = `https://arbiscan.io/tx/${hash}`;

	return (
		<a
			href={explorerUrl}
			target="_blank"
			rel="noopener noreferrer"
			className={cn(
				'inline-flex items-center space-x-1.5 text-sm text-primary hover:text-primary/80 transition-colors group',
				className
			)}
		>
			<span className="font-mono">{label || displayHash}</span>
			<ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
		</a>
	);
}
