// Game Constants (Mock data for now - will be replaced with blockchain data later)

export const MOCK_CURRENT_ROUND = {
  roundNumber: 234,
  prizePool: 12.5,
  lastBidder: "0x1234...5678",
  totalBids: 47,
  ethBidPrice: 0.0023,
  cstBidPrice: 45.2,
  timeRemaining: 9252, // seconds
  isActive: true,
  enduranceChampion: {
    address: "alice.eth",
    duration: 2700, // 45 minutes in seconds
  },
  chronoWarrior: {
    address: "bob.eth",
    duration: 1380, // 23 minutes in seconds
  },
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
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
  { href: "/contracts", label: "Contracts" },
  { href: "/about", label: "About" },
] as const;
