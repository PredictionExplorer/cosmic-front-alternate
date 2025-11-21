'use client';

import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import {
	ChevronDown,
	Trophy,
	Timer,
	Coins,
	TrendingDown,
	Award,
	Sparkles,
	AlertCircle,
	CheckCircle2
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useApiData } from '@/contexts/ApiDataContext';
import { useCosmicGameRead } from '@/hooks/useCosmicGameContract';

export default function HowItWorksPage() {
	const { dashboardData } = useApiData();
	const { useCstRewardPerBid } = useCosmicGameRead();
	const { data: cstRewardPerBid } = useCstRewardPerBid();
	
	const cstRewardAmount = cstRewardPerBid ? Number(cstRewardPerBid) / 1e18 : 0;
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
						<h1 className="heading-xl text-balance mb-6">
							How to Win
							<span className="text-gradient block mt-2">Cosmic Signature</span>
						</h1>
						<p className="body-xl">
							Master the mechanics of this sophisticated blockchain auction game. Strategic timing and
							understanding the prize structure are keys to success.
						</p>
					</motion.div>
				</Container>
			</section>

			{/* The Basics */}
			<section className="section-padding">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">The Basics</h2>
						<p className="body-lg max-w-2xl mx-auto">A simple concept with sophisticated depth</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								icon: Trophy,
								title: 'Be Last Bidder',
								description:
									'Place a bid to become the last bidder. If you remain the last bidder when the countdown timer reaches zero, you win the main prize.'
							},
							{
								icon: Timer,
								title: 'Timer Extends',
								description:
									'Each bid extends the countdown timer by approximately 1 hour (grows slightly each round). This creates dynamic competition.'
							},
							{
								icon: Sparkles,
								title: 'Multiple Prizes',
								description:
									"Even if you don't win the main prize, you can win as Endurance Champion, Chrono-Warrior, or through random raffles."
							}
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<Card glass className="p-8 text-center h-full">
									<div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-4 mb-4">
										<item.icon size={32} className="text-primary" />
									</div>
									<h3 className="font-serif text-xl font-semibold text-text-primary mb-3">
										{item.title}
									</h3>
									<p className="text-text-secondary leading-relaxed">{item.description}</p>
								</Card>
							</motion.div>
						))}
					</div>
				</Container>
			</section>

			{/* Bidding Mechanics */}
			<section className="section-padding bg-background-surface/50">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Bidding Mechanics</h2>
						<p className="body-lg max-w-2xl mx-auto">Understanding price dynamics and bid types</p>
					</motion.div>

					<Accordion.Root type="single" collapsible className="space-y-4">
						{/* ETH Bidding */}
						<Accordion.Item value="eth-bidding">
							<Card glass>
								<Accordion.Trigger className="w-full p-6 flex items-center justify-between hover:bg-background-elevated/50 transition-colors group">
									<div className="flex items-center space-x-4">
										<div className="flex items-center justify-center rounded-lg bg-primary/10 p-3">
											<Coins size={24} className="text-primary" />
										</div>
										<div className="text-left">
											<h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
												ETH Bidding
											</h3>
											<p className="text-sm text-text-secondary">
												Bid with Ethereum (the primary bidding method)
											</p>
										</div>
									</div>
									<ChevronDown className="text-text-secondary group-data-[state=open]:rotate-180 transition-transform" />
								</Accordion.Trigger>
								<Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
									<div className="p-6 pt-0 space-y-4 text-text-secondary">
										<p className="leading-relaxed">
											ETH bidding is the primary way to participate in Cosmic Signature.
											Here&apos;s how it works:
										</p>

										<div className="space-y-3">
											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														First Bid of Round
													</p>
													<p className="text-sm">
													The very first bid of each round MUST be an ETH bid. This
													activates the round and sets the initial countdown timer. The
													first bid price starts at a low baseline.
													</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Price Increases After Each Bid
													</p>
													<p className="text-sm">
														After someone places an ETH bid, the next ETH bid price
														increases by approximately 1%. This formula ensures prices
														gradually rise as competition intensifies.
													</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Dutch Auction at Round Start
													</p>
													<p className="text-sm">
														When a new round starts (before the first bid), ETH prices
														decrease over time from a high starting point. This Dutch
														auction lasts approximately 2 days, encouraging strategic
														timing.
													</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Exact Payment Required
													</p>
													<p className="text-sm">
														You must send the exact ETH amount or slightly more. Small
														overpayments are kept by the contract (cheaper than refunding
														gas). Large overpayments are refunded automatically.
													</p>
												</div>
											</div>
										</div>

										<div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-4">
											<p className="text-sm">
												<strong className="text-text-primary">Pro Tip:</strong> Check the
												current price immediately before bidding, as prices change with each
												bid. The price you see might increase if someone bids before your
												transaction confirms.
											</p>
										</div>
									</div>
								</Accordion.Content>
							</Card>
						</Accordion.Item>

						{/* CST Bidding */}
						<Accordion.Item value="cst-bidding">
							<Card glass>
								<Accordion.Trigger className="w-full p-6 flex items-center justify-between hover:bg-background-elevated/50 transition-colors group">
									<div className="flex items-center space-x-4">
										<div className="flex items-center justify-center rounded-lg bg-status-success/10 p-3">
											<TrendingDown size={24} className="text-status-success" />
										</div>
										<div className="text-left">
											<h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
												CST Token Bidding
											</h3>
											<p className="text-sm text-text-secondary">
												Bid with earned CST tokens (alternative bidding method)
											</p>
										</div>
									</div>
									<ChevronDown className="text-text-secondary group-data-[state=open]:rotate-180 transition-transform" />
								</Accordion.Trigger>
								<Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
									<div className="p-6 pt-0 space-y-4 text-text-secondary">
										<p className="leading-relaxed">
											CST (Cosmic Signature Token) bidding offers an alternative way to compete
											using tokens you&apos;ve earned from previous bids:
										</p>

										<div className="space-y-3">
											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Earn CST from Every Bid
													</p>
												<p className="text-sm">
													Every bid you place (ETH or CST) earns you{' '}
													{cstRewardAmount} CST tokens as a reward.
													These tokens accumulate in your wallet for future use.
												</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														CST Bids Burn Tokens
													</p>
												<p className="text-sm">
													When you bid with CST, those tokens are permanently burned
													(destroyed). However, you still receive the{' '}
													{cstRewardAmount} CST reward, so if the bid
													price is below {cstRewardAmount} CST, you
													profit.
												</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Dutch Auction Pricing
													</p>
													<p className="text-sm">
														After each CST bid, a new Dutch auction begins. The price starts
														high and decreases linearly to 0 over approximately 12 hours.
														Strategic players wait for lower prices.
													</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Cannot Be First Bid
													</p>
													<p className="text-sm">
														CST bids cannot be the first bid of a round. At least one ETH
														bid must be placed first to activate the round.
													</p>
												</div>
											</div>
										</div>

										<div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/20 mt-4">
											<div className="flex items-start space-x-2">
												<AlertCircle
													size={16}
													className="text-status-warning mt-0.5 flex-shrink-0"
												/>
												<p className="text-sm">
													<strong className="text-text-primary">Important:</strong> Use
													slippage protection by setting a maximum price. The Dutch auction
													price changes rapidly, and you don&apos;t want to pay more than
													intended.
												</p>
											</div>
										</div>
									</div>
								</Accordion.Content>
							</Card>
						</Accordion.Item>

						{/* Random Walk NFT Discount */}
						<Accordion.Item value="random-walk">
							<Card glass>
								<Accordion.Trigger className="w-full p-6 flex items-center justify-between hover:bg-background-elevated/50 transition-colors group">
									<div className="flex items-center space-x-4">
										<div className="flex items-center justify-center rounded-lg bg-status-info/10 p-3">
											<Sparkles size={24} className="text-status-info" />
										</div>
										<div className="text-left">
											<h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
												Random Walk NFT Discount
											</h3>
											<p className="text-sm text-text-secondary">
												Get 50% off ETH bids by using a Random Walk NFT
											</p>
										</div>
									</div>
									<ChevronDown className="text-text-secondary group-data-[state=open]:rotate-180 transition-transform" />
								</Accordion.Trigger>
								<Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
									<div className="p-6 pt-0 space-y-4 text-text-secondary">
										<p className="leading-relaxed">
											Random Walk NFTs are a separate NFT collection that provides a special
											benefit in Cosmic Signature:
										</p>

										<div className="space-y-3">
											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														50% Discount on ETH Bids
													</p>
													<p className="text-sm">
														When you bid with ETH and include a Random Walk NFT, you pay
														only 50% of the normal ETH bid price. This can result in
														significant savings on expensive bids.
													</p>
												</div>
											</div>

											<div className="flex items-start space-x-3">
												<CheckCircle2
													size={16}
													className="text-status-success mt-1 flex-shrink-0"
												/>
												<div>
													<p className="text-text-primary font-medium mb-1">
														Must Own the NFT
													</p>
													<p className="text-sm">
														You must be the owner of the Random Walk NFT to use it for
														bidding. The contract verifies ownership on-chain.
													</p>
												</div>
											</div>
										</div>

										<div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20 mt-4">
											<div className="flex items-start space-x-2">
												<AlertCircle
													size={16}
													className="text-status-error mt-0.5 flex-shrink-0"
												/>
												<p className="text-sm">
													<strong className="text-text-primary">Permanent Action:</strong>{' '}
													Each Random Walk NFT can only be used ONCE, ever. After using it for
													bidding, it cannot be used again. This action is permanent and
													irreversible. Choose wisely!
												</p>
											</div>
										</div>
									</div>
								</Accordion.Content>
							</Card>
						</Accordion.Item>

						{/* Dutch Auctions */}
						<Accordion.Item value="dutch-auction">
							<Card glass>
								<Accordion.Trigger className="w-full p-6 flex items-center justify-between hover:bg-background-elevated/50 transition-colors group">
									<div className="flex items-center space-x-4">
										<div className="flex items-center justify-center rounded-lg bg-status-warning/10 p-3">
											<TrendingDown size={24} className="text-status-warning" />
										</div>
										<div className="text-left">
											<h3 className="font-serif text-xl font-semibold text-text-primary mb-1">
												Dutch Auction Pricing
											</h3>
											<p className="text-sm text-text-secondary">
												Prices decrease over time (strategic timing matters)
											</p>
										</div>
									</div>
									<ChevronDown className="text-text-secondary group-data-[state=open]:rotate-180 transition-transform" />
								</Accordion.Trigger>
								<Accordion.Content className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up overflow-hidden">
									<div className="p-6 pt-0 space-y-4 text-text-secondary">
										<p className="leading-relaxed">
											Both ETH and CST use Dutch auction mechanics, but they work differently:
										</p>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
												<h4 className="text-text-primary font-semibold mb-2">
													ETH Dutch Auction
												</h4>
												<ul className="space-y-2 text-sm">
													<li>• Occurs when round starts (before first bid)</li>
													<li>• Lasts approximately 2 days</li>
													<li>• Starts at 2x previous round&apos;s ending price</li>
													<li>• Decreases to a minimum price</li>
													<li>• After first bid: prices increase per bid</li>
												</ul>
											</div>

											<div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
												<h4 className="text-text-primary font-semibold mb-2">
													CST Dutch Auction
												</h4>
												<ul className="space-y-2 text-sm">
													<li>• Occurs after each CST bid</li>
													<li>• Lasts approximately 12 hours</li>
													<li>• Starts at 2x previous CST bid</li>
													<li>• Decreases linearly to 0</li>
													<li>• Can reach exactly 0 (free bids possible!)</li>
												</ul>
											</div>
										</div>

										<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
											<p className="text-sm">
												<strong className="text-text-primary">Strategy:</strong> In Dutch
												auctions, waiting longer gets you better prices, but someone else might
												bid before you. This creates a psychological game of chicken.
											</p>
										</div>
									</div>
								</Accordion.Content>
							</Card>
						</Accordion.Item>
					</Accordion.Root>
				</Container>
			</section>

			{/* Championship Paths */}
			<section className="section-padding">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Championship Paths</h2>
						<p className="body-lg max-w-2xl mx-auto">Multiple ways to achieve victory</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Endurance Champion */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 }}
						>
							<Card glass className="p-8 h-full">
								<div className="flex items-center space-x-3 mb-4">
									<Award size={28} className="text-primary" />
									<h3 className="font-serif text-2xl font-semibold text-text-primary">
										Endurance Champion
									</h3>
								</div>
								<p className="text-text-secondary leading-relaxed mb-6">
									The player who held the &quot;last bidder&quot; position for the longest single
									continuous duration during the round.
								</p>

								<div className="space-y-4">
									<div>
										<p className="text-sm text-text-secondary mb-2">How It Works:</p>
										<ul className="space-y-2 text-sm text-text-secondary">
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Timer starts when you become last bidder</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Stops when someone outbids you</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Only your longest single period counts</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Bidding multiple times in a row doesn&apos;t add durations</span>
											</li>
										</ul>
									</div>

									<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
										<p className="text-sm font-semibold text-text-primary mb-2">Prize:</p>
										<ul className="space-y-1 text-sm text-text-secondary">
											<li>• 10x CST per bid in round</li>
											<li>• 1 Cosmic Signature NFT</li>
										</ul>
									</div>
								</div>
							</Card>
						</motion.div>

						{/* Chrono-Warrior */}
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.2 }}
						>
							<Card glass className="p-8 h-full">
								<div className="flex items-center space-x-3 mb-4">
									<Timer size={28} className="text-status-info" />
									<h3 className="font-serif text-2xl font-semibold text-text-primary">
										Chrono-Warrior
									</h3>
								</div>
								<p className="text-text-secondary leading-relaxed mb-6">
									The player who held the &quot;Endurance Champion&quot; title for the longest
									continuous duration during the round. Champion of champions.
								</p>

								<div className="space-y-4">
									<div>
										<p className="text-sm text-text-secondary mb-2">How It Works:</p>
										<ul className="space-y-2 text-sm text-text-secondary">
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>You must first become Endurance Champion</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Timer tracks how long you hold that title</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>If someone overtakes you, your duration is recorded</span>
											</li>
											<li className="flex items-start">
												<span className="mr-2">•</span>
												<span>Longest duration wins (very hard to achieve)</span>
											</li>
										</ul>
									</div>

									<div className="p-4 rounded-lg bg-status-info/5 border border-status-info/20">
										<p className="text-sm font-semibold text-text-primary mb-2">Prize:</p>
										<ul className="space-y-1 text-sm text-text-secondary">
											<li>• {dashboardData?.ChronoWarriorPercentage || '--'}% of prize pool in ETH</li>
											<li>• Transferred to Prizes Wallet (withdraw later)</li>
										</ul>
									</div>
								</div>
							</Card>
						</motion.div>
					</div>
				</Container>
			</section>

			{/* Prize Distribution Visual */}
			<section className="section-padding bg-background-surface/50">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Complete Prize Distribution</h2>
						<p className="body-lg max-w-2xl mx-auto">
							When a round ends, prizes are distributed across multiple categories
						</p>
					</motion.div>

					<Card glass className="p-8 md:p-12">
						<div className="space-y-6">
							{[
								{
									name: 'Main Prize Winner',
									percentage: 25,
									recipients: 1,
									rewards: ['25% of ETH pool', '1 Cosmic Signature NFT'],
									color: 'primary'
								},
								{
									name: 'Endurance Champion',
									percentage: 0,
									recipients: 1,
									rewards: ['Total Bids × 10 CST', '1 Cosmic Signature NFT'],
									color: 'accent'
								},
								{
									name: 'Last CST Bidder',
									percentage: 0,
									recipients: 1,
									rewards: ['Total Bids × 10 CST', '1 Cosmic Signature NFT'],
									color: 'success',
									note: 'Only if CST bids were placed'
								},
								{
									name: 'Chrono-Warrior',
									percentage: 8,
									recipients: 1,
									rewards: ['8% of ETH pool'],
									color: 'info'
								},
								{
									name: 'Raffle - ETH Prizes',
									percentage: 4,
									recipients: 3,
									rewards: ['4% of ETH split among 3 random bidders'],
									color: 'warning'
								},
								{
									name: 'Raffle - NFT Prizes',
									percentage: 0,
									recipients: 9,
									rewards: [
										'5 Cosmic Signature NFTs to random bidders',
										'4 Cosmic Signature NFTs to random RW NFT stakers'
									],
									color: 'warning'
								},
								{
									name: 'NFT Stakers',
									percentage: 6,
									recipients: 'All',
									rewards: ['6% of ETH distributed proportionally'],
									color: 'success'
								},
								{
									name: 'Charity',
									percentage: 7,
									recipients: 1,
									rewards: ['7% of ETH to charitable causes'],
									color: 'error'
								}
							].map((prize, index) => (
								<motion.div
									key={prize.name}
									initial={{ opacity: 0, x: -20 }}
									whileInView={{ opacity: 1, x: 0 }}
									viewport={{ once: true }}
									transition={{ delay: index * 0.05 }}
									className="flex items-start justify-between p-4 rounded-lg bg-background-elevated/50 border border-text-muted/10"
								>
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-2">
											<h4 className="font-serif text-lg font-semibold text-text-primary">
												{prize.name}
											</h4>
											{prize.percentage > 0 && (
												<Badge variant="default">{prize.percentage}%</Badge>
											)}
											{prize.recipients !== 'All' && (
												<Badge variant="outline">
													{prize.recipients}{' '}
													{typeof prize.recipients === 'number' && prize.recipients > 1
														? 'Winners'
														: 'Winner'}
												</Badge>
											)}
										</div>
										<ul className="space-y-1 text-sm text-text-secondary">
											{prize.rewards.map(reward => (
												<li key={reward}>• {reward}</li>
											))}
										</ul>
										{prize.note && (
											<p className="text-xs text-text-muted mt-2 italic">{prize.note}</p>
										)}
									</div>
								</motion.div>
							))}
						</div>

						<div className="mt-8 p-6 rounded-lg bg-primary/5 border border-primary/20">
							<p className="text-center text-text-secondary">
								<strong className="text-text-primary">Important:</strong> Approximately 50% of the prize
								pool rolls over to the next round, ensuring growing prizes over time.
							</p>
						</div>
					</Card>
				</Container>
			</section>

			{/* Quick Tips */}
			<section className="section-padding">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Pro Strategies</h2>
						<p className="body-lg max-w-2xl mx-auto">Tips from experienced players</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{[
							{
								title: 'Timing is Everything',
								tips: [
									'Dutch auctions reward patience - prices decrease over time',
									'But waiting too long means others might outbid you',
									'Monitor the auction progress bar closely',
									'Consider gas fees when deciding bid timing'
								]
							},
							{
								title: 'CST Token Strategy',
								tips: [
									'Every bid earns you 100 CST tokens',
									'Wait for CST price to drop below 100 for profitable bids',
									'Use slippage protection to avoid overpaying',
									'CST bids are burned, so manage your token balance'
								]
							},
							{
								title: 'Random Walk NFTs',
								tips: [
									'Only use on high-value bids (50% savings)',
									'Each NFT is permanently consumed when used',
									'Cannot be used for staking after bidding',
									'Plan carefully - this decision is irreversible'
								]
							},
							{
								title: 'Multiple Prize Paths',
								tips: [
									"Don't just chase main prize - other prizes are valuable",
									'Endurance Champion requires holding position longest',
									'Raffle prizes are random - every bid increases odds',
									'Stake NFTs for passive income between rounds'
								]
							}
						].map((section, index) => (
							<motion.div
								key={section.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<Card glass className="p-6 h-full">
									<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
										{section.title}
									</h3>
									<ul className="space-y-3">
										{section.tips.map(tip => (
											<li
												key={tip}
												className="flex items-start space-x-2 text-sm text-text-secondary"
											>
												<span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-primary mt-2" />
												<span className="leading-relaxed">{tip}</span>
											</li>
										))}
									</ul>
								</Card>
							</motion.div>
						))}
					</div>
				</Container>
			</section>
		</div>
	);
}
