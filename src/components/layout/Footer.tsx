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
							<h3 className="font-serif text-lg font-semibold text-text-primary">About</h3>
							<p className="text-sm text-text-secondary leading-relaxed">
								Cosmic Signature is a premium blockchain auction game where strategy meets art. Collect
								unique NFTs while competing for substantial prizes.
							</p>
							<div className="flex space-x-4">
								<a
									href="https://twitter.com"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="Twitter"
								>
									<Twitter size={20} />
								</a>
								<a
									href="https://github.com"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="GitHub"
								>
									<Github size={20} />
								</a>
								<a
									href="https://discord.com"
									target="_blank"
									rel="noopener noreferrer"
									className="text-text-secondary hover:text-primary transition-colors"
									aria-label="Discord"
								>
									<MessageCircle size={20} />
								</a>
							</div>
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

						{/* NFTs */}
						<div className="space-y-4">
							<h3 className="font-serif text-lg font-semibold text-text-primary">NFTs</h3>
							<ul className="space-y-2">
								<li>
									<Link
										href="/gallery"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Gallery
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
								<li>
									<Link
										href="/about"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										About the Art
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
										About Us
									</Link>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main/docs"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Smart Contracts Documentation
									</a>
								</li>
								<li>
									<a
										href="http://161.129.67.42:8353/black/cosmicgame"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										API Documentation
									</a>
								</li>
								<li>
									<a
										href="https://github.com/PredictionExplorer/Cosmic-Signature"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Github Repo
									</a>
								</li>
								<li>
									<a
										href="https://github.com"
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-text-secondary hover:text-primary transition-colors"
									>
										Audit Reports
									</a>
								</li>
							</ul>
						</div>
					</div>

					{/* Bottom bar */}
					<div className="mt-12 pt-8 border-t border-text-muted/10">
						<div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
							<p className="text-sm text-text-secondary">
								© {currentYear} Cosmic Signature. All rights reserved.
							</p>
							<div className="flex space-x-6">
								<Link
									href="/terms"
									className="text-sm text-text-secondary hover:text-primary transition-colors"
								>
									Terms of Service
								</Link>
								<Link
									href="/privacy"
									className="text-sm text-text-secondary hover:text-primary transition-colors"
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

