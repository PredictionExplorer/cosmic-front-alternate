import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { Web3Provider } from '@/providers/Web3Provider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ApiDataProvider } from '@/contexts/ApiDataContext';
import { TimeOffsetProvider } from '@/contexts/TimeOffsetContext';
import { SystemModeProvider } from '@/contexts/SystemModeContext';
import { isLandingHost } from '@/lib/hostRouting';

const cormorant = Cormorant_Garamond({
	subsets: ['latin'],
	weight: ['300', '400', '600'],
	variable: '--font-cormorant',
	display: 'swap'
});

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
	variable: '--font-jakarta',
	display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600'],
	variable: '--font-jetbrains',
	display: 'swap'
});

export const metadata: Metadata = {
	title: 'Cosmic Signature | Generative Art from Physics',
	description:
		'A limited collection of generative artworks born from the Three Body Problem — real gravitational physics, spectral light rendering, and deterministic chaos. No AI. Museum-quality digital art with verifiable provenance.',
	keywords: ['generative art', 'Three Body Problem', 'NFT', 'digital art', 'physics art', 'spectral rendering', 'art collection', 'Ethereum'],
	authors: [{ name: 'Cosmic Signature' }],
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
		title: 'Cosmic Signature | Generative Art from Physics',
		description: 'A limited collection of generative artworks visualizing the Three Body Problem — real physics, spectral rendering, verifiable provenance. No AI.',
		type: 'website',
		images: [{ url: '/logo.svg' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Cosmic Signature',
		description: 'Generative art born from the Three Body Problem. Physics as artist. Each piece provably unique.',
		images: ['/logo.svg'],
	}
};

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const requestHeaders = await headers();
	const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
	const showLandingChrome = isLandingHost(host);

	return (
		<html lang="en" className="scroll-smooth" suppressHydrationWarning>
			<body className={`${cormorant.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
				<Web3Provider>
					<NotificationProvider>
						<TimeOffsetProvider>
							<ApiDataProvider refreshInterval={5000}>
								<SystemModeProvider>
									<GlobalErrorHandler />
									<div className="flex min-h-screen flex-col">
										{!showLandingChrome && <Header />}
										<ErrorBoundary>
											<main className={`flex-1 ${showLandingChrome ? '' : 'pt-[72px] lg:pt-[88px]'}`}>{children}</main>
										</ErrorBoundary>
										{!showLandingChrome && <Footer />}
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
