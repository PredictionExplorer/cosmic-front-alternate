'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Trophy, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/features/Breadcrumbs';
import { AddressDisplay } from '@/components/features/AddressDisplay';
import { MOCK_ROUNDS, getRounds } from '@/lib/mockData/rounds';
import { formatEth, formatDate, formatDuration } from '@/lib/utils';

export default function RoundsArchivePage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(0);
	const perPage = 20;

	const rounds = getRounds(page * perPage, perPage);

	const filteredRounds = rounds.filter(round => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			round.roundNum.toString().includes(q) ||
			round.winner.toLowerCase().includes(q) ||
			round.winnerENS?.toLowerCase().includes(q)
		);
	});

	return (
		<div className="min-h-screen">
			{/* Hero */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<Breadcrumbs
						items={[{ label: 'Game', href: '/game/play' }, { label: 'History' }, { label: 'Rounds' }]}
						className="mb-8"
					/>

					<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
						<h1 className="heading-xl mb-4">Round Archive</h1>
						<p className="body-lg">
							Explore all {MOCK_ROUNDS.length} completed rounds • Total prizes: ~
							{Math.floor(MOCK_ROUNDS.length * 12.5)} ETH distributed
						</p>
					</motion.div>
				</Container>
			</section>

			{/* Search */}
			<section className="py-6 sticky top-[72px] lg:top-[88px] z-40 bg-background/95 backdrop-blur-xl border-b border-text-muted/10">
				<Container>
					<div className="relative max-w-xl">
						<Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
						<input
							type="text"
							placeholder="Search by round number or winner address..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 rounded-lg bg-background-surface border border-text-muted/10 text-text-primary placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
						/>
					</div>
				</Container>
			</section>

			{/* Rounds Grid */}
			<section className="section-padding">
				<Container>
					{filteredRounds.length === 0 ? (
						<Card glass className="p-12 text-center">
							<p className="text-text-secondary">No rounds found matching your search.</p>
						</Card>
					) : (
						<>
							<div className="mb-6 text-sm text-text-secondary">
								Showing {filteredRounds.length} round{filteredRounds.length !== 1 ? 's' : ''}
							</div>

							<div className="space-y-6">
								{filteredRounds.map((round, index) => (
									<motion.div
										key={round.roundNum}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: Math.min(index * 0.05, 0.3) }}
									>
										<Link href={`/game/history/rounds/${round.roundNum}`}>
											<Card glass hover className="p-8">
												<div className="flex items-start justify-between flex-wrap gap-6">
													{/* Main Info */}
													<div className="flex-1">
														<div className="flex items-center space-x-4 mb-4">
															<Badge variant="default" className="text-base px-4 py-1.5">
																Round {round.roundNum}
															</Badge>
															<span className="text-sm text-text-muted">
																{formatDate(new Date(round.claimedAt * 1000))}
															</span>
														</div>

														<div className="space-y-3">
															<div className="flex items-center space-x-3">
																<Trophy size={18} className="text-primary" />
																<span className="text-text-secondary text-sm">
																	Winner:
																</span>
																<AddressDisplay
																	address={round.winner}
																	showCopy={false}
																	showLink={false}
																/>
															</div>

															<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
																<div className="flex items-center space-x-2">
																	<Users size={16} className="text-text-muted" />
																	<span className="text-sm text-text-secondary">
																		{round.totalBids} bids
																	</span>
																</div>
																<div className="flex items-center space-x-2">
																	<Clock size={16} className="text-text-muted" />
																	<span className="text-sm text-text-secondary">
																		{formatDuration(round.duration * 1000)}
																	</span>
																</div>
																<div className="flex items-center space-x-2">
																	<Trophy size={16} className="text-text-muted" />
																	<span className="text-sm text-text-secondary">
																		{round.numRaffleETHWinners +
																			round.numRaffleNFTWinners +
																			3}{' '}
																		winners
																	</span>
																</div>
															</div>
														</div>
													</div>

													{/* Prize Amount */}
													<div className="text-right">
														<p className="text-xs text-text-secondary mb-1 uppercase tracking-wide">
															Main Prize
														</p>
														<p className="font-mono text-3xl font-bold text-primary mb-1">
															{formatEth(round.mainPrizeAmount)}
														</p>
														<p className="text-xs text-text-muted">ETH</p>

														<div className="mt-4 pt-4 border-t border-text-muted/10">
															<p className="text-xs text-text-secondary">Total Pool</p>
															<p className="font-mono text-lg text-text-primary">
																{formatEth(round.ethCollected)} ETH
															</p>
														</div>
													</div>
												</div>

												{/* Champions Preview */}
												<div className="mt-6 pt-6 border-t border-text-muted/10 grid grid-cols-1 md:grid-cols-2 gap-4">
													<div className="p-3 rounded-lg bg-background-elevated/50">
														<p className="text-xs text-text-secondary mb-1">
															Endurance Champion
														</p>
														<AddressDisplay
															address={round.enduranceChampion}
															showCopy={false}
															showLink={false}
															className="text-sm"
														/>
													</div>
													<div className="p-3 rounded-lg bg-background-elevated/50">
														<p className="text-xs text-text-secondary mb-1">
															Chrono-Warrior
														</p>
														<AddressDisplay
															address={round.chronoWarrior}
															showCopy={false}
															showLink={false}
															className="text-sm"
														/>
													</div>
												</div>
											</Card>
										</Link>
									</motion.div>
								))}
							</div>

							{/* Pagination */}
							{MOCK_ROUNDS.length > perPage && (
								<div className="mt-12 flex justify-center space-x-2">
									<button
										onClick={() => setPage(Math.max(0, page - 1))}
										disabled={page === 0}
										className="px-6 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Previous
									</button>
									<div className="px-6 py-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">
										Page {page + 1} of {Math.ceil(MOCK_ROUNDS.length / perPage)}
									</div>
									<button
										onClick={() =>
											setPage(Math.min(Math.ceil(MOCK_ROUNDS.length / perPage) - 1, page + 1))
										}
										disabled={page >= Math.ceil(MOCK_ROUNDS.length / perPage) - 1}
										className="px-6 py-3 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Next
									</button>
								</div>
							)}
						</>
					)}
				</Container>
			</section>
		</div>
	);
}
