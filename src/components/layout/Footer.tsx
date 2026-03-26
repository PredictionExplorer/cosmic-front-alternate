import Link from 'next/link';
import { Container } from '../ui/Container';
import { Github, Twitter, MessageCircle } from 'lucide-react';

export function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-text-muted/10 bg-background-surface">
			<Container>
				<div className="py-12 lg:py-16">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
						{/* About */}
						<div className="space-y-4">
							<h3 className="font-serif text-lg font-semibold text-text-primary">Cosmic Signature</h3>
							<p className="text-sm text-text-secondary leading-relaxed">
								A limited collection of generative artworks born from the Three Body Problem.
								Physics-based, spectrally rendered, and verifiably unique. No AI.
							</p>
							<div className="flex space-x-4">
								<a
									href="https://x.com/CosmicSignatureNFT"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="Twitter"
								>
									<Twitter size={20} />
								</a>
								<a
									href="https://github.com/PredictionExplorer/Cosmic-Signature"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="GitHub"
								>
									<Github size={20} />
								</a>
								<a
									href="https://discord.gg/bGnPn96Qwt"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="Discord"
								>
									<MessageCircle size={20} />
								</a>
							</div>
						</div>

						{/* Collection */}
						<div className="space-y-4">
							<h3 className="font-serif text-lg font-semibold text-text-primary">Collection</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/gallery"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Browse Artworks
									</Link>
								</li>
								<li>
									<Link
										href="/the-art"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										How It&apos;s Made
									</Link>
								</li>
								<li>
									<Link
										href="/the-art#traits"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Traits &amp; Rarity
									</Link>
								</li>
								<li>
									<Link
										href="/stake"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Stake NFTs
									</Link>
								</li>
							</ul>
						</div>

						{/* Game */}
						<div className="space-y-4">
							<h3 className="font-serif text-lg font-semibold text-text-primary">Game</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/game/play"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Play Now
									</Link>
								</li>
								<li>
									<Link
										href="/game/how-it-works"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										How It Works
									</Link>
								</li>
								<li>
									<Link
										href="/game/prizes"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Prize Structure
									</Link>
								</li>
								<li>
									<Link
										href="/game/leaderboard"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Leaderboard
									</Link>
								</li>
							</ul>
						</div>

						{/* Resources */}
						<div className="space-y-4">
							<h3 className="font-serif text-lg font-semibold text-text-primary">Resources</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/about"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										About the Project
									</Link>
								</li>
								<li>
									<Link
										href="/contracts"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Smart Contracts
									</Link>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main/docs"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										GitHub
									</a>
								</li>
								<li>
									<Link
										href="/donations"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Donations
									</Link>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="mt-12 pt-8 border-t border-text-muted/10">
						<div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
							<p className="text-sm text-text-muted">
								&copy; {currentYear} Cosmic Signature. All rights reserved.
							</p>
							<div className="flex space-x-6">
								<Link
									href="/terms"
									className="text-sm text-text-muted hover:text-primary transition-colors"
								>
									Terms of Service
								</Link>
								<Link
									href="/privacy"
									className="text-sm text-text-muted hover:text-primary transition-colors"
								>
									Privacy Policy
								</Link>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</footer>
	);
}
