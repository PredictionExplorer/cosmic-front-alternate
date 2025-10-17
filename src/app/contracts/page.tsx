'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { AddressDisplay } from '@/components/features/AddressDisplay';
import { Badge } from '@/components/ui/Badge';
import { 
	getContractAddresses, 
	CONTRACT_NAMES
} from '@/lib/web3/contracts';
import { defaultChain } from '@/lib/web3/chains';
import { useCosmicGameRead } from '@/hooks/useCosmicGameContract';
import { useCosmicTokenRead } from '@/hooks/useCosmicToken';
import { useCosmicSignatureNFT } from '@/hooks/useCosmicSignatureNFT';
import { useStakingWalletCST, useStakingWalletRWLK } from '@/hooks/useStakingWallet';
import { formatUnits } from 'viem';
import { 
	Coins, 
	Image, 
	Gamepad2, 
	Wallet, 
	Lock, 
	Heart, 
	TrendingUp,
	Database,
	Network,
	ExternalLink
} from 'lucide-react';

export default function ContractsPage() {
	const contracts = getContractAddresses(defaultChain.id);
	
	// Read contract values
	const gameRead = useCosmicGameRead();
	const tokenRead = useCosmicTokenRead();
	const nftRead = useCosmicSignatureNFT().read;
	const stakingCSTRead = useStakingWalletCST().read;
	const stakingRWLKRead = useStakingWalletRWLK().read;

	// Game contract data
	const { data: roundNum } = gameRead.useRoundNum();
	const { data: ethBidPrice } = gameRead.useEthBidPrice();
	const { data: cstBidPrice } = gameRead.useCstBidPrice();
	const { data: mainPrizeAmount } = gameRead.useMainPrizeAmount();

	// Token contract data
	const { data: totalSupply } = tokenRead.useTotalSupply();
	const { data: tokenName } = tokenRead.useName();
	const { data: tokenSymbol } = tokenRead.useSymbol();
	const { data: tokenDecimals } = tokenRead.useDecimals();

	// NFT contract data
	const { data: nftTotalSupply } = nftRead.useTotalSupply();

	// Staking contract data
	const { data: numStakedCST } = stakingCSTRead.useNumStaked();
	const { data: rewardPerNft } = stakingCSTRead.useRewardPerNft();
	const { data: numStakedRWLK } = stakingRWLKRead.useNumStaked();

	// Helper to get color classes
	const getColorClasses = (color: string) => {
		const colorMap = {
			primary: { bg: 'bg-primary/10', text: 'text-primary' },
			warning: { bg: 'bg-status-warning/10', text: 'text-status-warning' },
			accent: { bg: 'bg-accent/10', text: 'text-accent' },
			info: { bg: 'bg-status-info/10', text: 'text-status-info' },
			success: { bg: 'bg-status-success/10', text: 'text-status-success' },
			error: { bg: 'bg-status-error/10', text: 'text-status-error' }
		};
		return colorMap[color as keyof typeof colorMap] || colorMap.primary;
	};

	// Contract list for display
	const contractList = [
		{
			name: 'Cosmic Game',
			description: 'Main game logic including bidding, prizes, and round management',
			address: contracts.COSMIC_GAME,
			icon: Gamepad2,
			color: 'primary',
			stats: [
				{ label: 'Current Round', value: roundNum?.toString() || '...' },
				{ label: 'Prize Pool', value: typeof mainPrizeAmount === 'bigint' ? `${formatUnits(mainPrizeAmount, 18)} ETH` : '...' },
				{ label: 'ETH Bid Price', value: typeof ethBidPrice === 'bigint' ? `${formatUnits(ethBidPrice, 18)} ETH` : '...' },
				{ label: 'CST Bid Price', value: (typeof cstBidPrice === 'bigint' && typeof tokenDecimals === 'number') ? `${formatUnits(cstBidPrice, tokenDecimals)} CST` : '...' }
			]
		},
		{
			name: 'Cosmic Signature Token (CST)',
			description: 'ERC-20 token with voting, burning, and minting capabilities',
			address: contracts.COSMIC_SIGNATURE_TOKEN,
			icon: Coins,
			color: 'warning',
			stats: [
				{ label: 'Token Name', value: typeof tokenName === 'string' ? tokenName : '...' },
				{ label: 'Symbol', value: typeof tokenSymbol === 'string' ? tokenSymbol : '...' },
				{ label: 'Total Supply', value: (typeof totalSupply === 'bigint' && typeof tokenDecimals === 'number') ? `${formatUnits(totalSupply, tokenDecimals)} CST` : '...' },
				{ label: 'Decimals', value: tokenDecimals?.toString() || '...' }
			]
		},
		{
			name: 'Cosmic Signature NFT',
			description: 'ERC-721 contract for game NFTs with custom metadata',
			address: contracts.COSMIC_SIGNATURE_NFT,
			icon: Image,
			color: 'accent',
			stats: [
				{ label: 'Total Minted', value: nftTotalSupply?.toString() || '...' },
				{ label: 'Standard', value: 'ERC-721' },
				{ label: 'Features', value: 'Custom Names, Staking' }
			]
		},
		{
			name: 'RandomWalk NFT',
			description: 'Pre-existing ERC-721 NFTs used for bid discounts',
			address: contracts.RANDOM_WALK_NFT,
			icon: TrendingUp,
			color: 'info',
			stats: [
				{ label: 'Benefit', value: '50% Bid Discount' },
				{ label: 'Standard', value: 'ERC-721' },
				{ label: 'Staking', value: 'Raffle Eligibility' }
			]
		},
		{
			name: 'Prizes Wallet',
			description: 'Holds and distributes prizes, tokens, and donated NFTs',
			address: contracts.PRIZES_WALLET,
			icon: Wallet,
			color: 'success',
			stats: [
				{ label: 'Function', value: 'Prize Distribution' },
				{ label: 'Holds', value: 'ETH, NFTs, Tokens' }
			]
		},
		{
			name: 'CST Staking Wallet',
			description: 'Stake Cosmic Signature NFTs for ETH rewards',
			address: contracts.STAKING_WALLET_CST,
			icon: Lock,
			color: 'primary',
			stats: [
				{ label: 'Staked NFTs', value: numStakedCST?.toString() || '...' },
				{ label: 'Reward per NFT', value: typeof rewardPerNft === 'bigint' ? `${formatUnits(rewardPerNft, 18)} ETH` : '...' },
				{ label: 'Lock Period', value: 'No Lock' }
			]
		},
		{
			name: 'RandomWalk Staking Wallet',
			description: 'Stake RandomWalk NFTs for raffle eligibility',
			address: contracts.STAKING_WALLET_RWLK,
			icon: Lock,
			color: 'info',
			stats: [
				{ label: 'Staked NFTs', value: numStakedRWLK?.toString() || '...' },
				{ label: 'Rewards', value: 'NFT Raffle Entry' },
				{ label: 'One-Time', value: 'Permanent Staking' }
			]
		},
		{
			name: 'Charity Wallet',
			description: 'Receives charity donations (7% of prizes)',
			address: contracts.CHARITY_WALLET,
			icon: Heart,
			color: 'error',
			stats: [
				{ label: 'Allocation', value: '7% of Prize Pool' },
				{ label: 'Purpose', value: 'Charitable Causes' }
			]
		},
		{
			name: 'Marketing Wallet',
			description: 'Receives CST tokens for marketing activities',
			address: contracts.MARKETING_WALLET,
			icon: TrendingUp,
			color: 'warning',
			stats: [
				{ label: 'Purpose', value: 'Marketing & Growth' },
				{ label: 'Receives', value: 'CST Tokens' }
			]
		},
		{
			name: 'Cosmic DAO',
			description: 'Governance contract for CST token holders',
			address: contracts.COSMIC_DAO,
			icon: Database,
			color: 'accent',
			stats: [
				{ label: 'Status', value: 'Coming Soon' },
				{ label: 'Purpose', value: 'Community Governance' }
			]
		}
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
							<span className="text-gradient block mt-2">Information</span>
						</h1>
						<p className="body-xl mb-8">
							View all smart contract addresses, live values, and network information
						</p>

						{/* Network Info */}
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

			{/* Contract Cards */}
			<section className="section-padding">
				<Container>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{contractList.map((contract, index) => {
							const Icon = contract.icon;
							return (
								<motion.div
									key={contract.address}
									initial={{ opacity: 0, y: 30 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card glass hover className="p-6 h-full">
										{/* Header */}
										<div className="flex items-start justify-between mb-4">
											<div className="flex items-start space-x-3">
												<div className={`flex-shrink-0 rounded-lg ${getColorClasses(contract.color).bg} p-3`}>
													<Icon size={24} className={getColorClasses(contract.color).text} />
												</div>
												<div>
													<h3 className="font-serif text-lg font-semibold text-text-primary mb-1">
														{contract.name}
													</h3>
													<p className="text-sm text-text-secondary">
														{contract.description}
													</p>
												</div>
											</div>
										</div>

										{/* Address */}
										<div className="mb-4 p-3 rounded-lg bg-background-elevated border border-text-muted/10">
											<p className="text-xs text-text-secondary mb-2">Contract Address</p>
											<AddressDisplay 
												address={contract.address} 
												shorten={false}
												className="w-full justify-start"
											/>
										</div>

										{/* Stats */}
										{contract.stats && contract.stats.length > 0 && (
											<div className="grid grid-cols-2 gap-3">
												{contract.stats.map((stat, i) => (
													<div 
														key={i}
														className="p-3 rounded-lg bg-background-surface border border-text-muted/5"
													>
														<p className="text-xs text-text-secondary mb-1">{stat.label}</p>
														<p className="text-sm font-semibold text-text-primary truncate">
															{stat.value}
														</p>
													</div>
												))}
											</div>
										)}
									</Card>
								</motion.div>
							);
						})}
					</div>
				</Container>
			</section>

			{/* Quick Reference */}
			<section className="section-padding bg-background-surface/50">
				<Container size="lg">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-8"
					>
						<h2 className="heading-md mb-4">Quick Reference</h2>
						<p className="body-lg">Key contract addresses for developers</p>
					</motion.div>

					<Card glass className="p-8">
						<div className="space-y-4">
							{Object.entries(contracts).map(([key, address]) => {
								const name = CONTRACT_NAMES[address as keyof typeof CONTRACT_NAMES] || key;
								return (
									<div 
										key={key}
										className="flex items-center justify-between p-4 rounded-lg bg-background-elevated border border-text-muted/10 hover:border-primary/20 transition-colors"
									>
										<div>
											<p className="font-medium text-text-primary mb-1">{name}</p>
											<code className="text-xs font-mono text-text-muted">{key}</code>
										</div>
										<AddressDisplay 
											address={address} 
											shorten={true}
											chars={8}
										/>
									</div>
								);
							})}
						</div>
					</Card>

					{/* Integration Info */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="mt-8 text-center"
					>
						<Card glass className="p-6">
							<h3 className="font-serif text-xl font-semibold text-text-primary mb-3">
								For Developers
							</h3>
						<p className="text-sm text-text-secondary mb-4">
							All smart contracts are open source and verified on-chain. Check the documentation for integration guides and API references.
						</p>
						<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
							<Badge variant="default" className="px-4 py-2 text-sm">Open Source</Badge>
							<Badge variant="success" className="px-4 py-2 text-sm">Audited</Badge>
							<Badge variant="info" className="px-4 py-2 text-sm">Verified on Explorer</Badge>
						</div>
						</Card>
					</motion.div>
				</Container>
			</section>
		</div>
	);
}

