'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { explorer } from '@/lib/web3/chains';
import { ExternalLink, Github, ArrowRight, Shield, Code, Palette, Heart } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
	return (
		<div className="min-h-screen">
			{/* Hero */}
			<section className="section-museum bg-background-surface/30">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center max-w-4xl mx-auto"
					>
						<p className="overline mb-6">About the Project</p>
						<h1 className="heading-exhibition text-balance mb-8">
							Physics as Artist.
							<span className="text-gradient block">Chaos as Beauty.</span>
						</h1>
						<p className="body-museum max-w-2xl mx-auto">
							Cosmic Signature is a generative art project that turns one of physics&apos; oldest
							unsolved problems into unique, verifiable digital artworks. No AI. No human hand.
							The Three Body Problem becomes the artist.
						</p>
					</motion.div>
				</Container>
			</section>

			<div className="divider-gold mx-auto max-w-md" />

			{/* The Vision */}
			<section className="section-museum">
				<Container size="lg">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
						<motion.div
							initial={{ opacity: 0, x: -30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
						>
							<h2 className="heading-sm mb-6">The Vision</h2>
							<div className="space-y-5 body-museum">
								<p>
									Cosmic Signature begins with a simple idea: what if the most beautiful art
									came not from a human hand or an AI model, but from the fundamental laws of physics?
								</p>
								<p>
									The Three Body Problem — three celestial masses orbiting under Newtonian gravity — produces
									trajectories that are simultaneously deterministic and utterly unpredictable. Small
									differences in starting conditions lead to wildly different paths. This &quot;deterministic
									chaos&quot; creates visual complexity that no algorithm could design and no artist
									could anticipate.
								</p>
								<p>
									Each artwork in the collection is born from this process. A single on-chain seed drives
									the entire generation pipeline: physics simulation, spectral rendering, and
									cinema-grade post-production. The result is a 16-bit image and 30-second video that
									are provably unique and permanently tied to their blockchain origin.
								</p>
							</div>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 30 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							className="space-y-5"
						>
							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-primary/8 p-3">
										<Palette size={22} className="text-primary" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Art from Physics
										</h3>
										<p className="text-sm text-text-secondary">
											Real gravitational simulation. 16 spectral wavelength bins.
											100,000 orbits evaluated per piece. The pipeline produces
											museum-quality output that rewards close inspection.
										</p>
									</div>
								</div>
							</Card>

							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-primary/8 p-3">
										<Shield size={22} className="text-primary" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Verifiable &amp; Transparent
										</h3>
										<p className="text-sm text-text-secondary">
											Every artwork is deterministic — same seed, same output, pixel for pixel.
											Open-source code under CC0. Audited smart contracts verified on-chain.
										</p>
									</div>
								</div>
							</Card>

							<Card glass className="p-6">
								<div className="flex items-start space-x-4">
									<div className="flex-shrink-0 rounded-lg bg-primary/8 p-3">
										<Heart size={22} className="text-primary" />
									</div>
									<div>
										<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
											Public Goods Funding
										</h3>
										<p className="text-sm text-text-secondary">
											7% of every round goes to Protocol Guild — the collective funding
											mechanism for 170+ Ethereum core protocol contributors.
											Art that builds the future.
										</p>
									</div>
								</div>
							</Card>
						</motion.div>
					</div>
				</Container>
			</section>

			{/* Philosophy */}
			<section className="section-padding bg-background-surface/30">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<p className="overline mb-4">Project Philosophy</p>
						<h2 className="heading-md mb-4">Built on Principles</h2>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
						{[
							{
								title: 'Zero Creator Extraction',
								description:
									'No team wallet receives ETH. All funds flow to players, stakers, and public goods. The project succeeds when its participants succeed.'
							},
							{
								title: 'Naturally Limited Supply',
								description:
									'The bidding timer grows exponentially. As rounds lengthen, new artworks become increasingly rare — scarcity emerges from mathematics, not artificial caps.'
							},
							{
								title: 'Complete Transparency',
								description:
									'All smart contract code, the NFT generation pipeline, and game mechanics are publicly available and open source under CC0.'
							},
							{
								title: 'Provable Fairness',
								description:
									'All randomness is generated on-chain using multiple entropy sources. Results are verifiable and cannot be manipulated by anyone.'
							},
							{
								title: 'Charitable Impact',
								description:
									'7% of every round is sent on-chain to Protocol Guild, funding the people building the infrastructure we all depend on.'
							},
							{
								title: 'Community Governance',
								description:
									'CST token holders can vote on game parameters through on-chain DAO governance, ensuring the community shapes the project\'s future.'
							}
						].map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
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

			<div className="divider-gold mx-auto max-w-md" />

			{/* The Technology */}
			<section className="section-museum">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<p className="overline mb-4">The Technology</p>
						<h2 className="heading-md mb-4">How the Art Is Created</h2>
						<p className="body-museum max-w-2xl mx-auto">
							A Rust-based pipeline simulates gravitational physics, renders in the spectral domain,
							and applies cinema-grade post-production — all deterministically from a single on-chain seed.
						</p>
					</motion.div>

					<div className="max-w-3xl mx-auto">
						<Card glass className="p-8 md:p-10">
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
								{[
									{ value: '100K', label: 'Orbits per piece' },
									{ value: '2M', label: 'Simulation steps' },
									{ value: '16', label: 'Spectral bins' },
									{ value: '60 fps', label: 'Video framerate' },
									{ value: '10-bit', label: 'Color depth (video)' },
									{ value: 'CC0', label: 'Open source license' },
								].map((stat) => (
									<div key={stat.label} className="text-center">
										<div className="font-mono text-xl font-semibold text-primary mb-1">{stat.value}</div>
										<div className="text-xs text-text-muted">{stat.label}</div>
									</div>
								))}
							</div>
							<div className="text-center">
								<Button variant="outline" asChild>
									<Link href="/the-art">
										Read the Full Technical Guide
										<ArrowRight className="ml-2" size={16} />
									</Link>
								</Button>
							</div>
						</Card>
					</div>
				</Container>
			</section>

			{/* Smart Contracts */}
			<section className="section-padding bg-background-surface/30">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Smart Contracts</h2>
						<p className="body-lg max-w-2xl mx-auto">Audited, transparent, and open source</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{[
							{
								name: 'Cosmic Signature Game',
								description: 'Main game logic — bidding, prizes, round management',
								address: '0x1234...5678'
							},
							{
								name: 'Cosmic Signature NFT',
								description: 'ERC-721 — unique artworks with on-chain seeds',
								address: '0x2345...6789'
							},
							{
								name: 'Cosmic Signature Token',
								description: 'ERC-20 — governance, bidding, and rewards',
								address: '0x3456...7890'
							},
							{
								name: 'Prizes Wallet',
								description: 'Prize distribution and donated NFT custody',
								address: '0x4567...8901'
							},
							{
								name: 'Staking Wallets',
								description: 'NFT staking and reward distribution',
								address: '0x5678...9012'
							},
							{
								name: 'Marketing & Charity',
								description: 'Marketing rewards and Protocol Guild distributions',
								address: '0x6789...0123'
							}
						].map((contract, index) => (
							<motion.div
								key={contract.name}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.05 }}
							>
								<Card glass hover className="p-6">
									<h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
										{contract.name}
									</h3>
									<p className="text-sm text-text-secondary mb-4">{contract.description}</p>
									<div className="flex items-center justify-between">
										<code className="text-xs text-text-muted font-mono">{contract.address}</code>
										<a
											href={explorer.address(contract.address)}
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

			{/* Security */}
			<section className="section-padding">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-12"
					>
						<h2 className="heading-md mb-4">Security &amp; Audits</h2>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								icon: Shield,
								title: 'Certora Verified',
								description:
									'Smart contracts have been formally verified by Certora — mathematical proof that the code behaves as specified.'
							},
							{
								icon: Code,
								title: 'Open Source',
								description:
									'All code is publicly available under CC0 on GitHub for community review and independent verification.'
							},
							{
								icon: ExternalLink,
								title: 'On-Chain Verification',
								description:
									'Contract source code is verified on Arbiscan. Anyone can inspect the actual deployed bytecode.'
							}
						].map((item, index) => (
							<motion.div
								key={item.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.08 }}
							>
								<Card glass className="p-6 text-center h-full">
									<div className="inline-flex items-center justify-center rounded-lg bg-primary/8 p-4 mb-4">
										<item.icon size={24} className="text-primary" />
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

			{/* Community CTA */}
			<section className="section-padding bg-background-surface/30">
				<Container size="md">
					<Card glass className="p-12 text-center">
						<h2 className="heading-sm mb-6">Join the Community</h2>
						<p className="body-museum mb-8 max-w-lg mx-auto">
							Connect with other collectors, follow the project&apos;s development,
							and stay informed about new rounds and artworks.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
							<Button size="lg" variant="outline" asChild>
								<a href="https://discord.gg/bGnPn96Qwt" target="_blank" rel="noopener noreferrer">
									Join Discord
								</a>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<a href="https://x.com/CosmicSignatureNFT" target="_blank" rel="noopener noreferrer">
									Follow on X
								</a>
							</Button>
							<Button size="lg" variant="outline" asChild>
								<a href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main" target="_blank" rel="noopener noreferrer">
									<Github className="mr-2" size={18} />
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
