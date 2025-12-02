'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { defaultChain } from '@/lib/web3/chains';
import { api } from '@/services/api';
import { formatTime } from '@/lib/utils';
import { useCosmicGameRead } from '@/hooks/useCosmicGameContract';
import { useCharityWallet } from '@/hooks/useCharityWallet';
import { formatEther } from 'viem';
import { 
	Copy,
	Network,
	ExternalLink,
	CheckCircle2,
	Loader2
} from 'lucide-react';

interface DashboardData {
	ContractAddrs: {
		CosmicGameAddr: string;
		CosmicTokenAddr: string;
		CosmicSignatureAddr: string;
		RandomWalkAddr: string;
		CosmicDaoAddr: string;
		CharityWalletAddr: string;
		MarketingWalletAddr: string;
		PrizesWalletAddr: string;
		StakingWalletCSTAddr: string;
		StakingWalletRWalkAddr: string;
	};
	PrizePercentage: number;
	ChronoWarriorPercentage: number;
	RafflePercentage: number;
	StakignPercentage: number;
	NumRaffleEthWinnersBidding: number;
	NumRaffleNFTWinnersBidding: number;
	NumRaffleNFTWinnersStakingRWalk: number;
	CharityPercentage: number;
	TimeoutClaimPrize: number;
	InitialSecondsUntilPrize: number;
	CurRoundNum: number;
	MainStats: {
		TotalBids: number;
		TotalRounds: number;
	};
}

interface ContractItemProps {
	name: string;
	value: string | number | undefined;
	copyable?: boolean;
}

const ContractItem = ({ name, value, copyable = false }: ContractItemProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (value) {
			navigator.clipboard.writeText(String(value));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="flex items-start justify-between py-4 border-b border-text-muted/10 last:border-0">
			<span className="text-text-secondary text-sm md:text-base min-w-[200px] md:min-w-[350px] max-w-[200px] md:max-w-[350px] mr-4">
				{name}:
			</span>
			<div className="flex items-center gap-2 flex-1 justify-end">
				<span className="font-mono text-text-primary text-sm md:text-base break-all text-right">
					{value}
				</span>
				{copyable && (
					<button
						onClick={handleCopy}
						className="flex-shrink-0 p-1.5 rounded-lg hover:bg-background-elevated transition-colors"
						title="Copy to clipboard"
					>
						{copied ? (
							<CheckCircle2 size={16} className="text-status-success" />
						) : (
							<Copy size={16} className="text-text-secondary hover:text-primary" />
						)}
					</button>
				)}
			</div>
		</div>
	);
};

export default function ContractsPage() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);

	// Get contract read hooks
	const cosmicGameRead = useCosmicGameRead();
	const charityWallet = useCharityWallet();

	// Fetch contract data using hooks
	const { data: charityAddress } = charityWallet.useCharityAddress();
	const { data: cstRewardPerBid } = cosmicGameRead.useCstRewardPerBid();
	const { data: bidMessageMaxLength } = cosmicGameRead.useBidMessageMaxLength();
	const { data: ethBidPriceIncreaseDivisor } = cosmicGameRead.useEthBidPriceIncreaseDivisor();
	const { data: mainPrizeTimeIncrementIncreaseDivisor } = cosmicGameRead.useMainPrizeTimeIncrementIncreaseDivisor();
	const { data: cstDutchAuctionBeginningBidPriceMinLimit } = cosmicGameRead.useCstDutchAuctionBeginningBidPriceMinLimit();
	const { data: cstAuctionDurations } = cosmicGameRead.useCstAuctionDurations();
	const { data: ethAuctionDurations } = cosmicGameRead.useEthAuctionDurations();

	// Calculate percentages from divisors
	const priceIncrease = ethBidPriceIncreaseDivisor ? 100 / Number(ethBidPriceIncreaseDivisor) : 0;
	const timeIncrease = mainPrizeTimeIncrementIncreaseDivisor ? 100 / Number(mainPrizeTimeIncrementIncreaseDivisor) : 0;

	// Format token amounts
	const cstRewardFormatted = cstRewardPerBid && typeof cstRewardPerBid === 'bigint' ? Number(formatEther(cstRewardPerBid)) : 0;
	const cstBeginningBidPriceFormatted = cstDutchAuctionBeginningBidPriceMinLimit && typeof cstDutchAuctionBeginningBidPriceMinLimit === 'bigint'
		? Number(formatEther(cstDutchAuctionBeginningBidPriceMinLimit)) 
		: 0;

	// Extract auction durations
	const cstAuctionDuration = cstAuctionDurations && Array.isArray(cstAuctionDurations) ? Number(cstAuctionDurations[0]) : 0;
	const cstAuctionElapsed = cstAuctionDurations && Array.isArray(cstAuctionDurations) ? Number(cstAuctionDurations[1]) : 0;
	const ethAuctionDuration = ethAuctionDurations && Array.isArray(ethAuctionDurations) ? Number(ethAuctionDurations[0]) : 0;
	const ethAuctionElapsed = ethAuctionDurations && Array.isArray(ethAuctionDurations) ? Number(ethAuctionDurations[1]) : 0;

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const dashboardData = await api.getDashboardInfo();
				setData(dashboardData);
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const contractItems = [
		{ name: 'Network', value: defaultChain.name },
		{ name: 'Chain ID', value: defaultChain.id },
		{
			name: 'Cosmic Game Address',
			value: data?.ContractAddrs.CosmicGameAddr,
			copyable: true,
		},
		{
			name: 'Cosmic Signature Token Address',
			value: data?.ContractAddrs.CosmicTokenAddr,
			copyable: true,
		},
		{
			name: 'Cosmic Signature Address',
			value: data?.ContractAddrs.CosmicSignatureAddr,
			copyable: true,
		},
		{
			name: 'RandomWalk Address',
			value: data?.ContractAddrs.RandomWalkAddr,
			copyable: true,
		},
		{
			name: 'Cosmic DAO Address',
			value: data?.ContractAddrs.CosmicDaoAddr,
			copyable: true,
		},
		{
			name: 'Charity Wallet Address',
			value: data?.ContractAddrs.CharityWalletAddr,
			copyable: true,
		},
		{
			name: 'Marketing Wallet Address',
			value: data?.ContractAddrs.MarketingWalletAddr,
			copyable: true,
		},
		{
			name: 'Prizes Wallet Address',
			value: data?.ContractAddrs.PrizesWalletAddr,
			copyable: true,
		},
		{
			name: 'Cosmic Signature Staking Wallet Address',
			value: data?.ContractAddrs.StakingWalletCSTAddr,
			copyable: true,
		},
		{
			name: 'Random Walk Staking Wallet Address',
			value: data?.ContractAddrs.StakingWalletRWalkAddr,
			copyable: true,
		},
	];

	const configItems = [
		{
			name: 'Price Increase',
			value: priceIncrease ? `${priceIncrease.toFixed(2)}%` : '--',
		},
		{
			name: 'Time Increase',
			value: timeIncrease ? `${timeIncrease.toFixed(2)}%` : '--',
		},
		{
			name: 'Prize Percentage',
			value: data ? `${data.PrizePercentage}%` : '--',
		},
		{
			name: 'Chrono Warrior Percentage',
			value: data ? `${data.ChronoWarriorPercentage}%` : '--',
		},
		{
			name: 'Raffle Percentage',
			value: data ? `${data.RafflePercentage}%` : '--',
		},
		{
			name: 'Staking Percentage',
			value: data ? `${data.StakignPercentage}%` : '--',
		},
		{
			name: 'Raffle ETH Winners for Bidding',
			value: data?.NumRaffleEthWinnersBidding,
		},
		{
			name: 'Raffle NFT Winners for Bidding',
			value: data?.NumRaffleNFTWinnersBidding,
		},
		{
			name: 'Raffle NFT Winners for Staking Random Walk',
			value: data?.NumRaffleNFTWinnersStakingRWalk,
		},
		{
			name: 'Charity Address',
			value: (charityAddress && typeof charityAddress === 'string') ? charityAddress : '--',
			copyable: true,
		},
		{
			name: 'Charity Percentage',
			value: data ? `${data.CharityPercentage}%` : '--',
		},
		{
			name: 'Amount of CosmicTokens earned per bid',
			value: cstRewardFormatted ? `${cstRewardFormatted} CST` : '--',
		},
		{
			name: 'CST Dutch Auction Duration',
			value: cstAuctionDuration ? formatTime(cstAuctionDuration) : '--',
		},
		{
			name: 'CST Dutch Auction Elapsed Duration',
			value: cstAuctionElapsed ? formatTime(cstAuctionElapsed) : '--',
		},
		{
			name: 'ETH Dutch Auction Duration',
			value: ethAuctionDuration ? formatTime(ethAuctionDuration) : '--',
		},
		{
			name: 'ETH Dutch Auction Elapsed Duration',
			value: ethAuctionElapsed ? formatTime(ethAuctionElapsed) : '--',
		},
		{
			name: 'Timeout to claim prize',
			value: data ? formatTime(data.TimeoutClaimPrize) : '--',
		},
		{
			name: 'Maximum message length',
			value: (bidMessageMaxLength && typeof bidMessageMaxLength === 'bigint') ? Number(bidMessageMaxLength) : '--',
		},
		{
			name: 'Initial increment first bid',
			value: data ? formatTime(data.InitialSecondsUntilPrize) : '--',
		},
		{
			name: 'CST dutch auction beginning bid price',
			value: cstBeginningBidPriceFormatted ? `${cstBeginningBidPriceFormatted} CST` : '--',
		},
		{
			name: 'Total Bids',
			value: data?.MainStats.TotalBids.toLocaleString(),
		},
		{
			name: 'Total Rounds',
			value: data?.CurRoundNum,
		},
	];

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
							Contract
							<span className="text-gradient block mt-2">Addresses</span>
						</h1>
						<p className="body-xl mb-8">
							Get detailed information on Cosmic Signature&apos;s smart contracts, including addresses and current configuration
						</p>

						{/* Network Info Badge */}
						<Card glass className="p-6 inline-block">
							<div className="flex items-center space-x-6 text-left">
								<div className="flex items-center space-x-3">
									<Network className="text-primary" size={24} />
									<div>
										<p className="text-sm text-text-secondary">Network</p>
										<p className="font-semibold text-text-primary">{defaultChain.name}</p>
									</div>
								</div>
								<div className="h-10 w-px bg-text-muted/20" />
								<div>
									<p className="text-sm text-text-secondary">Chain ID</p>
									<p className="font-semibold text-text-primary">{defaultChain.id}</p>
								</div>
								<div className="h-10 w-px bg-text-muted/20" />
								<div>
									<p className="text-sm text-text-secondary">Currency</p>
									<p className="font-semibold text-text-primary">{defaultChain.nativeCurrency.symbol}</p>
								</div>
								{defaultChain.blockExplorers && (
									<>
										<div className="h-10 w-px bg-text-muted/20" />
										<a
											href={defaultChain.blockExplorers.default.url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
										>
											<span className="text-sm font-medium">Explorer</span>
											<ExternalLink size={16} />
										</a>
									</>
								)}
							</div>
						</Card>
					</motion.div>
				</Container>
			</section>

			{/* Loading State */}
			{loading ? (
				<section className="section-padding">
					<Container>
						<Card glass className="p-12 text-center">
							<Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
							<p className="text-text-secondary">Loading contract information...</p>
						</Card>
					</Container>
				</section>
			) : (
				<>
					{/* Contract Addresses */}
					<section className="section-padding">
						<Container size="lg">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.2 }}
							>
								<h2 className="heading-md mb-8 text-center">Contract Addresses</h2>
								<Card glass className="p-6 md:p-8">
									<div className="space-y-2">
										{contractItems.map((item) => (
											<ContractItem
												key={item.name}
												name={item.name}
												value={item.value}
												copyable={item.copyable}
											/>
										))}
									</div>
								</Card>
							</motion.div>
						</Container>
					</section>

					{/* Configuration */}
					<section className="section-padding bg-background-surface/50">
						<Container size="lg">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
							>
								<h2 className="heading-md mb-4 text-center">
									Current Configuration
								</h2>
								<p className="body-lg text-center mb-8 text-text-secondary">
									Contract settings and game parameters
								</p>
								<Card glass className="p-6 md:p-8">
									<div className="space-y-2">
										{configItems.map((item) => (
											<ContractItem
												key={item.name}
												name={item.name}
												value={item.value}
												copyable={item.copyable}
											/>
										))}
									</div>
								</Card>
							</motion.div>
						</Container>
					</section>

					{/* Integration Info */}
					<section className="section-padding">
						<Container size="lg">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								className="text-center"
							>
								<Card glass className="p-8">
									<h3 className="font-serif text-2xl font-semibold text-text-primary mb-4">
										For Developers
									</h3>
									<p className="text-text-secondary mb-6 max-w-2xl mx-auto">
										All smart contracts are open source and verified on-chain. Check the blockchain explorer for contract verification, source code, and ABI details.
									</p>
									<div className="flex flex-wrap items-center justify-center gap-3">
										<Badge variant="default" className="px-4 py-2">
											Open Source
										</Badge>
										<Badge variant="success" className="px-4 py-2">
											Verified on Explorer
										</Badge>
										<Badge variant="info" className="px-4 py-2">
											Arbitrum Sepolia
										</Badge>
									</div>
									{defaultChain.blockExplorers && (
										<div className="mt-6">
											<a
												href={defaultChain.blockExplorers.default.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors font-medium"
											>
												<span>View on {defaultChain.blockExplorers.default.name}</span>
												<ExternalLink size={16} />
											</a>
										</div>
									)}
								</Card>
							</motion.div>
						</Container>
					</section>
				</>
			)}
		</div>
	);
}
