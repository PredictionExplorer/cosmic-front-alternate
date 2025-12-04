'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { formatEth } from '@/lib/utils';
import { useApiData } from '@/contexts/ApiDataContext';
import { useMemo } from 'react';

export default function PrizesPage() {
	const { dashboardData } = useApiData();

	// Build prize types with API data
	const prizeTypes = useMemo(() => {
		return [
			{
				name: "Main Prize",
				percentage: dashboardData?.PrizePercentage || 0,
				description: "Last bidder when timer expires",
				rewards: [`${dashboardData?.PrizePercentage || 0}% of ETH pool`, "1 Cosmic Signature NFT"],
				color: "primary",
			},
			{
				name: "Endurance Champion",
				percentage: 0,
				description: "Longest single duration as last bidder",
				rewards: [
					`10x CST per bid`,
					"1 Cosmic Signature NFT",
				],
				color: "accent",
			},
			{
				name: "Chrono-Warrior",
				percentage: dashboardData?.ChronoWarriorPercentage || 0,
				description: "Longest duration as Endurance Champion",
				rewards: [`${dashboardData?.ChronoWarriorPercentage || 0}% of ETH pool`],
				color: "info",
			},
			{
				name: "Raffle Winners",
				percentage: dashboardData?.RafflePercentage || 0,
				description: "Random selection among all bidders",
				rewards: [
					`${dashboardData?.RafflePercentage || 0}% of ETH split among ${dashboardData?.NumRaffleEthWinnersBidding || 0} winners`,
					`${dashboardData?.NumRaffleNFTWinnersBidding || 0} Cosmic Signature NFTs to bidders`,
					`${dashboardData?.NumRaffleNFTWinnersStakingRWalk || 0} Cosmic Signature NFTs to stakers`,
				],
				color: "warning",
			},
			{
				name: "NFT Stakers",
				percentage: dashboardData?.StakignPercentage || 0,
				description: "Distributed to all staked NFTs",
				rewards: [`${dashboardData?.StakignPercentage || 0}% of ETH pool (proportional)`],
				color: "success",
			},
			{
				name: "Charity",
				percentage: dashboardData?.CharityPercentage || 0,
				description: "Supporting charitable causes",
				rewards: [`${dashboardData?.CharityPercentage || 0}% of ETH pool`],
				color: "error",
			},
		];
	}, [dashboardData]);

	const totalPercentage = prizeTypes.reduce((sum, p) => sum + p.percentage, 0);
	const remainingPercentage = 100 - totalPercentage;

	return (
		<div className="min-h-screen">
			{/* Hero */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-center max-w-4xl mx-auto"
					>
						<h1 className="heading-xl text-balance mb-6">Prize Structure</h1>
						<p className="body-xl">
							Transparent, fair distribution across multiple winner categories. Every round creates 15+
							opportunities to win.
						</p>
					</motion.div>
				</Container>
			</section>

			{/* Visual Flow Diagram */}
			<section className="section-padding">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mb-12"
					>
						<Card glass className="p-8 md:p-12">
							<h2 className="font-serif text-2xl font-semibold text-text-primary text-center mb-8">
								Prize Pool Distribution Flow
							</h2>

							{/* Flow Visualization */}
							<div className="space-y-3">
								{/* Contract Balance */}
								<div className="p-6 rounded-lg bg-gradient-gold text-background text-center">
									<p className="text-sm font-semibold mb-1">Contract Balance</p>
									<p className="font-mono text-3xl font-bold">
										{formatEth(dashboardData?.PrizeAmountEth || 0)} ETH
									</p>
								</div>

							{/* Distribution Arrows */}
							{prizeTypes.filter(p => p.percentage > 0).map((prize, index) => (
									<motion.div
										key={prize.name}
										initial={{ opacity: 0, x: -20 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ delay: index * 0.1 }}
										className="flex items-center space-x-4"
									>
										{/* Arrow */}
										<div className="flex-shrink-0 w-12 text-center">
											<div className="inline-block text-primary text-2xl">↓</div>
										</div>

										{/* Prize Card */}
										<div className="flex-1 p-4 rounded-lg bg-background-elevated border border-text-muted/10">
											<div className="flex items-center justify-between mb-2">
												<h3 className="font-serif text-lg font-semibold text-text-primary">
													{prize.name}
												</h3>
													<div className="text-right">
														<div className="font-mono text-xl font-semibold text-primary">
															{formatEth(
																(dashboardData?.PrizeAmountEth || 0) * (prize.percentage / 100)
															)}{' '}
															ETH
														</div>
														<div className="text-xs text-text-secondary">
															{prize.percentage}% of pool
														</div>
													</div>
											</div>
											<p className="text-sm text-text-secondary mb-2">{prize.description}</p>
											<div className="flex flex-wrap gap-2">
												{prize.rewards.map(reward => (
													<span
														key={reward}
														className="text-xs px-2 py-1 rounded bg-background/50 text-text-muted"
													>
														{reward}
													</span>
												))}
											</div>
										</div>
									</motion.div>
								))}

								{/* Remaining Amount */}
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ delay: 0.5 }}
									className="flex items-center space-x-4"
								>
									<div className="flex-shrink-0 w-12 text-center">
										<div className="inline-block text-primary text-2xl">↓</div>
									</div>

									<div className="flex-1 p-4 rounded-lg bg-background-elevated border border-primary/20">
										<div className="flex items-center justify-between">
											<h3 className="font-serif text-lg font-semibold text-text-primary">
												Next Round Pool
											</h3>
											<div className="text-right">
												<div className="font-mono text-xl font-semibold text-primary">
													{formatEth(
														(dashboardData?.PrizeAmountEth || 0) * (remainingPercentage / 100)
													)}{' '}
													ETH
												</div>
												<div className="text-xs text-text-secondary">
													~{remainingPercentage}% rolls over
												</div>
											</div>
										</div>
										<p className="text-sm text-text-secondary mt-2">
											Remaining funds roll over to ensure growing prize pools over time
										</p>
									</div>
								</motion.div>
							</div>
						</Card>
					</motion.div>
				</Container>
			</section>

			{/* Detailed Prize Explanations */}
			<section className="section-padding">
				<Container>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{prizeTypes.map((prize, index) => (
							<motion.div
								key={prize.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<Card glass hover className="p-6 h-full">
									<div className="mb-4">
										{prize.percentage > 0 && (
											<div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 mb-3">
												<span className="font-mono text-sm font-semibold text-primary">
													{prize.percentage}%
												</span>
											</div>
										)}
										<h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
											{prize.name}
										</h3>
										<p className="text-sm text-text-secondary mb-4">{prize.description}</p>
									</div>

									<div className="space-y-2">
										<p className="text-xs text-text-muted uppercase tracking-wide mb-2">Rewards</p>
										{prize.rewards.map(reward => (
											<div
												key={reward}
												className="flex items-start space-x-2 text-sm text-text-secondary"
											>
												<span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
												<span>{reward}</span>
											</div>
										))}
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</Container>
			</section>

			{/* How to Claim */}
			<section className="section-padding bg-background-surface/50">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">How to Claim Prizes</h2>
						<p className="body-lg max-w-2xl mx-auto">
							Different prize types have different claiming procedures
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<Card glass className="p-8">
							<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">Main Prize</h3>
							<div className="space-y-4 text-sm text-text-secondary">
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">1.</span>
									<p>
										Wait for the countdown timer to reach zero (only works if you&apos;re the last
										bidder)
									</p>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">2.</span>
									<p>Call the &quot;Claim Main Prize&quot; function on the smart contract</p>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">3.</span>
									<p>Receive ETH directly + Cosmic Signature NFT automatically</p>
								</div>
								<div className="p-3 rounded bg-status-warning/10 border border-status-warning/20 mt-4">
									<p className="text-xs">
										⚠️ You have 1 day to claim. After that, anyone can claim and receive your prize.
									</p>
								</div>
							</div>
						</Card>

						<Card glass className="p-8">
							<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
								Secondary Prizes
							</h3>
							<div className="space-y-4 text-sm text-text-secondary">
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">1.</span>
									<p>Secondary prizes (Chrono-Warrior, Raffle ETH) are sent to the Prizes Wallet</p>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">2.</span>
									<p>Visit your profile to see available prizes</p>
								</div>
								<div className="flex items-start space-x-3">
									<span className="flex-shrink-0 font-mono text-primary">3.</span>
									<p>Withdraw your ETH balance when convenient</p>
								</div>
								<div className="p-3 rounded bg-status-success/10 border border-status-success/20 mt-4">
									<p className="text-xs">✓ NFT prizes are automatically sent to your wallet</p>
								</div>
							</div>
						</Card>
					</div>
				</Container>
			</section>
		</div>
	);
}
