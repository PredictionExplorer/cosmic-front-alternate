/**
 * Connect Wallet Button
 *
 * A beautifully styled wallet connection button that integrates with RainbowKit.
 * Matches the luxury aesthetic of the application while providing excellent UX.
 *
 * Features:
 * - Multi-wallet support (MetaMask, Coinbase, WalletConnect, Rainbow, and more)
 * - Shows connected address with ENS support
 * - Displays account balance
 * - Chain switching
 * - Disconnect option
 * - Beautiful modal with glassmorphism effects
 */

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Props for ConnectWalletButton
 */
interface ConnectWalletButtonProps {
	/** Button size variant */
	size?: 'sm' | 'md' | 'lg' | 'xl';
	/** Show full address or shortened */
	showFullAddress?: boolean;
	/** Show account balance */
	showBalance?: boolean;
	/** Custom className */
	className?: string;
}

/**
 * ConnectWalletButton Component
 *
 * Wraps RainbowKit's ConnectButton with custom styling that matches
 * the luxury aesthetic of Cosmic Signature.
 *
 * @example
 * ```tsx
 * <ConnectWalletButton size="lg" showBalance={true} />
 * ```
 */
export function ConnectWalletButton({
	size = 'md',
	showFullAddress = false,
	showBalance = true,
	className
}: ConnectWalletButtonProps) {
	return (
		<ConnectButton.Custom>
			{({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
				const ready = mounted;
				const connected = ready && account && chain;

				return (
					<div
						{...(!ready && {
							'aria-hidden': true,
							style: {
								opacity: 0,
								pointerEvents: 'none',
								userSelect: 'none'
							}
						})}
						className={className}
					>
						{(() => {
							if (!connected) {
								// Not connected - show connect button
								return (
									<Button size={size} onClick={openConnectModal} type="button">
										<Wallet className="mr-2" size={20} />
										Connect Wallet
									</Button>
								);
							}

							if (chain.unsupported) {
								// Wrong network - show switch button
								return (
									<Button size={size} variant="destructive" onClick={openChainModal} type="button">
										Wrong Network
									</Button>
								);
							}

							// Connected - show account info with fixed width
							return (
								<div className="flex items-center gap-2 justify-end w-full">
									{showBalance && account.balanceFormatted && (
										<div className="hidden md:flex items-center px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 min-w-[120px] justify-center">
											<span className="font-mono text-sm text-text-primary">
												{parseFloat(account.balanceFormatted).toFixed(4)}
											</span>
										</div>
									)}

									<Button
										size={size}
										variant="outline"
										onClick={openAccountModal}
										type="button"
										className="group min-w-[160px]"
									>
										<div className="flex items-center gap-2 justify-center w-full">
											{/* Connection Indicator */}
											<div className="relative flex-shrink-0">
												<div className="h-2 w-2 rounded-full bg-status-success" />
												<div className="absolute inset-0 h-2 w-2 rounded-full bg-status-success animate-ping opacity-75" />
											</div>

											{/* Address or ENS */}
											<span className="font-mono text-sm truncate max-w-[100px]">
												{account.displayName}
											</span>

											{/* Dropdown Icon */}
											<ChevronDown
												size={16}
												className="text-text-secondary group-hover:text-primary transition-colors flex-shrink-0"
											/>
										</div>
									</Button>

									{/* Chain Switcher (if needed in future) */}
									{/* <button
										onClick={openChainModal}
										type="button"
										className="flex items-center px-3 py-2 rounded-lg bg-background-elevated border border-text-muted/10 hover:border-primary/40 transition-colors"
									>
										{chain.hasIcon && chain.iconUrl && (
											<img
												alt={chain.name ?? 'Chain icon'}
												src={chain.iconUrl}
												className="h-5 w-5 rounded-full"
											/>
										)}
									</button> */}
								</div>
							);
						})()}
					</div>
				);
			}}
		</ConnectButton.Custom>
	);
}

/**
 * Compact version for mobile/header
 */
export function ConnectWalletButtonCompact({ className }: { className?: string }) {
	return <ConnectWalletButton size="sm" showBalance={false} showFullAddress={false} className={className} />;
}

/**
 * Full version with balance
 */
export function ConnectWalletButtonFull({ className }: { className?: string }) {
	return <ConnectWalletButton size="lg" showBalance={true} showFullAddress={false} className={className} />;
}
