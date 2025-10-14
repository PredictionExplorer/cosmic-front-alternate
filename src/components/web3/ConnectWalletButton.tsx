/**
 * Connect Wallet Button
 *
 * A beautifully styled wallet connection button that integrates with RainbowKit.
 * Matches the luxury aesthetic of the application while providing excellent UX.
 *
 * Features:
 * - Multi-wallet support (MetaMask, Coinbase, WalletConnect, Rainbow, and more)
 * - Shows connected address with ENS support
 * - Displays account balance
 * - Chain switching
 * - Disconnect option
 * - Beautiful modal with glassmorphism effects
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCosmicTokenBalance } from "@/hooks/useCosmicToken";

/**
 * Props for ConnectWalletButton
 */
interface ConnectWalletButtonProps {
  /** Button size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show full address or shortened */
  showFullAddress?: boolean;
  /** Show account balance */
  showBalance?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * ConnectWalletButton Component
 *
 * Wraps RainbowKit's ConnectButton with custom styling that matches
 * the luxury aesthetic of Cosmic Signature.
 *
 * @example
 * ```tsx
 * <ConnectWalletButton size="lg" showBalance={true} />
 * ```
 */
export function ConnectWalletButton({
  size = "md",
  showBalance = true,
  className,
}: ConnectWalletButtonProps) {
  // Get CST token balance
  const { formattedBalance: cstBalance, isLoading: cstLoading } = useCosmicTokenBalance();
  
  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);
  
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        
        // Copy address to clipboard
        const copyAddress = () => {
          if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setIsDropdownOpen(false);
          }
        };

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
            className={className}
          >
            {(() => {
              if (!connected) {
                // Not connected - show connect button
                return (
                  <Button size={size} onClick={openConnectModal} type="button">
                    <Wallet className="mr-2" size={20} />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                // Wrong network - show switch button
                return (
                  <Button
                    size={size}
                    variant="danger"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong Network
                  </Button>
                );
              }

              // Connected - show account info with dropdown
              return (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    size={size}
                    variant="outline"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    type="button"
                    className="group min-w-[160px]"
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      {/* Connection Indicator */}
                      <div className="relative flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-status-success" />
                        <div className="absolute inset-0 h-2 w-2 rounded-full bg-status-success animate-ping opacity-75" />
                      </div>

                      {/* Address or ENS */}
                      <span className="font-mono text-sm truncate max-w-[100px]">
                        {account.displayName}
                      </span>

                      {/* Dropdown Icon */}
                      <ChevronDown
                        size={16}
                        className={`text-text-secondary group-hover:text-primary transition-all flex-shrink-0 ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </Button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-text-muted/10 bg-background-surface/95 backdrop-blur-xl shadow-luxury overflow-hidden z-50">
                      {/* Balances Section */}
                      {showBalance && (
                        <div className="p-4 border-b border-text-muted/10 space-y-3">
                          <div className="text-xs text-text-secondary uppercase tracking-wider mb-2">
                            Balances
                          </div>
                          
                          {/* ETH Balance */}
                          {account.balanceFormatted && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-elevated border border-text-muted/10">
                              <span className="text-sm text-text-secondary">ETH</span>
                              <span className="font-mono text-sm text-text-primary font-medium">
                                {parseFloat(account.balanceFormatted).toFixed(4)}
                              </span>
                            </div>
                          )}
                          
                          {/* CST Balance */}
                          {!cstLoading && (
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-elevated border border-primary/20">
                              <span className="text-sm text-primary font-medium">CST</span>
                              <span className="font-mono text-sm text-text-primary font-medium">
                                {parseFloat(cstBalance).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="p-2">
                        <button
                          onClick={copyAddress}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-background-elevated rounded-lg transition-colors"
                        >
                          <Copy size={16} />
                          Copy Address
                        </button>
                        
                        <button
                          onClick={() => {
                            openAccountModal();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-background-elevated rounded-lg transition-colors"
                        >
                          <ExternalLink size={16} />
                          View Account
                        </button>
                      </div>

                      {/* Disconnect Button */}
                      <div className="p-2 border-t border-text-muted/10">
                        <ConnectButton.Custom>
                          {({ openAccountModal: _, ...props }) => (
                            <button
                              onClick={() => {
                                if ('account' in props && props.account) {
                                  openAccountModal();
                                  setIsDropdownOpen(false);
                                }
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                            >
                              <LogOut size={16} />
                              Disconnect
                            </button>
                          )}
                        </ConnectButton.Custom>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

/**
 * Compact version for mobile/header
 */
export function ConnectWalletButtonCompact({
  className,
}: {
  className?: string;
}) {
  return (
    <ConnectWalletButton
      size="sm"
      showBalance={false}
      showFullAddress={false}
      className={className}
    />
  );
}

/**
 * Full version with balance
 */
export function ConnectWalletButtonFull({ className }: { className?: string }) {
  return (
    <ConnectWalletButton
      size="lg"
      showBalance={true}
      showFullAddress={false}
      className={className}
    />
  );
}
