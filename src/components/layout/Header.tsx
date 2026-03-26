"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, AlertTriangle } from "lucide-react";
import { Container } from "../ui/Container";
import { ConnectWalletButton } from "../web3/ConnectWalletButton";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSystemMode } from "@/contexts/SystemModeContext";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { currentMode } = useSystemMode();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-text-muted/10 bg-background/80 backdrop-blur-xl">

      {/* Maintenance Mode Banner */}
      <AnimatePresence>
        {currentMode > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-400 text-amber-950 px-4 py-2"
          >
            <Container>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">
                    {currentMode === 1
                      ? "The system will enter maintenance mode as soon as the prize claim transaction is executed. The administrator will adjust system parameters before gameplay resumes."
                      : "The system is currently in maintenance mode. The administrator is adjusting system parameters. Gameplay will resume shortly."}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold uppercase tracking-widest bg-amber-950/10 px-3 py-1 rounded-full">
                  {currentMode === 1 ? "Maintenance Pending" : "Maintenance Mode"}
                </span>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
      <Container>
        <nav className="flex items-center justify-between py-4 lg:py-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center space-x-3">
            <div className="relative h-10 w-10 lg:h-11 lg:w-11 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Cosmic Signature"
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-2xl tracking-wide text-text-primary transition-colors duration-500 group-hover:text-primary">
                Cosmic Signature
              </span>
              <div className="text-[11px] tracking-[0.2em] uppercase text-text-muted mt-0.5">
                Generative Art Collection
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-2 lg:flex">
            {NAV_LINKS.map((link) => {
              if ("submenu" in link) {
                return (
                  <div key={link.label} className="relative group">
                    <button className="relative px-4 py-2 text-[13px] font-medium uppercase tracking-[0.12em] text-text-secondary transition-colors duration-500 hover:text-primary">
                      {link.label}
                    </button>
                    <div className="absolute left-0 top-full hidden pt-3 group-hover:block">
                      <div className="border border-text-muted/10 border-t-primary/30 bg-background-surface/95 backdrop-blur-xl p-3 shadow-luxury min-w-[220px]">
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            className={cn(
                              "block px-4 py-2.5 text-[13px] tracking-wide transition-colors duration-300",
                              pathname === sublink.href
                                ? "text-primary"
                                : "text-text-secondary hover:text-primary"
                            )}
                          >
                            {sublink.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = "href" in link && pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "nav-link relative px-4 py-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-500",
                    isActive
                      ? "text-primary"
                      : "text-text-secondary hover:text-primary"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Wallet Connect Button - Fixed width to prevent shift */}
          <div
            className="hidden lg:flex lg:justify-end"
            style={{ width: "180px" }}
          >
            <ConnectWalletButton size="md" showBalance={true} />
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-primary transition-colors duration-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-text-muted/10 bg-background-surface/95 backdrop-blur-xl"
          >
            <Container>
              <div className="py-6 space-y-1">
                {NAV_LINKS.map((link) => {
                  if ("submenu" in link) {
                    return (
                      <div key={link.label} className="space-y-1">
                        <div className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-text-muted">
                          {link.label}
                        </div>
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            className={cn(
                              "block px-6 py-2.5 text-[13px] tracking-[0.06em] transition-colors duration-300",
                              pathname === sublink.href
                                ? "text-primary"
                                : "text-text-secondary hover:text-primary"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sublink.label}
                          </Link>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "block px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-300",
                        pathname === link.href
                          ? "text-primary"
                          : "text-text-secondary hover:text-primary"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="pt-6 px-4">
                  <ConnectWalletButton size="md" className="w-full" />
                </div>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
