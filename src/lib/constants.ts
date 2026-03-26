// Navigation Links Configuration

export const NAV_LINKS = [
  { href: "/gallery", label: "Collection" },
  { href: "/the-art", label: "The Art" },
  { href: "/about", label: "About" },
  {
    label: "Game",
    submenu: [
      { href: "/game/play", label: "Play Now" },
      { href: "/game/how-it-works", label: "How It Works" },
      { href: "/game/prizes", label: "Prize Structure" },
      { href: "/game/leaderboard", label: "Leaderboard" },
      { href: "/game/statistics", label: "Statistics" },
      { href: "/game/history/rounds", label: "Round History" },
    ],
  },
  { href: "/stake", label: "Stake" },
  { href: "/donations", label: "Donations" },
  { href: "/contracts", label: "Contracts" },
] as const;

// Social Media Links Configuration

export const SOCIAL_LINKS = {
  twitter: "https://x.com/CosmicSignatureNFT",
  discord: "https://discord.gg/bGnPn96Qwt",
  github: "https://github.com/PredictionExplorer/Cosmic-Signature",
  githubMain: "https://github.com/PredictionExplorer/Cosmic-Signature/tree/main",
  githubDocs: "https://github.com/PredictionExplorer/Cosmic-Signature/tree/main/docs",
} as const;