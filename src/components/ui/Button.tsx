'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				primary: 'bg-gradient-gold text-background hover:shadow-luxury hover:scale-[1.02] active:scale-[0.98]',
				secondary:
					'bg-background-elevated text-primary border border-primary/20 hover:border-primary/40 hover:shadow-luxury',
				ghost: 'text-text-primary hover:bg-background-elevated hover:text-primary',
				outline:
					'border border-text-secondary/30 text-text-primary hover:border-primary hover:text-primary hover:shadow-luxury',
				danger: 'bg-status-error text-text-primary hover:bg-status-error/90 hover:shadow-lg'
			},
			size: {
				sm: 'h-9 px-4 text-sm',
				md: 'h-11 px-6 text-base',
				lg: 'h-14 px-8 text-lg',
				xl: 'h-16 px-10 text-xl'
			}
		},
		defaultVariants: {
			variant: 'primary',
			size: 'md'
		}
	}
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<span>Loading...</span>
					</div>
				) : (
					children
				)}
			</Comp>
		);
	}
);

Button.displayName = 'Button';

export { Button, buttonVariants };
