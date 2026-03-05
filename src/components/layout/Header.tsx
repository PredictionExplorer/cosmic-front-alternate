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
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src="/logo.svg"
                alt="Cosmic Signature"
                fill
                className="object-contain transition-transform group-hover:scale-110"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-semibold text-text-primary transition-colors group-hover:text-primary">
                Cosmic Signature
                </span>
                <span className="relative flex items-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg animate-pulse-slow">
                    Beta
                  </span>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 blur-sm opacity-50"></span>
                </span>
              </div>
              <div className="text-xs text-text-secondary">
                Premium NFT Auction Game
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-1 lg:flex">
            {NAV_LINKS.map((link) => {
              if ("submenu" in link) {
                return (
                  <div key={link.label} className="relative group">
                    <button className="px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary">
                      {link.label}
                    </button>
                    <div className="absolute left-0 top-full hidden pt-2 group-hover:block">
                      <div className="rounded-lg border border-text-muted/10 bg-background-surface/95 backdrop-blur-xl p-2 shadow-luxury min-w-[200px]">
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            className={cn(
                              "block rounded px-4 py-2 text-sm transition-colors",
                              pathname === sublink.href
                                ? "bg-primary/10 text-primary"
                                : "text-text-secondary hover:bg-background-elevated hover:text-primary"
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

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    pathname === link.href
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
            className="lg:hidden p-2 text-text-primary hover:text-primary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
              <div className="py-4 space-y-1">
                {NAV_LINKS.map((link) => {
                  if ("submenu" in link) {
                    return (
                      <div key={link.label} className="space-y-1">
                        <div className="px-4 py-2 text-sm font-semibold text-text-primary">
                          {link.label}
                        </div>
                        {link.submenu.map((sublink) => (
                          <Link
                            key={sublink.href}
                            href={sublink.href}
                            className={cn(
                              "block px-6 py-2 text-sm transition-colors",
                              pathname === sublink.href
                                ? "text-primary bg-primary/10"
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
                        "block px-4 py-2 text-sm font-medium transition-colors",
                        pathname === link.href
                          ? "text-primary bg-primary/10"
                          : "text-text-secondary hover:text-primary"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="pt-4">
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
