"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ChevronDown, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function TechSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-text-muted/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <h3 className="font-serif text-xl font-semibold text-text-primary group-hover:text-primary transition-colors">
          {title}
        </h3>
        <ChevronDown
          size={20}
          className={`text-text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pb-8 text-text-secondary leading-relaxed space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TheArtPage() {
  return (
    <div className="min-h-screen">
      {/* ───── Hero ───── */}
      <section className="section-museum bg-background-surface/30">
        <Container size="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <p className="overline mb-6">Understanding the Art</p>
            <h1 className="heading-exhibition text-balance mb-8">
              How Every NFT Is
              <span className="text-gradient block">Born from Physics</span>
            </h1>
            <p className="body-museum max-w-2xl mx-auto">
              From a single on-chain seed to a one-of-a-kind artwork. No AI. No human hand.
              The Three Body Problem — one of physics&apos; oldest unsolved mysteries — becomes
              the artist.
            </p>
          </motion.div>
        </Container>
      </section>

      <div className="divider-gold mx-auto max-w-md" />

      {/* ═══════════════════════════════════════════
          Part I — The Art (For Everyone)
          ═══════════════════════════════════════════ */}

      {/* ───── What You're Looking At ───── */}
      <section className="section-museum">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="overline mb-4">Part I</p>
              <h2 className="heading-md mb-8">What You&apos;re Looking At</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-6 body-museum"
            >
              <p>
                Every Cosmic Signature NFT is a visualization of the <strong className="text-text-primary">Three Body
                Problem</strong> — one of the oldest unsolved problems in physics. Three massive celestial
                bodies orbit each other under the force of gravity. Unlike two bodies (which trace neat
                ellipses), three bodies produce trajectories that are fundamentally unpredictable.
                Tiny differences in starting conditions lead to wildly different paths. The result is
                <strong className="text-text-primary"> deterministic chaos</strong>: not random, but impossible to forecast.
              </p>

              <p>
                The artwork captures this dance. Each of the three bodies leaves a trail of spectral light
                as it moves through space. These trails are not painted — they are <strong className="text-text-primary">physically
                simulated</strong> using real Newtonian gravity and a high-precision numerical integrator
                (a physics calculator specifically designed to conserve energy perfectly over millions
                of steps) borrowed from astrophysics research.
              </p>

              <p>
                The colors span the visible light spectrum from deep violet (380 nm) to vivid red (700 nm),
                rendered using the same physics that describes how real light behaves.
              </p>

              <p>
                The result is an image and a 30-second video that are unique to each NFT&apos;s on-chain seed.
                No two seeds produce the same art. No AI is involved. No human hand touches the output.
                It is pure physics, rendered in light.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ───── What Does It Look Like ───── */}
      <section className="section-padding bg-background-surface/30">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-sm mb-8">What Does It Actually Look Like?</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-6 body-museum"
            >
              <p>
                Imagine three stars caught in each other&apos;s gravity, endlessly circling and swerving
                past one another. Now imagine they leave behind glowing trails of colored light as they
                move. Over a million moments of this gravitational dance, those trails weave together into
                dense, luminous tangles — sometimes tightly wound spirals, sometimes loose, billowing arcs
                that fill the frame.
              </p>

              <p>
                The colors are not static: they flow continuously through the visible spectrum, shifting
                from deep violet through electric blue and emerald green to warm gold and vivid red. Where
                the bodies whip past each other at high speed, the trails compress into razor-thin filaments
                of intense brightness. Where they slow and linger, the trails spread into soft, diffuse clouds.
              </p>

              <p>
                Some pieces feature a faint cosmic nebula glowing behind the orbital trails — swirling clouds
                of color generated from fractal noise, giving the artwork a sense of depth, as if the viewer
                is looking into deep space. The camera itself may slowly orbit the scene, revealing the
                three-dimensional structure of the trajectories as the viewpoint drifts.
              </p>

              <p>
                The final result has the color depth and dynamic range of professional cinema — rich blacks,
                luminous highlights, and subtle gradations that reward close inspection.
              </p>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ───── Seven Stages ───── */}
      <section className="section-museum">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="heading-md mb-4">From Seed to Art in Seven Stages</h2>
              <p className="body-museum">
                Every Cosmic Signature artwork follows the same pipeline. A hex seed (derived from
                on-chain randomness when the NFT is minted) drives the entire process.
              </p>
            </motion.div>

            <div className="space-y-10">
              {[
                {
                  num: "1",
                  title: "The Seed",
                  text: `A hex string (like 0x46205528) is fed into a SHA3-256 cryptographic hash function — a mathematical one-way scrambler that turns any input into a fixed-size fingerprint. This produces a deterministic stream of random numbers — billions of them, all perfectly reproducible from the same seed.`,
                },
                {
                  num: "2",
                  title: "The Search",
                  text: "The system generates 100,000 random three-body configurations — each with different masses, positions, and velocities for the three bodies. Every configuration is simulated forward in time using real gravitational physics. Most orbits are boring: one body escapes, the triangle collapses, or the motion is too simple. A scoring system evaluates each orbit on two criteria — how complex the motion is and how balanced the triangle shape remains — then selects the single most visually interesting orbit.",
                },
                {
                  num: "3",
                  title: "The Simulation",
                  text: "The winning configuration is simulated again at full resolution: one million timesteps of gravitational physics. The first million steps serve as a warmup (letting the orbit develop its character), and the next million steps are recorded. At each step, the position of every body in 3D space is stored.",
                },
                {
                  num: "4",
                  title: "The Camera",
                  text: "An optional camera drift is applied to the recorded trajectory. By default, the viewpoint traces a slow elliptical orbit around the scene, giving the video a cinematic quality — as if the viewer is circling the gravitational dance from a distance.",
                },
                {
                  num: "5",
                  title: "The Colors",
                  text: "Each of the three bodies is assigned a base color in the OKLab perceptual color space, with 120 degrees of hue separation between them. The colors evolve over time through slow hue drift, sine-wave modulation, and subtle jitter — so the trails shift from violet to blue to cyan to green and beyond as the simulation progresses.",
                },
                {
                  num: "6",
                  title: "The Rendering",
                  text: "This is where the physics becomes light. Every timestep, the three bodies form a triangle. The edges are drawn as anti-aliased line segments onto a spectral canvas — each pixel holds 16 wavelength bins spanning the visible spectrum (380–700 nm). Line thickness varies with velocity — fast-moving bodies leave thinner, more intense trails. Depth of field blurs distant elements. The result, after one million timesteps, is a rich spectral energy map.",
                },
                {
                  num: "7",
                  title: "The Finish",
                  text: "The spectral data is converted to visible color through AgX-style tonemapping — like a camera's automatic exposure control. Then a curated chain of post-effects: bloom, glow, chromatic dispersion, nebula cloud overlays, cinematic color grading. The final output is a 16-bit PNG (maximum color fidelity) and a 30-second H.265 video at 60 fps with 10-bit color.",
                },
              ].map((stage, i) => (
                <motion.div
                  key={stage.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0 pt-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {stage.num}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-text-primary mb-2">
                      {stage.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">{stage.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ───── Why It Matters ───── */}
      <section className="section-padding bg-background-surface/30">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <h2 className="heading-md mb-4">Why It Matters</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Deterministic",
                  text: "The same seed always produces the exact same image and video, down to every pixel. Verified by automated CI tests comparing SHA-256 hashes across builds.",
                },
                {
                  title: "Physics-Based",
                  text: "The art emerges from real gravitational simulation, not from AI models, random noise, or hand-drawn assets. The unpredictable beauty of the Three Body Problem is the artist.",
                },
                {
                  title: "No AI",
                  text: "No neural networks, no diffusion models, no training data. The entire pipeline is deterministic numerical computation: gravity, Fourier analysis, spectral optics, and signal processing.",
                },
                {
                  title: "Spectral",
                  text: "Most generative art works in RGB. Cosmic Signature works in the spectral domain — 16 bins covering the full visible light spectrum. This produces color transitions impossible with standard RGB.",
                },
                {
                  title: "Museum-Quality",
                  text: "16-bit color depth, 4K-capable resolution, H.265 video with 10-bit color. Professional film techniques: AgX tonemapping, chromatic dispersion, velocity-dependent HDR, and perceptual color grading.",
                },
                {
                  title: "Reproducible",
                  text: "The codebase is open source under CC0. Anyone can clone the repository, rebuild the Rust binary, and produce a pixel-identical copy of any artwork from its on-chain seed.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card glass className="p-6 h-full">
                    <h3 className="font-serif text-lg font-semibold text-text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{item.text}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <div className="divider-gold mx-auto max-w-md" />

      {/* ═══════════════════════════════════════════
          Traits & Rarity
          ═══════════════════════════════════════════ */}

      <section className="section-museum" id="traits">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="overline mb-4">Collector&apos;s Reference</p>
              <h2 className="heading-md mb-4">Traits &amp; Rarity</h2>
              <p className="body-museum">
                Traits are not assigned from a lookup table. They emerge naturally from the SHA3
                random stream interacting with curated probability distributions. Rarity cannot be
                gamed or pre-selected — it is a mathematical consequence of the seed.
              </p>
            </motion.div>

            {/* Always-Present Traits */}
            <div className="mb-12">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                Core Traits (Every Piece)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { trait: "Three-body orbit", desc: "Orbit shape, complexity, and symmetry vary per seed" },
                  { trait: "Spectral color", desc: "16-bin spectral rendering with OKLab color generation" },
                  { trait: "DoG bloom", desc: "Difference-of-Gaussians bloom, always applied" },
                  { trait: "AgX tonemapping", desc: "Cinema-grade with Punchy outset matrix" },
                  { trait: "Velocity HDR", desc: "Up to 8x brightness boost at high velocities" },
                  { trait: "Energy red-shift", desc: "High-energy regions shift toward warmer wavelengths" },
                ].map((item) => (
                  <div
                    key={item.trait}
                    className="p-4 rounded-lg bg-background-surface border border-text-muted/10"
                  >
                    <p className="text-sm font-semibold text-text-primary mb-1">{item.trait}</p>
                    <p className="text-xs text-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Post-Processing Effect Rarity */}
            <div className="mb-12">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                Post-Processing Effects
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                Each effect is independently toggled per seed. The enable probability determines
                how common or rare the trait is across the collection.
              </p>

              <div className="space-y-3">
                {[
                  { effect: "Micro-contrast", prob: 85, rarity: "Very Common" },
                  { effect: "Cinematic color grade", prob: 60, rarity: "Common" },
                  { effect: "Glow", prob: 55, rarity: "Common" },
                  { effect: "Edge luminance", prob: 55, rarity: "Common" },
                  { effect: "Fine texture", prob: 45, rarity: "Moderate" },
                  { effect: "Aether", prob: 35, rarity: "Uncommon" },
                  { effect: "Gaussian bloom", prob: 28, rarity: "Uncommon" },
                  { effect: "Champlevé", prob: 25, rarity: "Rare" },
                  { effect: "Opalescence", prob: 25, rarity: "Rare" },
                  { effect: "Chromatic bloom", prob: 20, rarity: "Rare" },
                  { effect: "Gradient map", prob: 18, rarity: "Rare" },
                  { effect: "Atmospheric depth", prob: 18, rarity: "Rare" },
                  { effect: "Perceptual blur", prob: 5, rarity: "Very Rare" },
                ].map((item) => (
                  <div
                    key={item.effect}
                    className="flex items-center gap-4 py-3 border-b border-text-muted/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-primary font-medium">{item.effect}</span>
                    </div>
                    <div className="w-32 hidden sm:block">
                      <div className="h-1.5 bg-background-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${item.prob}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs text-primary">{item.prob}%</span>
                      <span className="text-xs text-text-muted ml-2 hidden sm:inline">{item.rarity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rarity Combinations */}
            <div className="mb-12">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                Notable Rarity Combinations
              </h3>
              <div className="space-y-3">
                {[
                  { combo: "Champlevé + Opalescence", prob: "~6.25%" },
                  { combo: "Gradient map + Atmospheric depth", prob: "~3.24%" },
                  { combo: "All three material effects", prob: "~2.19%" },
                  { combo: "Champlevé + Opalescence + Gradient map", prob: "~1.13%" },
                  { combo: "Chromatic bloom + Perceptual blur", prob: "~1.0%" },
                  { combo: "Perceptual blur + Chromatic bloom + Gradient map", prob: "~0.18%" },
                ].map((item) => (
                  <div
                    key={item.combo}
                    className="flex items-center justify-between py-3 border-b border-text-muted/5 last:border-0"
                  >
                    <span className="text-sm text-text-primary">{item.combo}</span>
                    <span className="font-mono text-sm text-primary">{item.prob}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Look For */}
            <Card glass className="p-8">
              <h3 className="font-serif text-xl font-semibold text-text-primary mb-6">
                What to Look For as a Collector
              </h3>
              <div className="space-y-4 text-text-secondary text-sm leading-relaxed">
                <p>
                  <strong className="text-text-primary">1. Rare effect combinations</strong> — Pieces with
                  champlevé + opalescence + gradient map (roughly 1 in 90) have a distinctive metallic
                  iridescence that most pieces lack.
                </p>
                <p>
                  <strong className="text-text-primary">2. Perceptual blur</strong> — At only 5% enable rate,
                  pieces with this dreamy soft-focus quality are genuinely scarce.
                </p>
                <p>
                  <strong className="text-text-primary">3. Orbit character</strong> — Beyond effects, look at
                  the orbit itself. Tight, symmetric mandalas vs. loose, asymmetric flows represent
                  different aesthetic families.
                </p>
                <p>
                  <strong className="text-text-primary">4. Color range</strong> — Some seeds produce pieces
                  that traverse the entire visible spectrum. Others settle into a narrow color band.
                  Both are valuable but appeal to different tastes.
                </p>
                <p>
                  <strong className="text-text-primary">5. The generation log</strong> — Every NFT&apos;s generation_log.json
                  records exactly which effects were enabled and at what parameter values. This provides
                  a definitive trait list for any piece.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <div className="divider-gold mx-auto max-w-md" />

      {/* ═══════════════════════════════════════════
          Part II — Technical Deep Dive
          ═══════════════════════════════════════════ */}

      <section className="section-museum">
        <Container size="lg">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <p className="overline mb-4">Part II</p>
              <h2 className="heading-md mb-4">Technical Deep Dive</h2>
              <p className="body-museum">
                For the technically curious. Each section below expands to reveal the full
                specification with exact constants, algorithms, and source file references.
              </p>
            </motion.div>

            <div>
              <TechSection title="Architecture Overview">
                <p>
                  The system is implemented as a single Rust binary (<code className="text-primary/80 text-sm">three_body_problem</code>)
                  with no runtime dependencies beyond FFmpeg for video encoding. The codebase is tuned
                  for release builds with LTO, single codegen unit, <code className="text-primary/80 text-sm">panic = abort</code>,
                  and native CPU flags (AVX2 + FMA on x86_64).
                </p>
                <p>
                  The pipeline flows: Seed → SHA3 RNG → Generate 100K body triples → Parallel Borda
                  evaluation → Re-simulate at full resolution → Camera drift → OKLab colors →
                  Pass 1 (spectral accumulation + histogram) → Tonemapping analysis → Pass 2
                  (full render + post-effects + video frames) → FFmpeg H.265 encoding → Output.
                </p>
              </TechSection>

              <TechSection title="Seeding & Deterministic RNG">
                <p>
                  The RNG is built on SHA3-256 (Keccak). Given an initial seed, it produces an infinite
                  deterministic byte stream. The process: initialize with <code className="text-primary/80 text-sm">hasher.update(seed)</code>,
                  then extend by hashing seed + previous buffer when exhausted.
                </p>
                <p>
                  <code className="text-primary/80 text-sm">next_f64() = next_u64() as f64 / u64::MAX as f64</code> — uniform
                  in [0, 1). This stream drives all randomness: body masses, positions, velocities,
                  color generation, effect randomization, drift parameters.
                </p>
                <p>
                  Why SHA3? Cryptographic hash functions provide excellent statistical properties (no
                  detectable patterns, full avalanche effect). A single bit change in the seed produces
                  a completely different output stream.
                </p>
              </TechSection>

              <TechSection title="Physics Simulation">
                <p>
                  Classical Newtonian pairwise gravity with G = 9.8. Each body has mass (scalar),
                  position (3D), velocity (3D), acceleration (3D). Before integration, bodies are shifted
                  to the centre-of-mass frame.
                </p>
                <p>
                  The integrator is a <strong className="text-text-primary">4th-order Yoshida symplectic scheme</strong> — designed
                  for Hamiltonian systems. Unlike Runge-Kutta or Euler, symplectic integrators preserve
                  geometric structure and do not artificially gain or lose energy over millions of
                  timesteps. Timestep dt = 0.001.
                </p>
                <p>
                  Recording: 1,000,000 warmup steps (developing chaotic dynamics), then 1,000,000
                  recorded steps with positions stored. Total simulated time: 2,000 time units.
                </p>
              </TechSection>

              <TechSection title="Orbit Selection: Borda Search">
                <p>
                  From 100,000 random initial conditions (mass 100–300, position ±300, velocity ±1),
                  candidates are evaluated in parallel using rayon. Quick filters reject unbound systems
                  (energy &gt; 10), degenerate configurations (|L| &lt; 10), and escaping bodies.
                </p>
                <p>
                  Two quality metrics: <strong className="text-text-primary">Non-chaoticness</strong> (FFT standard deviation
                  of distance signal — lower values = more chaotic = better) and <strong className="text-text-primary">Equilateralness</strong> (mean
                  of min/max side ratio — balanced triangles score higher).
                </p>
                <p>
                  Borda aggregation: <code className="text-primary/80 text-sm">score = 0.75 × chaos_points + 11.0 × equilateralness_points</code>.
                  Equilateralness dominates by ~15x — strongly favoring balanced, visually pleasing
                  triangles. Among equally balanced orbits, the most chaotic (most visually intricate)
                  wins.
                </p>
              </TechSection>

              <TechSection title="Spectral Rendering Pipeline">
                <p>
                  Each pixel stores 16 energy values — one per wavelength bin spanning 380–700 nm
                  (20 nm per bin). At each timestep, triangle edges are drawn as anti-aliased spectral
                  line segments.
                </p>
                <p>
                  Each body&apos;s OKLab hue maps to a dominant wavelength. Energy deposits use fractional
                  bin interpolation. Gaussian falloff with velocity-dependent sigma (fast = thin,
                  bright; slow = wide, soft). Depth of field and exponential depth fade simulate
                  real camera optics.
                </p>
                <p>
                  Velocity HDR boosts energy up to 8x at high speeds (threshold 0.15). After accumulation,
                  high-energy pixels undergo spectral red-shift (threshold 0.08, strength 0.75).
                  SPD-to-RGB conversion uses Bruton-style basis functions with optional radial
                  chromatic dispersion.
                </p>
              </TechSection>

              <TechSection title="Tonemapping & Exposure">
                <p>
                  Two-pass architecture. Pass 1 samples 240 frames for histogram analysis — percentile-based
                  black/white points, exposure scale with highlight budget governor.
                </p>
                <p>
                  AgX-style sigmoid tonemapping: premultiply by exposure, linear stretch, log-domain
                  with matrix color rotation, spline curve (paper white 0.92, rolloff 2.25), matrix
                  inverse, and highlight shoulder compression. The &quot;Punchy&quot; outset matrix (default)
                  was tuned specifically for spectral accumulation input.
                </p>
              </TechSection>

              <TechSection title="Post-Processing Effects">
                <p>
                  A configurable chain of effects after SPD-to-RGB conversion: Gaussian bloom,
                  DoG bloom, glow, chromatic bloom, perceptual blur (OKLab space), micro-contrast,
                  gradient map (15 curated palettes), cinematic grade, opalescence, champlevé,
                  aether, edge luminance, atmospheric depth, and fine texture.
                </p>
                <p>
                  Nebula clouds use multi-octave OpenSimplex2S noise (fBm-style) colored with the
                  scene palette. Effect parameters are randomized per-seed from curated distributions
                  via <code className="text-primary/80 text-sm">RandomizableEffectConfig</code>, with resolved values logged in
                  <code className="text-primary/80 text-sm">generation_log.json</code> for full reproducibility.
                </p>
              </TechSection>

              <TechSection title="Video Generation & Determinism">
                <p>
                  60 fps, 1,800 frames (~30 seconds). H.265 (libx265), CRF 17, yuv422p10le (10-bit 4:2:2),
                  preset &quot;slower&quot;, tune &quot;grain&quot;. Raw 16-bit RGB frames are piped directly to FFmpeg via stdin.
                </p>
                <p>
                  Determinism is guaranteed: SHA3-256 chaining is platform-independent, IEEE 754
                  double-precision arithmetic, fixed accumulation order, parallel row partitioning
                  produces identical results to serial. CI verification compares SHA-256 hashes of
                  output images against known baselines.
                </p>
              </TechSection>
            </div>

            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com/PredictionExplorer/Cosmic-Signature/tree/main"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2" size={16} />
                  View Full Source Code (CC0)
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ───── CTA ───── */}
      <section className="section-padding bg-background-surface/30">
        <Container size="md">
          <Card glass className="p-12 text-center">
            <h2 className="heading-sm mb-6">See the Art for Yourself</h2>
            <p className="body-museum mb-8 max-w-lg mx-auto">
              Browse the collection to experience these artworks firsthand. Each piece tells a
              unique story of gravitational chaos, captured in spectral light.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/gallery">
                  View the Collection
                  <ArrowRight className="ml-2" size={18} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">About the Project</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
}
