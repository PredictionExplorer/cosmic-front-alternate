import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Web3Provider } from '@/providers/Web3Provider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ApiDataProvider } from '@/contexts/ApiDataContext';
import { TimeOffsetProvider } from '@/contexts/TimeOffsetContext';

const cormorant = Cormorant_Garamond({
	subsets: ['latin'],
	weight: ['300', '400', '600'],
	variable: '--font-cormorant',
	display: 'swap'
});

const inter = Inter({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	variable: '--font-inter',
	display: 'swap'
});

const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	weight: ['400', '500', '600'],
	variable: '--font-space-grotesk',
	display: 'swap'
});

export const metadata: Metadata = {
	title: 'Cosmic Signature | Premium NFT Auction Game',
	description:
		'Experience the intersection of art and strategy. Compete in sophisticated blockchain auctions to win premium NFTs and substantial prizes.',
	keywords: ['NFT', 'blockchain game', 'auction', 'Ethereum', 'crypto art', 'Web3 gaming'],
	authors: [{ name: 'Cosmic Signature Team' }],
	openGraph: {
		title: 'Cosmic Signature | Premium NFT Auction Game',
		description: 'Experience the intersection of art and strategy in a sophisticated blockchain auction game.',
		type: 'website'
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Cosmic Signature',
		description: 'Premium NFT Auction Game'
	}
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth">
			<body className={`${cormorant.variable} ${inter.variable} ${spaceGrotesk.variable} font-sans`}>
				<Web3Provider>
					<NotificationProvider>
						<TimeOffsetProvider>
							<ApiDataProvider>
								<div className="flex min-h-screen flex-col">
									<Header />
									<main className="flex-1 pt-[72px] lg:pt-[88px]">{children}</main>
									<Footer />
								</div>
							</ApiDataProvider>
						</TimeOffsetProvider>
					</NotificationProvider>
				</Web3Provider>
			</body>
		</html>
	);
}
