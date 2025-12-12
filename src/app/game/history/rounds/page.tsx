'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Trophy, Users, Clock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/features/Breadcrumbs';
import { AddressDisplay } from '@/components/features/AddressDisplay';
import { formatDate, formatDuration, safeTimestamp } from '@/lib/utils';
import api from '@/services/api';

// API Response Interface
interface RoundStats {
	RoundNum: number;
	TotalBids: number;
	TotalDonatedNFTs: number;
	NumERC20Donations: number;
	TotalRaffleEthDeposits: string;
	TotalRaffleEthDepositsEth: number;
	TotalRaffleNFTs: number;
	TotalDonatedCount: number;
	TotalDonatedAmount: string;
	TotalDonatedAmountEth: number;
}

interface MainPrize {
	WinnerAid: number;
	WinnerAddr: string;
	TimeoutTs: number;
	EthAmount: string;
	EthAmountEth: number;
	CstAmount: string;
	CstAmountEth: number;
	NftTokenId: number;
	Seed: string;
}

interface StakingDeposit {
	StakingDepositId: number;
	StakingDepositAmount: string;
	StakingDepositAmountEth: number;
	StakingPerToken: string;
	StakingPerTokenEth: number;
	StakingNumStakedTokens: number;
}

interface EnduranceChampion {
	WinnerAddr: string;
	NftTokenId: number;
	CstAmount: string;
	CstAmountEth: number;
}

interface ChronoWarrior {
	WinnerAddr: string;
	EthAmount: string;
	EthAmountEth: number;
	CstAmount: string;
	CstAmountEth: number;
	NftTokenId: number;
}

interface ClaimPrizeTx {
	Tx: {
		EvtLogId: number;
		BlockNum: number;
		TxId: number;
		TxHash: string;
		TimeStamp: number;
		DateTime: string;
	};
}

interface ApiRoundData {
	RoundNum: number;
	ClaimPrizeTx: ClaimPrizeTx;
	MainPrize: MainPrize;
	StakingDeposit: StakingDeposit;
	EnduranceChampion: EnduranceChampion;
	ChronoWarrior: ChronoWarrior;
	RoundStats: RoundStats;
	RaffleNFTWinners: unknown;
	StakingNFTWinners: unknown;
	RaffleETHDeposits: unknown;
	AllPrizes: unknown;
}

export default function RoundsArchivePage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(0);
	const [perPage, setPerPage] = useState(20);
	const [rounds, setRounds] = useState<ApiRoundData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch rounds data from API
	useEffect(() => {
		const fetchRounds = async () => {
			setLoading(true);
			setError(null);
			try {
				const data = await api.getRoundList();
				// Sort by timestamp (most recent first)
				const sortedData = data.sort((a: ApiRoundData, b: ApiRoundData) => 
					b.ClaimPrizeTx.Tx.TimeStamp - a.ClaimPrizeTx.Tx.TimeStamp
				);
				setRounds(sortedData);
			} catch (err) {
				console.error('Error fetching rounds:', err);
				setError('Failed to load rounds data. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchRounds();
	}, []);

	// Reset page to 0 when search query or perPage changes
	useEffect(() => {
		setPage(0);
	}, [searchQuery, perPage]);

	// Scroll to top when page changes
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [page]);

	const filteredRounds = rounds.filter(round => {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			round.RoundNum.toString().includes(q) ||
			round.MainPrize.WinnerAddr.toLowerCase().includes(q)
		);
	});

	const paginatedRounds = filteredRounds.slice(page * perPage, (page + 1) * perPage);

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
							{loading ? (
								'Loading rounds data...'
							) : (
								<>
									Explore all {rounds.length} completed rounds • Total prizes: ~
									{Math.floor(rounds.length * 12.5)} ETH distributed
								</>
							)}
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
					{loading ? (
						<Card glass className="p-12 text-center">
							<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
							<p className="text-text-secondary">Loading rounds data...</p>
						</Card>
					) : error ? (
						<Card glass className="p-12 text-center">
							<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
							<p className="text-text-secondary mb-4">{error}</p>
							<button
								onClick={() => window.location.reload()}
								className="px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all"
							>
								Retry
							</button>
						</Card>
					) : paginatedRounds.length === 0 ? (
						<Card glass className="p-12 text-center">
							<p className="text-text-secondary">No rounds found matching your search.</p>
						</Card>
					) : (
						<>
							<div className="mb-6 text-sm text-text-secondary">
								Showing {paginatedRounds.length} of {filteredRounds.length} round{filteredRounds.length !== 1 ? 's' : ''}
							</div>

							<div className="space-y-6">
								{paginatedRounds.map((round, index) => {
									// Calculate round duration
									const duration = round.MainPrize.TimeoutTs - round.ClaimPrizeTx.Tx.TimeStamp;
									// Calculate total winners
									const totalWinners = round.RoundStats.TotalRaffleNFTs + 3; // raffle NFTs + main + endurance + chrono
									// Calculate total pool (main prize + staking + raffle)
									const totalPool = (round.MainPrize?.EthAmountEth || 0) + (round.StakingDeposit?.StakingDepositAmountEth || 0) + (round.RoundStats?.TotalRaffleEthDepositsEth || 0);

									return (
										<motion.div
											key={round.RoundNum}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: Math.min(index * 0.05, 0.3) }}
										>
											<Link href={`/game/history/rounds/${round.RoundNum}`}>
												<Card glass hover className="p-8">
													<div className="flex items-start justify-between flex-wrap gap-6">
														{/* Main Info */}
														<div className="flex-1">
															<div className="flex items-center space-x-4 mb-4">
																<Badge variant="default" className="text-base px-4 py-1.5">
																	Round {round.RoundNum}
																</Badge>
																<span className="text-sm text-text-muted">
																	{formatDate(new Date(safeTimestamp(round.ClaimPrizeTx.Tx)))}
																</span>
															</div>

															<div className="space-y-3">
																<div className="flex items-center space-x-3">
																	<Trophy size={18} className="text-primary" />
																	<span className="text-text-secondary text-sm">
																		Winner:
																	</span>
																	<AddressDisplay
																		address={round.MainPrize.WinnerAddr}
																		showCopy={false}
																		showLink={false}
																	/>
																</div>

																<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
																	<div className="flex items-center space-x-2">
																		<Users size={16} className="text-text-muted" />
																		<span className="text-sm text-text-secondary">
																			{round.RoundStats.TotalBids} bids
																		</span>
																	</div>
																	<div className="flex items-center space-x-2">
																		<Clock size={16} className="text-text-muted" />
																		<span className="text-sm text-text-secondary">
																			{formatDuration(duration * 1000)}
																		</span>
																	</div>
																	<div className="flex items-center space-x-2">
																		<Trophy size={16} className="text-text-muted" />
																		<span className="text-sm text-text-secondary">
																			{totalWinners} winners
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
																{(round.MainPrize?.EthAmountEth || 0).toFixed(4)}
															</p>
															<p className="text-xs text-text-muted">ETH</p>

															<div className="mt-4 pt-4 border-t border-text-muted/10">
																<p className="text-xs text-text-secondary">Total Pool</p>
																<p className="font-mono text-lg text-text-primary">
																	{totalPool.toFixed(4)} ETH
																</p>
															</div>
														</div>
													</div>

													{/* Champions Preview */}
													<div className="mt-6 pt-6 border-t border-text-muted/10 grid grid-cols-1 md:grid-cols-2 gap-4">
														{round.EnduranceChampion?.WinnerAddr && (
															<div className="p-3 rounded-lg bg-background-elevated/50">
																<p className="text-xs text-text-secondary mb-1">
																	Endurance Champion
																</p>
																<AddressDisplay
																	address={round.EnduranceChampion.WinnerAddr}
																	showCopy={false}
																	showLink={false}
																	className="text-sm"
																/>
															</div>
														)}
														{round.ChronoWarrior?.WinnerAddr && (
															<div className="p-3 rounded-lg bg-background-elevated/50">
																<p className="text-xs text-text-secondary mb-1">
																	Chrono-Warrior
																</p>
																<AddressDisplay
																	address={round.ChronoWarrior.WinnerAddr}
																	showCopy={false}
																	showLink={false}
																	className="text-sm"
																/>
															</div>
														)}
													</div>
												</Card>
											</Link>
										</motion.div>
									);
								})}
							</div>

							{/* Pagination */}
							{filteredRounds.length > 0 && (
								<div className="mt-12 space-y-6">
									{/* Page Size Selector */}
									<div className="flex items-center justify-center gap-3">
										<span className="text-sm text-text-secondary">Rounds per page:</span>
										<select
											value={perPage}
											onChange={e => setPerPage(Number(e.target.value))}
											className="px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all"
										>
											<option value={10}>10</option>
											<option value={20}>20</option>
											<option value={50}>50</option>
											<option value={100}>100</option>
										</select>
									</div>

									{/* Pagination Controls */}
									{filteredRounds.length > perPage && (() => {
										const totalPages = Math.ceil(filteredRounds.length / perPage);
										const maxVisiblePages = 7;
										
										// Calculate which page numbers to show
										let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
										const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
										
										// Adjust if we're near the end
										if (endPage - startPage < maxVisiblePages - 1) {
											startPage = Math.max(0, endPage - maxVisiblePages + 1);
										}
										
										const pageNumbers = Array.from(
											{ length: endPage - startPage + 1 },
											(_, i) => startPage + i
										);

										return (
											<div className="flex items-center justify-center gap-2 flex-wrap">
												{/* First Page */}
												<button
													onClick={() => setPage(0)}
													disabled={page === 0}
													className="px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
													title="First page"
												>
													«
												</button>

												{/* Previous Page */}
												<button
													onClick={() => setPage(Math.max(0, page - 1))}
													disabled={page === 0}
													className="px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
													title="Previous page"
												>
													‹
												</button>

												{/* Page Numbers */}
												{startPage > 0 && (
													<span className="px-2 text-text-muted">...</span>
												)}

												{pageNumbers.map(pageNum => (
													<button
														key={pageNum}
														onClick={() => setPage(pageNum)}
														className={`min-w-[44px] px-4 py-2 rounded-lg border transition-all ${
															pageNum === page
																? 'bg-primary/10 border-primary/40 text-primary font-semibold'
																: 'bg-background-elevated border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary'
														}`}
													>
														{pageNum + 1}
													</button>
												))}

												{endPage < totalPages - 1 && (
													<span className="px-2 text-text-muted">...</span>
												)}

												{/* Next Page */}
												<button
													onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
													disabled={page >= totalPages - 1}
													className="px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
													title="Next page"
												>
													›
												</button>

												{/* Last Page */}
												<button
													onClick={() => setPage(totalPages - 1)}
													disabled={page >= totalPages - 1}
													className="px-4 py-2 rounded-lg bg-background-elevated border border-text-muted/10 text-text-primary hover:border-primary/40 hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
													title="Last page"
												>
													»
												</button>
											</div>
										);
									})()}

									{/* Pagination Info */}
									<div className="text-center text-sm text-text-secondary">
										Showing {page * perPage + 1} - {Math.min((page + 1) * perPage, filteredRounds.length)} of {filteredRounds.length} rounds
									</div>
								</div>
							)}
						</>
					)}
				</Container>
			</section>
		</div>
	);
}
