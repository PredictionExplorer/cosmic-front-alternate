# Blockchain & API Integration Guide for Cosmic Signature Web

This guide shows exactly how to connect the new premium website to the blockchain and backend API, using patterns from the existing cosmicgame-frontend.

---

## Overview of Integration Architecture

### What You Need to Connect

1. **Blockchain (Arbitrum)** - For real-time data and transactions
2. **Backend API** - For historical data and analytics
3. **Image/Metadata API** - For NFT images and videos

### Data Source Strategy

**Use Blockchain For**:

-   Current round state (roundNum, mainPrizeTime)
-   Current bid prices (ETH, CST)
-   User balances (ETH, CST, NFT counts)
-   NFT ownership verification
-   Submitting transactions (bids, stakes, claims)
-   Real-time contract state

**Use Backend API For**:

-   Historical bid list
-   Prize claim history
-   NFT metadata and images
-   Staking statistics
-   Aggregated analytics
-   User profiles
-   Donation history
-   Chart data

---

## Step 1: Install Dependencies

```bash
cd cosmic-signature-web

# Web3 libraries
npm install wagmi viem @tanstack/react-query

# Wallet connection UI
npm install @rainbow-me/rainbowkit

# HTTP client for API
npm install axios
```

---

## Step 2: Configure Blockchain Connection

### Create `src/lib/wagmi.ts`:

```typescript
import { createConfig, http } from 'wagmi';
import { arbitrum, arbitrumSepolia, localhost } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Contract addresses (update with actual deployed addresses)
export const CONTRACTS = {
	GAME: '0x...' as `0x${string}`,
	NFT: '0x...' as `0x${string}`,
	TOKEN: '0x...' as `0x${string}`,
	PRIZES_WALLET: '0x...' as `0x${string}`,
	STAKING_CST: '0x...' as `0x${string}`,
	STAKING_RWALK: '0x...' as `0x${string}`,
	MARKETING: '0x...' as `0x${string}`,
	CHARITY: '0x...' as `0x${string}`,
	RANDOM_WALK_NFT: '0x...' as `0x${string}`
};

export const config = createConfig({
	chains: [arbitrum, arbitrumSepolia, localhost],
	connectors: [
		injected(),
		walletConnect({
			projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!
		})
	],
	transports: {
		[arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
		[arbitrumSepolia.id]: http(),
		[localhost.id]: http('http://localhost:8545')
	}
});
```

---

## Step 3: Add Contract ABIs

### Create `src/lib/abis/`:

```typescript
// src/lib/abis/CosmicGame.ts
export const COSMIC_GAME_ABI = [
	// Copy from cosmicgame-frontend/contracts/CosmicGame.json
	// Or import directly from build artifacts
] as const;

// src/lib/abis/CosmicSignatureNft.ts
export const COSMIC_SIGNATURE_NFT_ABI = [
	// ...
] as const;

// src/lib/abis/CosmicSignatureToken.ts
export const COSMIC_SIGNATURE_TOKEN_ABI = [
	// ...
] as const;

// And so on for each contract
```

---

## Step 4: Configure API Client

### Create `src/lib/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://161.129.67.42:7070/api/cosmicgame/';

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async get<T>(endpoint: string): Promise<T> {
		try {
			// Use Next.js API route as proxy to avoid CORS
			const response = await axios.get(`/api/proxy?url=${encodeURIComponent(this.baseUrl + endpoint)}`);
			return response.data;
		} catch (error) {
			console.error(`API Error: ${endpoint}`, error);
			throw error;
		}
	}

	// Dashboard
	async getDashboard() {
		return this.get('statistics/dashboard');
	}

	// Current Round
	async getCurrentRoundTime() {
		const data = await this.get<{ CurRoundPrizeTime: number }>('rounds/current/time');
		return data.CurRoundPrizeTime;
	}

	// Bids
	async getBidList(offset: number = 0, limit: number = 100) {
		const data = await this.get<{ Bids: any[] }>(`bid/list/all/${offset}/${limit}`);
		return data.Bids;
	}

	async getBidsByRound(roundNum: number, sort: 'asc' | 'desc' = 'desc') {
		const sortNum = sort === 'asc' ? 0 : 1;
		const data = await this.get<{ BidsByRound: any[] }>(`bid/list/by_round/${roundNum}/${sortNum}/0/1000`);
		return data.BidsByRound;
	}

	async getCurrentSpecialWinners() {
		return this.get('bid/current_special_winners');
	}

	// NFTs
	async getNFTList(offset: number = 0, limit: number = 100) {
		const data = await this.get<{ CosmicSignatureTokenList: any[] }>(`cst/list/all/${offset}/${limit}`);
		return data.CosmicSignatureTokenList;
	}

	async getNFTInfo(tokenId: number) {
		const data = await this.get<{ TokenInfo: any }>(`cst/info/${tokenId}`);
		return data.TokenInfo;
	}

	async getUserNFTs(address: string) {
		const data = await this.get<{ UserTokens: any[] }>(`cst/list/by_user/${address}/0/1000`);
		return data.UserTokens;
	}

	// User
	async getUserInfo(address: string) {
		return this.get(`user/info/${address}`);
	}

	async getUserWinnings(address: string) {
		const data = await this.get<{ Winnings: any }>(`user/notif_red_box/${address}`);
		return data.Winnings;
	}

	// Staking
	async getStakedTokensByUser(address: string) {
		const data = await this.get<{ StakedTokensCST: any[] }>(`staking/cst/staked_tokens/by_user/${address}`);
		return data.StakedTokensCST;
	}

	async getUnclaimedStakingRewards(address: string) {
		const data = await this.get<{ UnclaimedEthDeposits: any[] }>(`staking/cst/rewards/to_claim/by_user/${address}`);
		return data.UnclaimedEthDeposits;
	}

	// Rounds
	async getRoundInfo(roundNum: number) {
		const data = await this.get<{ RoundInfo: any }>(`rounds/info/${roundNum}`);
		return data.RoundInfo;
	}
}

export const api = new ApiClient(API_BASE_URL);
```

---

## Step 5: Create API Proxy (for CORS)

### Create `src/app/api/proxy/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const url = searchParams.get('url');

	if (!url) {
		return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
	}

	try {
		const decodedUrl = decodeURIComponent(url);
		const response = await axios.get(decodedUrl);
		return NextResponse.json(response.data);
	} catch (error: any) {
		console.error('API Proxy Error:', error.message);
		return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
	}
}
```

This proxy:

-   Runs on your Next.js server
-   Bypasses CORS restrictions
-   Forwards requests to backend API
-   Returns data to frontend

---

## Step 6: Create Custom Hooks

### Contract Read Hook:

```typescript
// src/lib/hooks/useCurrentRound.ts
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '../wagmi';
import { COSMIC_GAME_ABI } from '../abis/CosmicGame';

export function useCurrentRound() {
	return useReadContract({
		address: CONTRACTS.GAME,
		abi: COSMIC_GAME_ABI,
		functionName: 'roundNum'
	});
}
```

### Contract Write Hook:

```typescript
// src/lib/hooks/useBidWithEth.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../wagmi';
import { COSMIC_GAME_ABI } from '../abis/CosmicGame';
import { parseEther } from 'viem';

export function useBidWithEth() {
	const { data: hash, writeContract, isPending } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash
	});

	const bidWithEth = async (randomWalkNftId: number, message: string, ethAmount: string) => {
		writeContract({
			address: CONTRACTS.GAME,
			abi: COSMIC_GAME_ABI,
			functionName: 'bidWithEth',
			args: [randomWalkNftId, message],
			value: parseEther(ethAmount)
		});
	};

	return {
		bidWithEth,
		isPending: isPending || isConfirming,
		isSuccess,
		hash
	};
}
```

### API Data Hook:

```typescript
// src/lib/hooks/useNFTList.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useNFTList(offset: number = 0, limit: number = 100) {
	return useQuery({
		queryKey: ['nfts', offset, limit],
		queryFn: () => api.getNFTList(offset, limit),
		staleTime: 1000 * 60 * 5 // 5 minutes
	});
}
```

### Combined Hook (Blockchain + API):

```typescript
// src/lib/hooks/useCurrentGameState.ts
import { useCurrentRound } from './useCurrentRound';
import { useMainPrizeTime } from './useMainPrizeTime';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useCurrentGameState() {
	// From blockchain
	const { data: roundNum } = useCurrentRound();
	const { data: prizeTime } = useMainPrizeTime();

	// From API
	const { data: specialWinners } = useQuery({
		queryKey: ['specialWinners'],
		queryFn: () => api.getCurrentSpecialWinners(),
		refetchInterval: 10000 // Refresh every 10 seconds
	});

	const { data: recentBids } = useQuery({
		queryKey: ['recentBids', roundNum],
		queryFn: () => (roundNum ? api.getBidsByRound(roundNum, 'desc') : null),
		enabled: !!roundNum,
		refetchInterval: 5000 // Refresh every 5 seconds
	});

	return {
		roundNum,
		prizeTime,
		specialWinners,
		recentBids
	};
}
```

---

## Step 7: Update Root Layout with Providers

### Modify `src/app/layout.tsx`:

```typescript
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="scroll-smooth">
			<body className={`${cormorant.variable} ${inter.variable} ${spaceGrotesk.variable} font-sans`}>
				<WagmiProvider config={config}>
					<QueryClientProvider client={queryClient}>
						<RainbowKitProvider>
							<div className="flex min-h-screen flex-col">
								<Header />
								<main className="flex-1 pt-[72px] lg:pt-[88px]">{children}</main>
								<Footer />
							</div>
						</RainbowKitProvider>
					</QueryClientProvider>
				</WagmiProvider>
			</body>
		</html>
	);
}
```

---

## Step 8: Update Components with Real Data

### Example: Update Homepage

```typescript
// src/app/page.tsx

'use client';

import { useCurrentGameState } from '@/lib/hooks/useCurrentGameState';
import { useEthBidPrice } from '@/lib/hooks/useEthBidPrice';

export default function Home() {
	// Replace mock data with real data
	const { roundNum, prizeTime, specialWinners, recentBids } = useCurrentGameState();
	const { data: ethPrice } = useEthBidPrice();

	// Calculate time remaining
	const timeRemaining = prizeTime ? Math.max(0, prizeTime - Math.floor(Date.now() / 1000)) : 0;

	return (
		<div className="overflow-hidden">
			{/* Hero Section */}
			<section className="relative min-h-[90vh] flex items-center justify-center">
				{/* ... */}
				<div className="text-center">
					<div className="font-mono text-3xl font-semibold text-primary mb-1">{roundNum || 0}</div>
					<div className="text-sm text-text-secondary">Current Round</div>
				</div>
				{/* ... */}
			</section>

			{/* Current Round Status */}
			<section className="section-padding bg-background-surface/50">
				<Container>
					<h2 className="heading-md text-balance mb-4">Round {roundNum} is Live</h2>

					<Card glass className="p-8 md:p-12 text-center">
						<CountdownTimer targetSeconds={timeRemaining} size="lg" showIcon={false} />

						{/* Use real ETH price */}
						<div className="font-mono text-4xl font-semibold text-primary mb-2">
							{ethPrice ? formatEth(ethPrice) : '...'} ETH
						</div>

						{/* Show real champions */}
						{specialWinners && (
							<>
								<StatCard
									label="Endurance Champion"
									value={specialWinners.EnduranceChampionAddr}
									icon={Award}
								/>
								<StatCard
									label="Chrono-Warrior"
									value={specialWinners.ChronoWarriorAddr}
									icon={Timer}
								/>
							</>
						)}
					</Card>
				</Container>
			</section>
		</div>
	);
}
```

---

### Example: Update Gallery

```typescript
// src/app/gallery/page.tsx

'use client';

import { useNFTList } from '@/lib/hooks/useNFTList';
import { useState } from 'react';

export default function GalleryPage() {
	const [page, setPage] = useState(0);
	const perPage = 24;

	// Fetch real NFTs from API
	const { data: nfts, isLoading, error } = useNFTList(page * perPage, perPage);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card glass className="p-12 text-center">
					<p className="text-status-error mb-4">Failed to load NFTs</p>
					<Button onClick={() => window.location.reload()}>Retry</Button>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			{/* ... */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{nfts?.map((nft, index) => (
					<NFTCard
						key={nft.TokenId}
						nft={{
							id: nft.TokenId,
							tokenId: nft.TokenId,
							name: nft.NFTName || `Cosmic Signature #${nft.TokenId}`,
							owner: nft.OwnerAddr,
							round: nft.RoundNum,
							seed: nft.Seed,
							imageUrl: `https://nfts.cosmicsignature.com/cg/images/${nft.TokenId}.jpg`,
							videoUrl: `https://nfts.cosmicsignature.com/cg/videos/${nft.TokenId}.mp4`,
							mintedAt: new Date(nft.MintedAt * 1000).toISOString(),
							customName: nft.NFTName
						}}
						delay={index * 0.05}
					/>
				))}
			</div>
		</div>
	);
}
```

---

## Step 9: Add Wallet Connection

### Update Header Component:

```typescript
// src/components/layout/Header.tsx

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function Header() {
	const { address, isConnected } = useAccount();

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b border-text-muted/10 bg-background/80 backdrop-blur-xl">
			<Container>
				<nav className="flex items-center justify-between py-4 lg:py-6">
					{/* Logo */}
					<Link href="/" className="group flex items-center space-x-3">
						{/* ... */}
					</Link>

					{/* Navigation */}
					{/* ... */}

					{/* Wallet Connect Button */}
					<div className="hidden lg:block">
						<ConnectButton.Custom>
							{({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
								const ready = mounted;
								const connected = ready && account && chain;

								return (
									<div>
										{(() => {
											if (!connected) {
												return (
													<Button onClick={openConnectModal} size="md" variant="primary">
														Connect Wallet
													</Button>
												);
											}

											if (chain.unsupported) {
												return (
													<Button onClick={openChainModal} size="md" variant="danger">
														Wrong Network
													</Button>
												);
											}

											return (
												<div className="flex items-center space-x-2">
													{/* Chain Selector */}
													<button
														onClick={openChainModal}
														className="px-3 py-2 rounded-lg bg-background-elevated border border-text-muted/10 hover:border-primary/40 transition-colors"
													>
														{chain.hasIcon && chain.iconUrl && (
															<img
																alt={chain.name ?? 'Chain icon'}
																src={chain.iconUrl}
																className="w-5 h-5"
															/>
														)}
													</button>

													{/* Account */}
													<Button onClick={openAccountModal} size="md" variant="secondary">
														{account.displayName}
														{account.displayBalance ? ` (${account.displayBalance})` : ''}
													</Button>
												</div>
											);
										})()}
									</div>
								);
							}}
						</ConnectButton.Custom>
					</div>
				</nav>
			</Container>
		</header>
	);
}
```

---

## Step 10: Implement Bidding

### Create Bidding Component:

```typescript
// src/components/game/BidForm.tsx

'use client';

import { useState } from 'react';
import { parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { useBidWithEth } from '@/lib/hooks/useBidWithEth';
import { useEthBidPrice } from '@/lib/hooks/useEthBidPrice';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function BidForm() {
	const { address, isConnected } = useAccount();
	const { data: ethPrice } = useEthBidPrice();
	const { bidWithEth, isPending, isSuccess, hash } = useBidWithEth();

	const [message, setMessage] = useState('');
	const [useRWalkNFT, setUseRWalkNFT] = useState(false);
	const [rwalkNftId, setRwalkNftId] = useState('');

	const handleBid = async () => {
		if (!ethPrice) return;

		try {
			const price = useRWalkNFT ? ethPrice / 2n : ethPrice;
			const nftId = useRWalkNFT && rwalkNftId ? parseInt(rwalkNftId) : -1;

			await bidWithEth(nftId, message, price.toString());
		} catch (error) {
			console.error('Bid failed:', error);
		}
	};

	if (!isConnected) {
		return (
			<Card glass>
				<CardContent className="p-12 text-center">
					<p className="text-text-secondary mb-6">Connect your wallet to place bids</p>
					{/* ConnectButton here */}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card glass>
			<CardHeader>
				<CardTitle>Place Your Bid</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Current Price */}
				<div className="space-y-2">
					<label className="text-sm text-text-secondary">Current Bid Price</label>
					<div className="flex items-baseline space-x-2">
						<span className="font-mono text-4xl font-semibold text-primary">
							{ethPrice ? formatEther(ethPrice) : '...'} ETH
						</span>
					</div>
				</div>

				{/* Random Walk NFT Toggle */}
				<label className="flex items-center space-x-3">
					<input
						type="checkbox"
						checked={useRWalkNFT}
						onChange={e => setUseRWalkNFT(e.target.checked)}
						className="h-5 w-5 rounded"
					/>
					<span>Use Random Walk NFT (50% discount)</span>
				</label>

				{useRWalkNFT && (
					<input
						type="number"
						value={rwalkNftId}
						onChange={e => setRwalkNftId(e.target.value)}
						placeholder="NFT ID"
						className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10"
					/>
				)}

				{/* Message */}
				<textarea
					value={message}
					onChange={e => setMessage(e.target.value)}
					maxLength={280}
					rows={3}
					placeholder="Add a message..."
					className="w-full px-4 py-3 rounded-lg bg-background-elevated border border-text-muted/10 resize-none"
				/>

				{/* Submit */}
				<Button
					size="lg"
					className="w-full"
					onClick={handleBid}
					disabled={isPending || !ethPrice}
					isLoading={isPending}
				>
					{isPending ? 'Bidding...' : 'Place ETH Bid'}
				</Button>

				{/* Success Message */}
				{isSuccess && hash && (
					<div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
						<p className="text-sm text-status-success">
							Bid successful!
							<a
								href={`https://arbiscan.io/tx/${hash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="underline ml-1"
							>
								View transaction
							</a>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
```

---

## Step 11: Add Environment Variables

### Create `.env.local`:

```env
# Blockchain
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_CHAIN_ID=42161

# Contract Addresses (update with actual addresses)
NEXT_PUBLIC_CONTRACT_GAME=0x...
NEXT_PUBLIC_CONTRACT_NFT=0x...
NEXT_PUBLIC_CONTRACT_TOKEN=0x...
NEXT_PUBLIC_CONTRACT_PRIZES_WALLET=0x...
NEXT_PUBLIC_CONTRACT_STAKING_CST=0x...
NEXT_PUBLIC_CONTRACT_STAKING_RWALK=0x...

# API
NEXT_PUBLIC_API_BASE_URL=http://161.129.67.42:7070/api/cosmicgame/
NEXT_PUBLIC_IMAGE_BASE_URL=https://nfts.cosmicsignature.com/

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

---

## Step 12: Error Handling Pattern

### Create Error Boundary:

```typescript
// src/components/ErrorBoundary.tsx

'use client';

import { Component, ReactNode } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center">
					<Card glass className="p-12 text-center max-w-md">
						<h2 className="heading-sm mb-4">Something went wrong</h2>
						<p className="text-text-secondary mb-6">
							{this.state.error?.message || 'An unexpected error occurred'}
						</p>
						<Button onClick={() => window.location.reload()}>Reload Page</Button>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}
```

---

## Step 13: Add Loading States

### Create Skeleton Components:

```typescript
// src/components/ui/Skeleton.tsx

export function Skeleton({ className }: { className?: string }) {
	return <div className={cn('animate-pulse bg-background-elevated rounded', className)} />;
}

export function NFTCardSkeleton() {
	return (
		<Card glass>
			<Skeleton className="aspect-square" />
			<div className="p-4 space-y-2">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</div>
		</Card>
	);
}
```

---

## Step 14: Transaction Flow

### Complete Transaction Pattern:

```typescript
// Example: Bidding flow with all states

const BidWithEthFlow = () => {
	const [status, setStatus] = useState<'idle' | 'approving' | 'bidding' | 'success' | 'error'>('idle');
	const [error, setError] = useState<string | null>(null);
	const { bidWithEth, isPending } = useBidWithEth();

	const handleBid = async () => {
		try {
			setStatus('bidding');
			setError(null);

			await bidWithEth(randomWalkId, message, ethAmount);

			setStatus('success');

			// Refresh data after successful bid
			queryClient.invalidateQueries({ queryKey: ['currentRound'] });
			queryClient.invalidateQueries({ queryKey: ['recentBids'] });
		} catch (err: any) {
			setStatus('error');
			setError(err.message || 'Transaction failed');
		}
	};

	return (
		<>
			<Button onClick={handleBid} disabled={status === 'bidding'} isLoading={status === 'bidding'}>
				{status === 'bidding' ? 'Bidding...' : 'Place Bid'}
			</Button>

			{status === 'success' && (
				<div className="p-4 rounded-lg bg-status-success/10 border border-status-success/20">
					<p className="text-status-success">Bid placed successfully!</p>
				</div>
			)}

			{status === 'error' && error && (
				<div className="p-4 rounded-lg bg-status-error/10 border border-status-error/20">
					<p className="text-status-error">{error}</p>
				</div>
			)}
		</>
	);
};
```

---

## Step 15: Real-Time Updates

### Polling Strategy:

```typescript
// src/lib/hooks/useRealTimeRound.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useCurrentRound } from './useCurrentRound';

export function useRealTimeRound() {
	const { data: roundNum } = useCurrentRound();

	// Poll API every 5 seconds for fresh data
	const { data: bids } = useQuery({
		queryKey: ['recentBids', roundNum],
		queryFn: () => api.getBidsByRound(roundNum!, 'desc'),
		enabled: !!roundNum,
		refetchInterval: 5000, // 5 seconds
		staleTime: 0 // Always consider stale
	});

	const { data: specialWinners } = useQuery({
		queryKey: ['specialWinners'],
		queryFn: () => api.getCurrentSpecialWinners(),
		refetchInterval: 10000 // 10 seconds
	});

	return {
		roundNum,
		bids,
		specialWinners
	};
}
```

---

## Step 16: Create "My Winnings" Page

### Example Implementation:

```typescript
// src/app/profile/winnings/page.tsx

'use client';

import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUnclaimedETH } from '@/lib/hooks/useUnclaimedETH';

export default function MyWinningsPage() {
	const { address, isConnected } = useAccount();

	// Fetch from API
	const { data: winnings } = useQuery({
		queryKey: ['winnings', address],
		queryFn: () => api.getUserWinnings(address!),
		enabled: !!address
	});

	// Fetch from blockchain
	const { data: ethBalance } = useUnclaimedETH(address);

	if (!isConnected) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Card glass className="p-12 text-center">
					<p className="text-text-secondary mb-6">Connect wallet to view winnings</p>
					{/* Connect button */}
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen section-padding">
			<Container>
				<h1 className="heading-lg mb-8">My Winnings</h1>

				{/* Unclaimed ETH */}
				{winnings?.UnclaimedETH && parseFloat(winnings.UnclaimedETH) > 0 && (
					<Card glass className="p-6 mb-6">
						<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">Unclaimed ETH</h3>
						<div className="flex items-center justify-between">
							<div className="font-mono text-3xl font-semibold text-primary">
								{formatEther(winnings.UnclaimedETH)} ETH
							</div>
							<Button size="lg" onClick={handleClaimETH}>
								Claim ETH
							</Button>
						</div>
					</Card>
				)}

				{/* Unclaimed NFTs */}
				{winnings?.UnclaimedNFTs > 0 && (
					<Card glass className="p-6 mb-6">
						<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
							Unclaimed Cosmic Signature NFTs
						</h3>
						<p className="text-text-secondary mb-4">
							You have {winnings.UnclaimedNFTs} NFT{winnings.UnclaimedNFTs > 1 ? 's' : ''} waiting for you
						</p>
						<p className="text-xs text-text-muted">
							NFTs are automatically sent to your wallet - no claim needed!
						</p>
					</Card>
				)}

				{/* Unclaimed Donated NFTs */}
				{winnings?.UnclaimedDonatedNFTs?.length > 0 && (
					<Card glass className="p-6 mb-6">
						<h3 className="font-serif text-xl font-semibold text-text-primary mb-4">
							Claimable Donated NFTs
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{winnings.UnclaimedDonatedNFTs.map((nft: any) => (
								<div key={nft.TokenId} className="p-4 rounded-lg bg-background-elevated">
									<p className="text-text-primary mb-2">
										Token #{nft.TokenId} from Round {nft.Round}
									</p>
									<Button size="sm" onClick={() => handleClaimNFT(nft)}>
										Claim NFT
									</Button>
								</div>
							))}
						</div>
					</Card>
				)}

				{/* No winnings */}
				{!winnings?.UnclaimedETH &&
					!winnings?.UnclaimedNFTs &&
					(!winnings?.UnclaimedDonatedNFTs || winnings.UnclaimedDonatedNFTs.length === 0) && (
						<Card glass className="p-12 text-center">
							<p className="text-text-secondary">No unclaimed prizes at the moment</p>
							<Button size="lg" variant="outline" className="mt-6" asChild>
								<a href="/game/play">Start Playing to Win Prizes</a>
							</Button>
						</Card>
					)}
			</Container>
		</div>
	);
}
```

---

## Testing Checklist

After integration, test:

-   [ ] Wallet connection (MetaMask, WalletConnect)
-   [ ] Network switching
-   [ ] Account switching
-   [ ] Read operations (prices, balances, NFTs)
-   [ ] Write operations (bids, stakes, claims)
-   [ ] Transaction confirmation
-   [ ] Error handling
-   [ ] Loading states
-   [ ] Gas estimation
-   [ ] API data loading
-   [ ] API error handling
-   [ ] Real-time updates
-   [ ] Pagination
-   [ ] Search and filter
-   [ ] Mobile responsiveness
-   [ ] Transaction history

---

## Common Patterns from Existing Frontend

### Pattern 1: Fetch and Display

```typescript
// From cosmicgame-frontend

const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(
	() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const result = await api.get_dashboard_info();
				setData(result);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	},
	[
		/* dependencies */
	]
);
```

### Pattern 2: Transaction Handling

```typescript
// From cosmicgame-frontend

const handleBid = async () => {
	setIsBidding(true);
	try {
		// Estimate gas
		const gasEstimate = await cosmicGameContract.estimateGas.bidWithEth(randomWalkNftId, message, {
			value: ethPrice
		});

		// Add buffer (120%)
		const gasLimit = gasEstimate.mul(12000).div(10000);

		// Submit transaction
		const tx = await cosmicGameContract.bidWithEth(randomWalkNftId, message, { value: ethPrice, gasLimit });

		// Wait for confirmation
		await tx.wait();

		// Success notification
		setNotification({ message: 'Bid placed successfully!', type: 'success' });

		// Refresh data
		await fetchData();
	} catch (error: any) {
		// Error handling
		const errorMessage = getErrorMessage(error);
		setNotification({ message: errorMessage, type: 'error' });
	} finally {
		setIsBidding(false);
	}
};
```

### Pattern 3: Real-Time Price Updates

```typescript
// Poll contract for price updates

useEffect(() => {
	const updatePrices = async () => {
		if (!cosmicGameContract) return;

		const ethPrice = await cosmicGameContract.getNextEthBidPrice();
		const cstPrice = await cosmicGameContract.getNextCstBidPrice();

		setEthPrice(ethPrice);
		setCstPrice(cstPrice);
	};

	updatePrices();
	const interval = setInterval(updatePrices, 10000); // Every 10 seconds

	return () => clearInterval(interval);
}, [cosmicGameContract]);
```

---

## Migration Priority

### Phase 1: Core Features (Week 1-2)

1. ✅ Wallet connection (RainbowKit)
2. ✅ Read current round state
3. ✅ Display real ETH/CST prices
4. ✅ Show real countdown timer
5. ✅ Display real champions
6. ✅ Bid with ETH (basic)
7. ✅ Transaction status feedback

### Phase 2: Gallery & NFTs (Week 3-4)

8. ✅ Fetch real NFT list from API
9. ✅ NFT detail page with real data
10. ✅ NFT images from API
11. ✅ NFT metadata
12. ✅ Name history
13. ✅ Transfer history

### Phase 3: User Features (Week 5-6)

14. ✅ My Tokens page
15. ✅ My Winnings page
16. ✅ My Staking page
17. ✅ User profile
18. ✅ Claim prizes
19. ✅ Withdraw ETH

### Phase 4: Advanced Features (Week 7-8)

20. ✅ Bid with CST
21. ✅ Stake/Unstake NFTs
22. ✅ Donate while bidding
23. ✅ Historical charts
24. ✅ Complete leaderboard
25. ✅ Analytics

---

## Summary

The existing **cosmicgame-frontend** is a **complete, functional Web3 application** with:

-   50+ pages
-   79 components
-   Full blockchain integration
-   Complete API integration
-   Comprehensive data tables
-   Transaction handling
-   User management
-   Admin tools

The new **cosmic-signature-web** is a **premium marketing and onboarding site** with:

-   9 pages (core features)
-   24 components
-   World-class design
-   Exceptional UX
-   Educational content
-   No blockchain yet (architecture ready)

**Recommendation**: Use both!

-   New site for acquisition and brand
-   Existing site for power users and complete functionality
-   Gradually port features with improved design

**Integration is straightforward** - the new site's architecture is clean and ready for wagmi/viem integration following the patterns documented above.
