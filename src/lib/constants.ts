// Navigation Links Configuration

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
