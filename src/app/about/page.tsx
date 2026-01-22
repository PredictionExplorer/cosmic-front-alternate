'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Github, Palette, Shield, Code } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
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
							About
							<span className="text-gradient block mt-2">Cosmic Signature</span>
						</h1>
						<p className="body-xl">
							A sophisticated blockchain auction game that combines strategic competition with premium
							generative art NFTs
						</p>
					</motion.div>
				</Container>
			</section>

			{/* The Concept */}
			<section className="section-padding">
				<Container size="lg">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						<motion.div
							initial={{ opacity: 0, x: -30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
						>
							<h2 className="heading-sm mb-6">The Concept</h2>
							<div className="space-y-4 text-text-secondary leading-relaxed">
								<p>
									Cosmic Signature represents a new paradigm in blockchain gaming - one that values
									strategic depth over mindless clicking, artistic merit over mass production, and
									transparent mechanics over hidden algorithms.
								</p>
								<p>
									Built on Arbitrum for efficient transactions, the game employs sophisticated smart
									contracts to create a provably fair competition where timing, strategy, and resource
									management determine success.
								</p>
								<p>
									Each round presents multiple pathways to victory. Whether you pursue the main prize
									as last bidder, dominate as Endurance Champion, master the timing for
									Chrono-Warrior, or simply participate for raffle chances - there&apos;s a strategy
									for every player.
								</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							className="space-y-6"
						>
							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
										<Shield size={24} className="text-primary" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Audited & Secure
										</h3>
										<p className="text-sm text-text-secondary">
											All smart contracts have been thoroughly audited by leading security firms.
											Code is open source and verifiable on-chain.
										</p>
									</div>
								</div>
							</Card>

							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-status-success/10 p-3">
										<Palette size={24} className="text-status-success" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Generative Art
										</h3>
										<p className="text-sm text-text-secondary">
											Every NFT is uniquely generated using a deterministic algorithm with
											verifiable on-chain seeds. No two are alike.
										</p>
									</div>
								</div>
							</Card>

							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-status-info/10 p-3">
										<Code size={24} className="text-status-info" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Open Source
										</h3>
										<p className="text-sm text-text-secondary">
											Complete transparency. All smart contract code, NFT generation scripts, and
											game mechanics are publicly available.
										</p>
									</div>
								</div>
							</Card>
						</motion.div>
					</div>
				</Container>
			</section>

			{/* The Art */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">The Art</h2>
						<p className="body-lg max-w-2xl mx-auto">Understanding Cosmic Signature NFT generation</p>
					</motion.div>

					<Card glass className="p-8 md:p-12">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
							<div className="space-y-6">
								<div>
									<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
										Generation Process
									</h3>
									<div className="space-y-4 text-text-secondary">
										<p className="leading-relaxed">
											Each Cosmic Signature NFT is created through a deterministic generative art
											algorithm stored on IPFS. The process is completely transparent and
											verifiable.
										</p>
										<div className="space-y-3">
											<div className="flex items-start space-x-3">
												<span className="flex-shrink-0 font-mono text-primary">1.</span>
												<p className="text-sm">
													When an NFT is minted, a unique seed is generated from blockchain
													data (block hashes, timestamps, Arbitrum entropy)
												</p>
											</div>
											<div className="flex items-start space-x-3">
												<span className="flex-shrink-0 font-mono text-primary">2.</span>
												<p className="text-sm">
													This seed is permanently stored on-chain and associated with the
													token ID
												</p>
											</div>
											<div className="flex items-start space-x-3">
												<span className="flex-shrink-0 font-mono text-primary">3.</span>
												<p className="text-sm">
													The generation script uses this seed to create a unique visual
													output (both image and video)
												</p>
											</div>
											<div className="flex items-start space-x-3">
												<span className="flex-shrink-0 font-mono text-primary">4.</span>
												<p className="text-sm">
													Anyone can verify the NFT by running the script with the same seed
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
									<p className="text-sm text-text-secondary">
										<strong className="text-text-primary">Provably Unique:</strong> The
										deterministic nature of the algorithm guarantees that each seed produces a
										completely unique visual output. No duplicates are possible.
									</p>
								</div>
							</div>

							<div className="space-y-6">
								<div>
									<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
										Technical Details
									</h3>
									<div className="space-y-4">
										<div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
											<p className="text-sm font-semibold text-text-primary mb-2">
												Entropy Sources
											</p>
											<ul className="space-y-1 text-xs text-text-secondary">
												<li>• Previous L2 block hash</li>
												<li>• Block base fee</li>
												<li>• Arbitrum L1 block hash</li>
												<li>• Gas backlog metrics</li>
												<li>• L1 pricing units</li>
											</ul>
										</div>

										<div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
											<p className="text-sm font-semibold text-text-primary mb-2">
												Output Formats
											</p>
											<ul className="space-y-1 text-xs text-text-secondary">
												<li>• Static image (high resolution)</li>
												<li>• Animated video loop</li>
												<li>• Metadata (JSON)</li>
											</ul>
										</div>

										<div className="p-4 rounded-lg bg-background-elevated border border-text-muted/10">
											<p className="text-sm font-semibold text-text-primary mb-2">
												Generation Script
											</p>
											<p className="text-xs text-text-secondary mb-3">
												The algorithm is written in Rust and permanently stored on IPFS for
												immutable access.
											</p>
											<Button size="sm" variant="outline" className="w-full">
												<ExternalLink size={14} className="mr-2" />
												View Script on IPFS
											</Button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</Card>
				</Container>
			</section>

			{/* Smart Contracts */}
			<section className="section-padding">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Smart Contracts</h2>
						<p className="body-lg max-w-2xl mx-auto">Transparent, audited, and open source</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{[
							{
								name: 'Cosmic Signature Game',
								description: 'Main game logic including bidding, prizes, and round management',
								address: '0x1234...5678'
							},
							{
								name: 'Cosmic Signature NFT',
								description: 'ERC-721 contract for game NFTs with custom metadata',
								address: '0x2345...6789'
							},
							{
								name: 'Cosmic Signature Token',
								description: 'ERC-20 token with voting, burning, and minting capabilities',
								address: '0x3456...7890'
							},
							{
								name: 'Prizes Wallet',
								description: 'Holds and distributes prizes, tokens, and donated NFTs',
								address: '0x4567...8901'
							},
							{
								name: 'Staking Wallets',
								description: 'Manages NFT staking and reward distribution',
								address: '0x5678...9012'
							},
							{
								name: 'Marketing & Charity',
								description: 'Distributes marketing rewards and charitable donations',
								address: '0x6789...0123'
							}
						].map((contract, index) => (
							<motion.div
								key={contract.name}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<Card glass hover className="p-6">
									<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
										{contract.name}
									</h3>
									<p className="text-sm text-text-secondary mb-4">{contract.description}</p>
									<div className="flex items-center justify-between">
										<code className="text-xs text-text-muted font-mono">{contract.address}</code>
										<a
											href={`https://arbiscan.io/address/${contract.address}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:text-primary/80 transition-colors"
										>
											<ExternalLink size={16} />
										</a>
									</div>
								</Card>
							</motion.div>
						))}
					</div>

					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{ delay: 0.6 }}
						className="mt-12 text-center"
					>
						<Button size="lg" variant="outline" asChild>
							<a href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main" target="_blank" rel="noopener noreferrer">
								<Github className="mr-2" size={20} />
								View Source Code on GitHub
							</a>
						</Button>
					</motion.div>
				</Container>
			</section>

			{/* Security & Audits */}
			<section className="section-padding bg-background-surface/50">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Security & Audits</h2>
						<p className="body-lg max-w-2xl mx-auto">Your safety is our priority</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								icon: Shield,
								title: 'Multiple Audits',
								description:
									'Comprehensive security audits conducted by industry-leading firms specializing in smart contract security.'
							},
							{
								icon: Code,
								title: 'Open Source',
								description:
									'All smart contract code is publicly available on GitHub for community review and verification.'
							},
							{
								icon: ExternalLink,
								title: 'On-Chain Verification',
								description:
									'Contract source code is verified on Arbiscan, allowing anyone to inspect the actual deployed bytecode.'
							}
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.1 }}
							>
								<Card glass className="p-6 text-center h-full">
									<div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-4 mb-4">
										<item.icon size={28} className="text-primary" />
									</div>
									<h3 className="font-serif text-lg font-semibold text-text-primary mb-3">
										{item.title}
									</h3>
									<p className="text-sm text-text-secondary leading-relaxed">{item.description}</p>
								</Card>
							</motion.div>
						))}
					</div>
				</Container>
			</section>

			{/* Key Features */}
			<section className="section-padding">
				<Container>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Why Cosmic Signature</h2>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{[
							{
								title: 'Strategic Depth',
								description:
									'Dutch auction mechanics create a game of timing and psychology. Early bids pay premium prices, late bids risk being outbid.'
							},
							{
								title: 'Multiple Prize Categories',
								description:
									'15+ winners per round across various categories: main prize, champions, raffles, and staking rewards.'
							},
							{
								title: 'Dual Token System',
								description:
									'Bid with ETH or earned CST tokens. Every bid generates CST rewards, creating a self-sustaining economy.'
							},
							{
								title: 'Provable Fairness',
								description:
									'All randomness generated on-chain using multiple entropy sources. Results are verifiable and cannot be manipulated.'
							},
							{
								title: 'Premium NFTs',
								description:
									'High-quality generative art with both static images and animated videos. Each piece is unique and verifiably scarce.'
							},
							{
								title: 'Passive Income',
								description:
									'Stake NFTs to earn ETH rewards from every round. Withdraw anytime with no lock periods or penalties.'
							},
							{
								title: 'Charitable Giving',
								description:
									'7% of every round goes to verified charitable causes. Play the game, help the world.'
							},
							{
								title: 'Community Governed',
								description:
									'CST token holders can vote on game parameters, ensuring the community shapes the future (DAO features coming soon).'
							}
						].map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.05 }}
							>
								<Card glass className="p-6 h-full">
									<h3 className="font-serif text-lg font-semibold text-text-primary mb-3">
										{feature.title}
									</h3>
									<p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
								</Card>
							</motion.div>
						))}
					</div>
				</Container>
			</section>

			{/* Contact/Community */}
			<section className="section-padding bg-background-surface/50">
				<Container size="md">
					<Card glass className="p-12 text-center">
						<h2 className="heading-sm mb-6">Join the Community</h2>
						<p className="body-lg mb-8">
							Connect with other players, get support, and stay updated on latest developments
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Button size="lg" variant="outline" asChild>
								<a href="https://discord.gg/bGnPn96Qwt" target="_blank" rel="noopener noreferrer">
									Join Discord
								</a>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<a href="https://x.com/CosmicSignatureNFT" target="_blank" rel="noopener noreferrer">
									Follow on Twitter
								</a>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<a href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main" target="_blank" rel="noopener noreferrer">
									<Github className="mr-2" size={20} />
									GitHub
								</a>
							</Button>
						</div>
					</Card>
				</Container>
			</section>
		</div>
	);
}
