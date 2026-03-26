"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Shield,
  Fingerprint,
  Atom,
  Eye,
  Clock,
  Gem,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NFTCard } from "@/components/nft/NFTCard";
import { useApiData } from "@/contexts/ApiDataContext";
import api, { getAssetsUrl } from "@/services/api";
import { useApiQuery } from "@/hooks/useApiQuery";
import { safeTimestamp } from "@/lib/utils";

export default function Home() {
  const { dashboardData } = useApiData();

  const totalNFTs =
    ((dashboardData?.MainStats as Record<string, unknown>)
      ?.NumCSTokenMints as number) || 0;

  const contractBalance = (dashboardData?.CosmicGameBalanceEth as number) || 0;

  const { data: featuredNFTsRaw, isLoading: isLoadingNFTs } = useApiQuery(
    "home-featured-nfts",
    async () => {
      const nfts = await api.getCSTList();
      if (!nfts || !Array.isArray(nfts)) return [];
      return nfts
        .sort((a, b) => (b.TokenId || 0) - (a.TokenId || 0))
        .slice(0, 6)
        .map((nft) => ({
          id: nft.TokenId || 0,
          tokenId: nft.TokenId || 0,
          name: `Cosmic Signature #${nft.TokenId}`,
          customName: nft.TokenName || undefined,
          seed: `0x${nft.Seed}`,
          imageUrl: getAssetsUrl(`images/new/cosmicsignature/0x${nft.Seed}.png`),
          owner: nft.WinnerAddr || "0x0",
          round: nft.RoundNum || 0,
          mintedAt: safeTimestamp(nft as unknown as Record<string, unknown>),
          attributes: [] as unknown[],
        }));
    },
  );
  const featuredNFTs = featuredNFTsRaw ?? [];

  const heroNFT = useMemo(() => featuredNFTs[0] ?? null, [featuredNFTs]);

  return (
    <div className="overflow-hidden">
      {/* ───── Hero ───── */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background — large NFT as ambient backdrop */}
        <div className="absolute inset-0 overflow-hidden">
          {heroNFT && (
            <Image
              src={heroNFT.imageUrl}
              alt=""
              fill
              className="object-cover opacity-[0.07] scale-110 blur-sm"
              unoptimized
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-radial from-primary/3 via-transparent to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p className="overline mb-8">Generative Art from the Three Body Problem</p>
              <h1 className="heading-exhibition text-balance mb-8">
                Born from Physics.
                <span className="block text-gradient mt-1">One of a Kind.</span>
              </h1>
              <p className="body-museum max-w-2xl mx-auto text-balance">
                Each Cosmic Signature artwork is a unique visualization of gravitational chaos&mdash;three
                celestial bodies dancing under Newtonian gravity, rendered in spectral light.
                No AI. No human hand. Pure physics, captured forever.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <Button size="xl" asChild>
                <Link href="/gallery">
                  View the Collection
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/the-art">How It&apos;s Made</Link>
              </Button>
            </motion.div>

            {/* Quiet stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex items-center justify-center gap-12 pt-8"
            >
              <div className="text-center">
                <div className="font-mono text-2xl font-semibold text-primary">{totalNFTs}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Artworks Minted</div>
              </div>
              <div className="h-8 w-px bg-text-muted/20" />
              <div className="text-center">
                <div className="font-mono text-2xl font-semibold text-primary">16-bit</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Color Depth</div>
              </div>
              <div className="h-8 w-px bg-text-muted/20" />
              <div className="text-center">
                <div className="font-mono text-2xl font-semibold text-primary">100K</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Orbits Evaluated</div>
              </div>
            </motion.div>
          </div>
        </Container>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-px bg-gradient-to-b from-primary/60 to-transparent"
          />
        </motion.div>
      </section>

      {/* ───── The Art ───── */}
      <section className="section-museum">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="overline mb-4">What You&apos;re Looking At</p>
              <h2 className="heading-lg text-balance mb-8">
                The Three Body Problem,
                <span className="text-gradient block">Rendered in Light</span>
              </h2>
              <div className="space-y-5 body-museum">
                <p>
                  Every Cosmic Signature is a visualization of one of the oldest unsolved
                  problems in physics. Three massive celestial bodies orbit each other under
                  the force of gravity, producing trajectories that are fundamentally
                  unpredictable&mdash;deterministic chaos.
                </p>
                <p>
                  The artwork captures this dance. Each body leaves a trail of spectral light
                  as it moves through space. These trails are not painted&mdash;they are
                  physically simulated using real Newtonian gravity and a high-precision
                  symplectic integrator borrowed from astrophysics research.
                </p>
                <p>
                  The colors span the visible light spectrum from deep violet (380 nm) to
                  vivid red (700 nm), rendered using 16 spectral wavelength bins&mdash;the same
                  physics that describes how real light behaves.
                </p>
              </div>
              <div className="mt-8">
                <Button variant="outline" asChild>
                  <Link href="/the-art">
                    Explore the Full Process
                    <ArrowRight className="ml-2" size={16} />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-5"
            >
              {[
                {
                  icon: Atom,
                  title: "Physics-Based",
                  text: "Real Newtonian gravitational simulation. A 4th-order Yoshida symplectic integrator ensures energy conservation over millions of timesteps.",
                },
                {
                  icon: Eye,
                  title: "Spectral Rendering",
                  text: "16 wavelength bins spanning 380–700 nm. Color mixing follows physical light behavior, not standard RGB.",
                },
                {
                  icon: Fingerprint,
                  title: "Deterministic & Verifiable",
                  text: "Same seed, same art — pixel for pixel. Anyone can verify by running the open-source code with the on-chain seed.",
                },
                {
                  icon: Shield,
                  title: "No AI. No Human Hand.",
                  text: "Zero neural networks, zero training data. The entire pipeline is deterministic computation: gravity, Fourier analysis, spectral optics.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                >
                  <Card glass className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 rounded-lg bg-primary/8 p-3">
                        <item.icon size={22} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-text-primary mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ───── Divider ───── */}
      <div className="divider-gold mx-auto max-w-md" />

      {/* ───── How It's Made — 7 Stages ───── */}
      <section className="section-museum">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="overline mb-4">From Seed to Artwork</p>
            <h2 className="heading-lg text-balance mb-6">Seven Stages of Creation</h2>
            <p className="body-museum max-w-2xl mx-auto">
              Every Cosmic Signature follows the same pipeline. A hex seed derived from
              on-chain randomness drives the entire process.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              {
                num: "01",
                title: "The Seed",
                desc: "A hex string from on-chain randomness is fed into SHA3-256, producing a deterministic stream of billions of random numbers — all perfectly reproducible.",
              },
              {
                num: "02",
                title: "The Search",
                desc: "100,000 random three-body configurations are generated and simulated. A scoring system evaluates chaos and balance, selecting the single most visually compelling orbit.",
              },
              {
                num: "03",
                title: "The Simulation",
                desc: "The winning configuration is simulated at full resolution: one million warmup steps, then one million recorded steps of gravitational physics in 3D space.",
              },
              {
                num: "04",
                title: "The Camera",
                desc: "A slow elliptical camera drift orbits the scene, revealing the three-dimensional structure of the trajectories — cinematic parallax for the 30-second video.",
              },
              {
                num: "05",
                title: "The Colors",
                desc: "Each body receives a base color in OKLab perceptual color space, with 120° hue separation. Colors evolve through drift, modulation, and jitter across the spectrum.",
              },
              {
                num: "06",
                title: "The Rendering",
                desc: "Every timestep, triangle edges are drawn as spectral energy across 16 wavelength bins (380–700 nm). Velocity HDR, depth of field, and energy red-shift create rich detail.",
              },
              {
                num: "07",
                title: "The Finish",
                desc: "AgX-style tonemapping, bloom, chromatic dispersion, nebula overlays, and cinematic grading. Output: 16-bit PNG and 30-second H.265 video at 60 fps, 10-bit color.",
              },
            ].map((stage, i) => (
              <motion.div
                key={stage.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
              >
                <div className="h-full">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-mono text-3xl font-light text-primary/40">
                      {stage.num}
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-text-primary">
                      {stage.title}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button variant="outline" asChild>
              <Link href="/the-art">
                Read the Full Technical Guide
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* ───── Divider ───── */}
      <div className="divider-gold mx-auto max-w-md" />

      {/* ───── Featured Collection ───── */}
      <section className="section-museum bg-background-surface/30">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="overline mb-4">Recent Works</p>
            <h2 className="heading-lg text-balance mb-6">From the Collection</h2>
            <p className="body-museum max-w-2xl mx-auto">
              Each piece is a unique record of gravitational chaos — selected from
              100,000 candidates, rendered in spectral light.
            </p>
          </motion.div>

          <div style={{ minHeight: "500px" }}>
            {isLoadingNFTs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-pulse">
                    <div className="art-frame rounded-sm overflow-hidden">
                      <div className="aspect-square bg-background-elevated" />
                      <div className="p-5 space-y-3 border-t border-text-muted/5">
                        <div className="h-4 bg-background-elevated rounded w-3/4" />
                        <div className="h-3 bg-background-elevated rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredNFTs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredNFTs.map((nft, index) => (
                  <NFTCard
                    key={`nft-${nft.id}`}
                    nft={nft}
                    delay={index * 0.08}
                    priority={index < 3}
                    size="large"
                  />
                ))}
              </div>
            ) : (
              <Card glass className="p-16 text-center">
                <p className="text-text-secondary">
                  The first artworks have not yet been minted.
                </p>
              </Card>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">
                View Full Collection
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* ───── What Makes Each Piece Unique ───── */}
      <section className="section-museum">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="overline mb-4">Collector&apos;s Guide</p>
            <h2 className="heading-lg text-balance mb-6">What Makes Each Piece Unique</h2>
            <p className="body-museum max-w-2xl mx-auto">
              Every seed produces different masses, starting positions, velocities, color palettes,
              post-processing effects, and camera paths. Rarity emerges naturally from the
              mathematics — it cannot be gamed or pre-selected.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Orbit Character",
                desc: "The chaos metric and equilateralness score shape whether the piece is a tight symmetric mandala or a loose, expansive flow. Both are valid aesthetic families.",
              },
              {
                title: "Color Temperature",
                desc: "Base hue and wave frequency create natural families — cool pieces dominated by violets and cyans, warm pieces in golds and reds, or full-spectrum traversals.",
              },
              {
                title: "Trail Density",
                desc: "Alpha variation per body ({1/13M, 1/15M, 1/17M}) combined with orbit dynamics creates pieces ranging from dense luminous tangles to sparse, delicate tracery.",
              },
              {
                title: "Rare Effects",
                desc: "Champlevé (25%), Opalescence (25%), and Perceptual Blur (5%) are among the rarest visual traits. Some combinations appear in fewer than 1% of all pieces.",
              },
              {
                title: "Nebula Clouds",
                desc: "When enabled, swirling clouds of fractal noise glow beneath the orbital trails — giving the artwork a sense of deep-space depth and atmosphere.",
              },
              {
                title: "Cinematic Grade",
                desc: "Vibrance, clarity, tone curves, cool shadow tints, warm highlight tints, and vignette — a full color grading suite borrowed from professional film post-production.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <Card glass className="p-7 h-full">
                  <h3 className="font-serif text-lg font-semibold text-text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button variant="outline" asChild>
              <Link href="/the-art#traits">
                Full Traits &amp; Rarity Guide
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* ───── Divider ───── */}
      <div className="divider-gold mx-auto max-w-md" />

      {/* ───── Collector Value ───── */}
      <section className="section-museum bg-background-surface/30">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="overline mb-4">For Collectors</p>
            <h2 className="heading-lg text-balance mb-6">Why This Collection Matters</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {[
              {
                icon: Clock,
                title: "Naturally Limited Supply",
                desc: "The bidding timer increases exponentially after each bid. As rounds grow longer, new artworks become increasingly rare. There is no arbitrary cap — scarcity emerges from the mathematics of the game itself.",
              },
              {
                icon: Fingerprint,
                title: "Verifiable Provenance",
                desc: "Every artwork's on-chain seed is permanently recorded. Anyone can clone the open-source repository, rebuild the Rust binary, and reproduce the exact artwork pixel-for-pixel. Provenance is mathematical, not institutional.",
              },
              {
                icon: Gem,
                title: "Museum-Quality Output",
                desc: "16-bit PNG images with full spectral fidelity. 30-second H.265 videos at 60 fps with 10-bit color depth. AgX tonemapping from professional cinema. These are archival-quality digital artworks.",
              },
              {
                icon: Shield,
                title: "Open Source & CC0",
                desc: "The entire generation codebase is released under CC0 1.0 — public domain. Smart contracts are audited and verified on-chain. Complete transparency at every layer.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 rounded-lg bg-primary/8 p-4">
                    <item.icon size={28} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ───── How to Acquire ───── */}
      <section className="section-museum">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="overline mb-4">Acquiring Artworks</p>
            <h2 className="heading-lg text-balance mb-6">Two Paths to Ownership</h2>
            <p className="body-museum max-w-2xl mx-auto">
              Collectors can acquire Cosmic Signature artworks through the on-chain game
              or by purchasing from other collectors on the secondary market.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card glass className="p-8 lg:p-10 h-full">
                <div className="inline-flex items-center justify-center rounded-lg bg-primary/8 p-4 mb-6">
                  <Atom size={28} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-4">
                  Through the Game
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  New artworks are minted when bidding rounds conclude. Place bids with ETH or CST tokens.
                  Multiple winners per round — the last bidder claims the main prize, but every
                  participant has chances through raffles, champion prizes, and staking rewards.
                </p>
                <Button asChild>
                  <Link href="/game/how-it-works">
                    Learn About the Game
                    <ArrowRight className="ml-2" size={16} />
                  </Link>
                </Button>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card glass className="p-8 lg:p-10 h-full">
                <div className="inline-flex items-center justify-center rounded-lg bg-primary/8 p-4 mb-6">
                  <Gem size={28} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-text-primary mb-4">
                  Secondary Market
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  Browse the existing collection and acquire pieces directly from current owners.
                  No game participation required. Every artwork carries full on-chain provenance
                  — seed, minting round, original winner, and complete ownership history.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/gallery">
                    Browse the Collection
                    <ArrowRight className="ml-2" size={16} />
                  </Link>
                </Button>
              </Card>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ───── Divider ───── */}
      <div className="divider-gold mx-auto max-w-md" />

      {/* ───── About the Game (condensed) ───── */}
      <section className="section-museum bg-background-surface/30">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="overline mb-4">The Mechanism</p>
            <h2 className="heading-lg text-balance mb-6">How New Artworks Are Created</h2>
            <p className="body-museum max-w-3xl mx-auto">
              Cosmic Signature artworks are minted through an on-chain bidding game on Arbitrum.
              The game creates natural scarcity — as the collection grows, new works become
              exponentially harder to produce.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-8">
            {[
              {
                num: "01",
                title: "Bidding Opens",
                desc: "Each round begins with a Dutch auction — the bid price starts high and decreases over time. Bidders can use ETH or CST tokens.",
              },
              {
                num: "02",
                title: "The Timer Extends",
                desc: "Every bid resets a countdown timer. The timer increment grows with each round, making later rounds progressively longer and new artworks increasingly rare.",
              },
              {
                num: "03",
                title: "Multiple Winners",
                desc: "When the timer expires, prizes are distributed: 25% ETH to the last bidder, 8% to the Chrono-Warrior champion, plus raffles, staking rewards, and 7% to Protocol Guild (Ethereum public goods).",
              },
              {
                num: "04",
                title: "Artworks Minted",
                desc: "New Cosmic Signature NFTs are minted and distributed to winners. Each artwork's seed is derived from blockchain entropy — unique, unpredictable, and permanently recorded on-chain.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <span className="font-mono text-2xl font-light text-primary/40">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild>
              <Link href="/game/play">
                Enter the Game
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/game/how-it-works">Full Game Mechanics</Link>
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* ───── Trust ───── */}
      <section className="section-padding">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card glass className="p-10 md:p-16 text-center">
              <p className="overline mb-6">Trust &amp; Transparency</p>
              <h2 className="heading-md text-balance mb-10">
                Built on Openness
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12">
                {[
                  { label: "Audited Contracts", sub: "Certora verified" },
                  { label: "Open Source", sub: "CC0 1.0 Public Domain" },
                  { label: "On Arbitrum", sub: "Low-cost L2" },
                  { label: "7% to Public Goods", sub: "Protocol Guild" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="font-serif text-lg font-semibold text-text-primary mb-1">
                      {item.label}
                    </div>
                    <div className="text-xs text-text-muted">{item.sub}</div>
                  </div>
                ))}
              </div>

              <p className="body-museum max-w-2xl mx-auto mb-10">
                Zero creator ETH extraction. All funds flow to players, stakers, and public goods.
                The contract balance currently holds{" "}
                <span className="text-primary font-mono font-semibold">
                  {contractBalance.toFixed(2)} ETH
                </span>
                .
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="outline" size="lg" asChild>
                  <a
                    href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2" size={16} />
                    View Source Code
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contracts">Smart Contracts</Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
