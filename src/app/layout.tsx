import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Web3Provider } from '@/providers/Web3Provider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ApiDataProvider } from '@/contexts/ApiDataContext';
import { TimeOffsetProvider } from '@/contexts/TimeOffsetContext';
import { SystemModeProvider } from '@/contexts/SystemModeContext';

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
	icons: {
		icon: [
			{ url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
			{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
		],
		apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
		other: [
			{ rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
		],
	},
	openGraph: {
		title: 'Cosmic Signature | Premium NFT Auction Game',
		description: 'Experience the intersection of art and strategy in a sophisticated blockchain auction game.',
		type: 'website',
		images: [{ url: '/logo.svg' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Cosmic Signature',
		description: 'Premium NFT Auction Game',
		images: ['/logo.svg'],
	}
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={`${cormorant.variable} ${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
				<Web3Provider>
					<NotificationProvider>
						<TimeOffsetProvider>
							<ApiDataProvider refreshInterval={5000}>
								<SystemModeProvider>
									<div className="flex min-h-screen flex-col">
										<Header />
										<main className="flex-1 pt-[72px] lg:pt-[88px]">{children}</main>
										<Footer />
									</div>
								</SystemModeProvider>
							</ApiDataProvider>
						</TimeOffsetProvider>
					</NotificationProvider>
				</Web3Provider>
			</body>
		</html>
	);
}
