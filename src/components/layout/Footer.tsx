import Link from 'next/link';
import { Container } from '../ui/Container';
import { Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-background-surface">
			<div className="divider-gold" />
			<Container>
				<div className="py-16 lg:py-20">
					<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
						{/* About */}
						<div className="space-y-5">
							<h3 className="font-serif text-2xl tracking-wide text-text-primary">Cosmic Signature</h3>
							<p className="text-sm text-text-secondary leading-relaxed">
								A limited collection of generative artworks born from the Three Body Problem.
								Physics-based, spectrally rendered, and verifiably unique. No AI.
							</p>
							<div className="flex space-x-5">
								<a
									href="https://x.com/CosmicSignatureNFT"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-muted hover:text-primary transition-colors duration-500"
									aria-label="Twitter"
								>
									<Twitter size={18} />
								</a>
								<a
									href="https://github.com/PredictionExplorer/Cosmic-Signature"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-muted hover:text-primary transition-colors duration-500"
									aria-label="GitHub"
								>
									<Github size={18} />
								</a>
								<a
									href="https://discord.gg/bGnPn96Qwt"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-muted hover:text-primary transition-colors duration-500"
									aria-label="Discord"
								>
									<MessageCircle size={18} />
								</a>
							</div>
						</div>

						{/* Collection */}
						<div className="space-y-5">
							<h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">Collection</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href="/gallery"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Browse Artworks
									</Link>
								</li>
								<li>
									<Link
										href="/the-art"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										How It&apos;s Made
									</Link>
								</li>
								<li>
									<Link
										href="/the-art#traits"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Traits &amp; Rarity
									</Link>
								</li>
								<li>
									<Link
										href="/stake"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Stake NFTs
									</Link>
								</li>
							</ul>
						</div>

						{/* Game */}
						<div className="space-y-5">
							<h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">Game</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href="/game/play"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Play Now
									</Link>
								</li>
								<li>
									<Link
										href="/game/how-it-works"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										How It Works
									</Link>
								</li>
								<li>
									<Link
										href="/game/prizes"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Prize Structure
									</Link>
								</li>
								<li>
									<Link
										href="/game/leaderboard"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Leaderboard
									</Link>
								</li>
							</ul>
						</div>

						{/* Resources */}
						<div className="space-y-5">
							<h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">Resources</h3>
							<ul className="space-y-3">
								<li>
									<Link
										href="/about"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										About the Project
									</Link>
								</li>
								<li>
									<Link
										href="/contracts"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Smart Contracts
									</Link>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main/docs"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										GitHub
									</a>
								</li>
								<li>
									<Link
										href="/donations"
										className="text-sm text-text-secondary hover:text-primary transition-colors duration-500"
									>
										Donations
									</Link>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="mt-16 pt-8 border-t border-text-muted/10">
						<div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
							<p className="text-[11px] tracking-[0.1em] uppercase text-text-muted">
								&copy; {currentYear} Cosmic Signature
							</p>
							<div className="flex space-x-8">
								<Link
									href="/terms"
									className="text-[11px] tracking-[0.1em] uppercase text-text-muted hover:text-primary transition-colors duration-500"
								>
									Terms
								</Link>
								<Link
									href="/privacy"
									className="text-[11px] tracking-[0.1em] uppercase text-text-muted hover:text-primary transition-colors duration-500"
								>
									Privacy
								</Link>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</footer>
	);
}
