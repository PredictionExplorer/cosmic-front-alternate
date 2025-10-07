'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Timer, TrendingUp, Coins, AlertCircle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/game/CountdownTimer';
import { StatCard } from '@/components/game/StatCard';
import { useCosmicGame } from '@/hooks/useCosmicGameContract';
import { useApiData } from '@/contexts/ApiDataContext';
import { useNotification } from '@/contexts/NotificationContext';
import { formatWeiToEth } from '@/lib/web3/utils';
import { parseContractError } from '@/lib/web3/errorHandling';
import { formatEth, formatCst } from '@/lib/utils';

export default function PlayPage() {
	const { address, isConnected } = useAccount();
	const { read, write, isTransactionPending, transactionHash } = useCosmicGame();
	const { dashboardData, refresh: refreshDashboard } = useApiData();
	const { showSuccess, showError, showInfo, showWarning } = useNotification();

	// UI State
	const [bidType, setBidType] = useState<'ETH' | 'CST'>('ETH');
	const [useRandomWalkNft, setUseRandomWalkNft] = useState(false);
	const [bidMessage, setBidMessage] = useState('');
	const [maxCstPrice, setMaxCstPrice] = useState('');
	const [priceBuffer, setPriceBuffer] = useState(2); // % buffer for price collision prevention

	// Get blockchain data
	const { data: roundNum } = read.useRoundNum();
	const { data: lastBidder } = read.useLastBidder();
	const { data: mainPrizeTime } = read.useMainPrizeTime();
	const { data: ethBidPriceRaw } = read.useEthBidPrice();
	const { data: cstBidPriceRaw } = read.useCstBidPrice();
	const { data: currentChampions } = read.useCurrentChampions();
	const { data: prizeAmount } = read.useMainPrizeAmount();

	// Calculate timer
	const [timeRemaining, setTimeRemaining] = useState(0);
	useEffect(() => {
		if (mainPrizeTime) {
			const update = () => {
				const remaining = Number(mainPrizeTime) - Math.floor(Date.now() / 1000);
				setTimeRemaining(Math.max(0, remaining));
			};
			update();
			const interval = setInterval(update, 1000);
			return () => clearInterval(interval);
		}
	}, [mainPrizeTime]);

	// Format prices
	const ethBidPrice = ethBidPriceRaw ? parseFloat(formatWeiToEth(ethBidPriceRaw, 6)) : 0;
	const cstBidPrice = cstBidPriceRaw ? parseFloat(formatWeiToEth(cstBidPriceRaw, 2)) : 0;

	// Calculate adjusted price with buffer
	const adjustedEthPrice = ethBidPrice * (1 + priceBuffer / 100);
	const discountedEthPrice = useRandomWalkNft ? adjustedEthPrice * 0.5 : adjustedEthPrice;

	// Handle ETH bid
	const handleEthBid = async () => {
		if (!isConnected) {
			showWarning('Please connect your wallet first');
			return;
		}

		if (!ethBidPriceRaw) {
			showError('Unable to get bid price. Please try again.');
			return;
		}

		try {
			// Calculate value with buffer
			const valueInWei = ethBidPriceRaw + (ethBidPriceRaw * BigInt(priceBuffer)) / 100n;
			const finalValue = useRandomWalkNft ? valueInWei / 2n : valueInWei;

			// Submit bid
			await write.bidWithEth(
				useRandomWalkNft ? 0n : -1n, // RandomWalk NFT ID (0 for now, -1 for none)
				bidMessage,
				finalValue
			);

			showInfo('Transaction submitted! Waiting for confirmation...');
		} catch (error) {
			const friendlyError = parseContractError(error);
			showError(friendlyError);
		}
	};

	// Handle CST bid
	const handleCstBid = async () => {
		if (!isConnected) {
			showWarning('Please connect your wallet first');
			return;
		}

		if (!cstBidPriceRaw) {
			showError('Unable to get CST bid price. Please try again.');
			return;
		}

		try {
			// Use maxCstPrice if provided, otherwise use current price * 1.1 for safety
			const maxLimit = maxCstPrice ? parseEther(maxCstPrice) : (cstBidPriceRaw * 110n) / 100n;

			await write.bidWithCst(maxLimit, bidMessage);

			showInfo('Transaction submitted! Waiting for confirmation...');
		} catch (error) {
			const friendlyError = parseContractError(error);
			showError(friendlyError);
		}
	};

	// Watch for transaction success
	useEffect(() => {
		if (write.status.isSuccess) {
			showSuccess('🎉 Bid placed successfully! You earned 100 CST tokens.');
			setBidMessage('');
			// Refresh data after short delay
			setTimeout(() => {
				refreshDashboard();
			}, 2000);
		}
	}, [write.status.isSuccess, showSuccess, refreshDashboard]);

	// Prepare display data
	const currentRound = {
		roundNumber: roundNum?.toString() || '0',
		prizePool: prizeAmount ? parseFloat(formatWeiToEth(prizeAmount, 4)) : 0,
		totalBids: (dashboardData?.CurNumBids as number) || 0,
		lastBidder: lastBidder || '0x0',
		timeRemaining
	};

	return (
		<div className="min-h-screen">
			{/* Header */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
						<Badge variant="success" className="mb-4">
							Round {currentRound.roundNumber} Active
						</Badge>
						<h1 className="heading-lg text-balance mb-6">
							Compete for
							<span className="text-gradient block mt-2">{currentRound.prizePool.toFixed(2)} ETH</span>
						</h1>
						<div className="flex justify-center">
							<CountdownTimer targetSeconds={timeRemaining} size="lg" />
						</div>
					</motion.div>
				</Container>
			</section>

			{/* Main Dashboard */}
			<section className="py-12">
				<Container>
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left Column: Bid Form */}
						<div className="lg:col-span-2 space-y-6">
							{/* Bid Type Selector */}
							<Card glass>
								<CardHeader>
									<CardTitle>Place Your Bid</CardTitle>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* ETH or CST Toggle */}
									<div className="flex p-1 rounded-lg bg-background-elevated border border-text-muted/10">
										<button
											onClick={() => setBidType('ETH')}
											disabled={isTransactionPending}
											className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
												bidType === 'ETH'
													? 'bg-primary/10 text-primary'
													: 'text-text-secondary hover:text-primary'
											}`}
										>
											ETH Bid
										</button>
										<button
											onClick={() => setBidType('CST')}
											disabled={
												isTransactionPending ||
												!lastBidder ||
												lastBidder === '0x0000000000000000000000000000000000000000'
											}
											className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
												bidType === 'CST'
													? 'bg-primary/10 text-primary'
													: 'text-text-secondary hover:text-primary'
											}`}
										>
											CST Bid
											{(!lastBidder ||
												lastBidder === '0x0000000000000000000000000000000000000000') && (
												<span className="text-xs block">(After first bid)</span>
											)}
										</button>
									</div>

									{bidType === 'ETH' ? (
										<>
											{/* Current ETH Price */}
											<div className="space-y-2">
												<label className="text-sm text-text-secondary">Current Bid Price</label>
												<div className="flex items-baseline space-x-2">
													<span className="font-mono text-4xl font-semibold text-primary">
														{ethBidPrice.toFixed(6)}
													</span>
													<span className="text-text-secondary">ETH</span>
												</div>
												{useRandomWalkNft && (
													<p className="text-xs text-status-success">
														50% discount applied with Random Walk NFT
													</p>
												)}
											</div>

											{/* Price Collision Prevention */}
											<div className="space-y-2">
												<label className="text-sm text-text-secondary">
													Price Collision Prevention (+{priceBuffer}%)
												</label>
												<div className="flex items-center space-x-4">
													<input
														type="range"
														min="0"
														max="10"
														value={priceBuffer}
														onChange={e => setPriceBuffer(Number(e.target.value))}
														className="flex-1"
													/>
													<span className="font-mono text-sm text-primary w-16">
														{priceBuffer}%
													</span>
												</div>
												<div className="flex justify-between text-xs text-text-muted">
													<span>You'll pay:</span>
													<span className="font-mono text-primary">
														{discountedEthPrice.toFixed(6)} ETH
													</span>
												</div>
												<p className="text-xs text-text-secondary">
													Adds a buffer to prevent your bid from failing if someone bids
													simultaneously
												</p>
											</div>

											{/* Random Walk NFT Toggle */}
											<div className="space-y-3">
												<label className="flex items-center space-x-3 cursor-pointer group">
													<input
														type="checkbox"
														checked={useRandomWalkNft}
														onChange={e => setUseRandomWalkNft(e.target.checked)}
														disabled={isTransactionPending}
														className="h-5 w-5 rounded border-text-muted/30 bg-background-elevated text-primary"
													/>
													<span className="text-text-primary group-hover:text-primary transition-colors">
														Use Random Walk NFT (50% discount)
													</span>
												</label>
												{useRandomWalkNft && (
													<div className="ml-8 p-3 rounded-lg bg-status-warning/10 border border-status-warning/20">
														<p className="text-xs text-text-secondary flex items-start">
															<AlertCircle
																size={14}
																className="mr-2 mt-0.5 flex-shrink-0 text-status-warning"
															/>
															Warning: Each Random Walk NFT can only be used once, ever.
															This action is permanent.
														</p>
													</div>
												)}
											</div>
										</>
									) : (
										<>
											{/* Current CST Price */}
											<div className="space-y-2">
												<label className="text-sm text-text-secondary">
													Current CST Bid Price
												</label>
												<div className="flex items-baseline space-x-2">
													<span className="font-mono text-4xl font-semibold text-primary">
														{cstBidPrice.toFixed(2)}
													</span>
													<span className="text-text-secondary">CST</span>
												</div>
												<p className="text-xs text-text-secondary">
													{cstBidPrice === 0
														? 'FREE BID! Dutch auction ended'
														: 'Price decreases to 0 over time'}
												</p>
											</div>

											{/* Max Price Protection */}
											<div className="space-y-2">
												<label className="text-sm text-text-secondary">
													Maximum Price (Slippage Protection)
												</label>
												<input
													type="number"
													value={maxCstPrice}
													onChange={e => setMaxCstPrice(e.target.value)}
													placeholder={`Leave empty for auto (${(cstBidPrice * 1.1).toFixed(
														2
													)} CST)`}
													disabled={isTransactionPending}
													className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
												/>
												<p className="text-xs text-text-secondary">
													Your bid will revert if the price increases above this limit
												</p>
											</div>
										</>
									)}

									{/* Message */}
									<div className="space-y-2">
										<label className="text-sm text-text-secondary">Message (Optional)</label>
										<textarea
											value={bidMessage}
											onChange={e => setBidMessage(e.target.value)}
											maxLength={280}
											rows={3}
											disabled={isTransactionPending}
											placeholder="Add a message with your bid..."
											className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
										/>
										<div className="flex justify-between text-xs text-text-muted">
											<span>Maximum 280 characters</span>
											<span>{bidMessage.length}/280</span>
										</div>
									</div>

									{/* Submit Button */}
									{!isConnected ? (
										<div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
											<p className="text-sm text-text-secondary text-center">
												<AlertCircle className="inline mr-2" size={16} />
												Please connect your wallet to place a bid
											</p>
										</div>
									) : isTransactionPending ? (
										<Button size="lg" className="w-full" disabled>
											<Loader2 className="mr-2 animate-spin" size={20} />
											Processing Transaction...
										</Button>
									) : (
										<Button
											size="lg"
											className="w-full"
											onClick={bidType === 'ETH' ? handleEthBid : handleCstBid}
										>
											<Trophy className="mr-2" size={20} />
											Place {bidType} Bid
											{bidType === 'ETH' && ` (${discountedEthPrice.toFixed(6)} ETH)`}
											{bidType === 'CST' && ` (${cstBidPrice.toFixed(2)} CST)`}
										</Button>
									)}

									{/* Reward Info */}
									<div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
										<p className="text-sm text-text-secondary text-center">
											You'll earn{' '}
											<span className="text-status-success font-semibold">100 CST</span> tokens
											for placing this bid
										</p>
									</div>

									{/* Transaction Status */}
									{transactionHash && (
										<div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
											<p className="text-sm text-text-secondary">
												Transaction:{' '}
												<a
													href={`http://161.129.67.42:22945/tx/${transactionHash}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-primary hover:underline font-mono"
												>
													{transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
												</a>
											</p>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Current Round Info */}
							<Card glass>
								<CardHeader>
									<CardTitle>Current Round Status</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-xs text-text-secondary mb-1">Round Number</p>
											<p className="font-mono text-xl text-primary">{currentRound.roundNumber}</p>
										</div>
										<div>
											<p className="text-xs text-text-secondary mb-1">Total Bids</p>
											<p className="font-mono text-xl text-primary">{currentRound.totalBids}</p>
										</div>
										<div className="col-span-2">
											<p className="text-xs text-text-secondary mb-1">Last Bidder</p>
											<p className="font-mono text-sm text-text-primary break-all">
												{currentRound.lastBidder}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Right Column: Stats and Info */}
						<div className="space-y-6">
							{/* Price Stats */}
							<Card glass>
								<CardHeader>
									<CardTitle>Bid Prices</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
										<p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
											ETH Bid
										</p>
										<p className="font-mono text-2xl font-semibold text-primary">
											{ethBidPrice.toFixed(6)} ETH
										</p>
										{useRandomWalkNft && (
											<p className="text-xs text-status-success mt-1">
												w/ RandomWalk: {(ethBidPrice * 0.5).toFixed(6)} ETH
											</p>
										)}
									</div>
									<div className="p-4 rounded-lg bg-status-info/5 border border-status-info/10">
										<p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
											CST Bid
										</p>
										<p className="font-mono text-2xl font-semibold text-status-info">
											{cstBidPrice === 0 ? 'FREE' : `${cstBidPrice.toFixed(2)} CST`}
										</p>
									</div>
								</CardContent>
							</Card>

							{/* Prize Breakdown */}
							<Card glass>
								<CardHeader>
									<CardTitle>Prize Breakdown</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{[
										{
											label: 'Main Prize',
											value: `${(currentRound.prizePool * 0.25).toFixed(4)} ETH`,
											percentage: '25%'
										},
										{
											label: 'Chrono-Warrior',
											value: `${(currentRound.prizePool * 0.08).toFixed(4)} ETH`,
											percentage: '8%'
										},
										{
											label: 'Raffle (3 winners)',
											value: `${(currentRound.prizePool * 0.04).toFixed(4)} ETH`,
											percentage: '4%'
										},
										{
											label: 'Stakers',
											value: `${(currentRound.prizePool * 0.06).toFixed(4)} ETH`,
											percentage: '6%'
										},
										{
											label: 'Endurance (CST)',
											value: `${currentRound.totalBids * 10} CST`,
											percentage: ''
										}
									].map(prize => (
										<div key={prize.label} className="flex justify-between items-center text-sm">
											<span className="text-text-secondary">{prize.label}</span>
											<div className="text-right">
												<div className="font-mono text-primary font-semibold">
													{prize.value}
												</div>
												{prize.percentage && (
													<div className="text-xs text-text-muted">{prize.percentage}</div>
												)}
											</div>
										</div>
									))}
								</CardContent>
							</Card>

							{/* Help Card */}
							<Card glass className="bg-primary/5 border-primary/20">
								<CardContent className="p-4">
									<div className="flex items-start space-x-3">
										<AlertCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
										<div className="text-sm text-text-secondary">
											<p className="font-medium text-text-primary mb-1">New to the game?</p>
											<p>
												Read our{' '}
												<a href="/game/how-it-works" className="text-primary hover:underline">
													comprehensive guide
												</a>{' '}
												to understand bidding strategies and prize mechanics.
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</Container>
			</section>
		</div>
	);
}
