"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, History, Wallet, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

function ClaimSuccessInner() {
  const searchParams = useSearchParams();
  const cycleStr = searchParams.get("cycle");
  const cycleNum =
    cycleStr !== null && cycleStr !== "" ? Number.parseInt(cycleStr, 10) : Number.NaN;
  const cycleValid = Number.isFinite(cycleNum) && cycleNum >= 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient accents — black theme, no fireworks */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgb(212 175 55 / 0.45), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgb(212 175 55 / 0.12), transparent 50%)",
        }}
      />

      <section className="section-padding relative z-10">
        <Container className="max-w-2xl">
          {!cycleValid ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="heading-xl mb-4 font-serif">Claim confirmation</h1>
              <p className="body-lg text-text-secondary mb-8">
                This view needs a valid <span className="font-mono text-primary">cycle</span> query
                parameter (the cycle you just finalized on-chain).
              </p>
              <Button asChild size="lg" variant="outline">
                <Link href="/game/play">Return to Play</Link>
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-center mb-10"
              >
                <div className="inline-flex items-center justify-center gap-3 mb-6">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-primary/35 bg-background-elevated/80 shadow-luxury">
                    <CheckCircle2 className="h-8 w-8 text-status-success" strokeWidth={1.75} />
                    <Sparkles
                      className="absolute -right-1 -top-1 h-5 w-5 text-primary/90"
                      aria-hidden
                    />
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90 mb-3">
                  On-chain claim complete
                </p>
                <h1 className="heading-xl text-balance font-serif mb-4">
                  <span className="text-text-primary">Congratulations</span>
                  <span className="text-gradient block mt-2">Cycle {cycleNum}</span>
                </h1>
                <p className="body-lg text-text-secondary max-w-xl mx-auto">
                  You called <span className="font-mono text-text-primary/90">claimMainPrize</span>{" "}
                  successfully. The main Signature Allocation for this cycle is now settled; other
                  allocations may still appear under your account as indexing catches up.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.4 }}
              >
                <Card glass className="border-primary/20 shadow-luxury-lg">
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div>
                      <h2 className="font-serif text-xl text-text-primary mb-2">What to do next</h2>
                      <p className="text-sm text-text-muted leading-relaxed">
                        Review the full breakdown for this cycle, then check winnings and anchoring
                        rewards when you are ready.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button asChild className="flex-1 shadow-luxury">
                        <Link href={`/game/history/rounds/${cycleNum}`}>
                          <History className="mr-2 h-4 w-4" />
                          Cycle archive
                          <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="flex-1 border-primary/25">
                        <Link href="/account/winnings">
                          <Wallet className="mr-2 h-4 w-4" />
                          Your allocations
                        </Link>
                      </Button>
                    </div>
                    <div className="pt-2 border-t border-text-muted/10">
                      <Button asChild variant="ghost" className="w-full text-text-secondary">
                        <Link href="/game/play">Continue to live cycle</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </Container>
      </section>
    </div>
  );
}

export default function ClaimSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen section-padding flex items-center justify-center">
          <p className="text-sm text-text-muted animate-pulse">Loading…</p>
        </div>
      }
    >
      <ClaimSuccessInner />
    </Suspense>
  );
}
