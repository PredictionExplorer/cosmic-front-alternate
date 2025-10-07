'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	glass?: boolean;
	hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, glass = false, hover = false, children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					'rounded-lg border border-text-muted/10 transition-all duration-300',
					glass ? 'bg-background-surface/60 backdrop-blur-xl' : 'bg-background-surface',
					hover && 'hover:border-primary/30 hover:shadow-luxury hover:scale-[1.01]',
					className
				)}
				{...props}
			>
				{children}
			</div>
		);
	}
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h3
			ref={ref}
			className={cn('font-serif text-2xl font-semibold leading-none tracking-tight text-text-primary', className)}
			{...props}
		/>
	)
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
	)
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
));

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

