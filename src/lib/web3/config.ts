/**
 * Web3 Configuration
 *
 * Configures wagmi and RainbowKit for the application.
 * Provides a modern, user-friendly wallet connection experience.
 */

"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { supportedChains } from "./chains";

/**
 * Project information for WalletConnect
 */
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    "WalletConnect Project ID not found. Get one at https://cloud.walletconnect.com"
  );
}

/**
 * Wagmi configuration with RainbowKit
 *
 * Automatically configures:
 * - MetaMask
 * - Rainbow
 * - Coinbase Wallet
 * - WalletConnect
 * - And many more popular wallets
 *
 * Supports:
 * - Arbitrum Sepolia (testnet) - Chain ID: 421614
 * - Arbitrum One (mainnet) - Chain ID: 42161
 * - Local Network (development) - Chain ID: 31337
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Cosmic Signature",
  projectId,
  // @ts-expect-error - Type mismatch between wagmi and RainbowKit chain types
  chains: supportedChains,
  ssr: true, // Enable server-side rendering support
});

/**
 * RainbowKit theme customization
 * Matches the luxury aesthetic of the application
 */
export const rainbowKitTheme = {
  /**
   * Custom theme matching the luxury gold/platinum aesthetic
   */
  custom: {
    colors: {
      accentColor: "#D4AF37", // Gold primary
      accentColorForeground: "#0A0A0F", // Dark text on gold
      actionButtonBorder: "rgba(212, 175, 55, 0.2)",
      actionButtonBorderMobile: "rgba(212, 175, 55, 0.2)",
      actionButtonSecondaryBackground: "rgba(212, 175, 55, 0.1)",
      closeButton: "#E5E4E2",
      closeButtonBackground: "rgba(229, 228, 226, 0.1)",
      connectButtonBackground: "#D4AF37",
      connectButtonBackgroundError: "#EF4444",
      connectButtonInnerBackground:
        "linear-gradient(135deg, #D4AF37 0%, #E5E4E2 100%)",
      connectButtonText: "#0A0A0F",
      connectButtonTextError: "#FFFFFF",
      connectionIndicator: "#10B981",
      downloadBottomCardBackground:
        "linear-gradient(180deg, #14141F 0%, #0A0A0F 100%)",
      downloadTopCardBackground:
        "linear-gradient(180deg, #14141F 0%, #0A0A0F 100%)",
      error: "#EF4444",
      generalBorder: "rgba(229, 228, 226, 0.1)",
      generalBorderDim: "rgba(229, 228, 226, 0.05)",
      menuItemBackground: "rgba(212, 175, 55, 0.05)",
      modalBackdrop: "rgba(10, 10, 15, 0.8)",
      modalBackground: "#14141F",
      modalBorder: "rgba(212, 175, 55, 0.2)",
      modalText: "#E5E4E2",
      modalTextDim: "rgba(229, 228, 226, 0.6)",
      modalTextSecondary: "rgba(229, 228, 226, 0.7)",
      profileAction: "rgba(212, 175, 55, 0.1)",
      profileActionHover: "rgba(212, 175, 55, 0.15)",
      profileForeground: "#14141F",
      selectedOptionBorder: "#D4AF37",
      standby: "rgba(212, 175, 55, 0.3)",
    },
    fonts: {
      body: "var(--font-inter), sans-serif",
    },
    radii: {
      actionButton: "0.75rem",
      connectButton: "0.75rem",
      menuButton: "0.75rem",
      modal: "1rem",
      modalMobile: "1rem",
    },
    shadows: {
      connectButton:
        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      dialog:
        "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
      profileDetailsAction: "0 2px 4px rgba(0, 0, 0, 0.1)",
      selectedOption: "0 0 0 2px #D4AF37",
      selectedWallet: "0 0 0 2px #D4AF37",
      walletLogo: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
  },
};
